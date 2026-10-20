package com.group2.aives;
import com.fasterxml.jackson.databind.*;
import com.group2.aives.application.dto.request.RegisterRequest;
import com.group2.aives.application.service.UserService;
import com.group2.aives.domain.model.*;
import com.group2.aives.domain.model.enums.*;
import com.group2.aives.domain.repository.*;
import com.group2.aives.infrastructure.config.AiClient;
import com.group2.aives.infrastructure.persistence.jpa.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.*;
import java.time.LocalDateTime;
import java.util.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:workflows;DB_CLOSE_DELAY=-1","spring.datasource.driver-class-name=org.h2.Driver","spring.datasource.username=sa","spring.datasource.password=","spring.jpa.database-platform=org.hibernate.dialect.H2Dialect","spring.jpa.hibernate.ddl-auto=create-drop","spring.jpa.show-sql=false","aives.demo.enabled=false","aives.admin.email="})
@AutoConfigureMockMvc
class WorkflowIntegrationTest {
    @Autowired MockMvc mvc;@Autowired ObjectMapper json;@Autowired UserService users;
    @Autowired SubjectRepository subjects;@Autowired ExamRepository exams;@Autowired ExamSessionRepository sessions;
    @Autowired QuestionRepository questions;@Autowired AttemptJpaRepository attempts;
    @MockBean AiClient ai;
    String admin,student,instructor;UUID studentId;String suffix;
    @BeforeEach void setup() throws Exception {
        suffix=UUID.randomUUID().toString().substring(0,8);
        admin=createUser(Role.ADMIN);instructor=createUser(Role.INSTRUCTOR);student=createUser(Role.STUDENT);
        studentId=UUID.fromString(call(get("/api/auth/me").header("Authorization",student)).path("id").asText());
    }
    String createUser(Role role) throws Exception {
        String code=role+suffix;users.registerUser(RegisterRequest.builder().code(code).fullName("Test "+role).email(code.toLowerCase()+"@example.com").password("Password@123").role(role).build());
        return "Bearer "+call(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("emailOrCode",code,"password","Password@123")))).path("accessToken").asText();
    }
    JsonNode call(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder req) throws Exception {
        var result=mvc.perform(req).andReturn();assertTrue(result.getResponse().getStatus()<300,result.getResponse().getContentAsString());return json.readTree(result.getResponse().getContentAsString());
    }
    Map<String,Object> registration(){return Map.of("code","NEW"+suffix,"email","new"+suffix+"@example.com","fullName","New Admin","password","Password@123","role","STUDENT");}
    @Test void adminRegistrationCreatesRealAdminAndCanLogin() throws Exception {
        var created=call(post("/api/admin/users/admins").header("Authorization",admin).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(registration())));
        assertEquals("ADMIN",created.path("role").asText());assertTrue(created.path("isAdmin").asBoolean());assertFalse(created.has("passwordHash"));
        var login=call(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("emailOrCode","NEW"+suffix,"password","Password@123"))));
        assertTrue(login.path("isAdmin").asBoolean());
        mvc.perform(get("/api/users").header("Authorization","Bearer "+login.path("accessToken").asText())).andExpect(status().isOk());
    }
    @Test void adminRegistrationRequiresAdmin() throws Exception {
        String body=json.writeValueAsString(registration());
        mvc.perform(post("/api/admin/users/admins").contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isUnauthorized());
        for(String token:List.of(student,instructor))mvc.perform(post("/api/admin/users/admins").header("Authorization",token).contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isForbidden());
    }
    @Test void publicSignupCannotEscalateRole() throws Exception {
        var data=new HashMap<>(registration());data.put("role","ADMIN");
        var user=call(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(data)));
        assertEquals("STUDENT",user.path("role").asText());assertFalse(user.path("isAdmin").asBoolean());
    }
    @Test void duplicateRegistrationReturnsConflict() throws Exception {
        String body=json.writeValueAsString(registration());call(post("/api/admin/users/admins").header("Authorization",admin).contentType(MediaType.APPLICATION_JSON).content(body));
        mvc.perform(post("/api/admin/users/admins").header("Authorization",admin).contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isConflict());
    }
    @Test void invalidRegistrationIsRejected() throws Exception {
        mvc.perform(post("/api/admin/users/admins").header("Authorization",admin).contentType(MediaType.APPLICATION_JSON).content("{} ")).andExpect(status().isBadRequest());
    }
    @Test void lockingUserInvalidatesExistingToken() throws Exception {
        call(patch("/api/users/"+studentId+"/status").header("Authorization",admin));
        mvc.perform(get("/api/auth/me").header("Authorization",student)).andExpect(status().isUnauthorized());
    }
    @Test void logoutRevokesToken() throws Exception {
        mvc.perform(post("/api/auth/logout").header("Authorization",student)).andExpect(status().isNoContent());
        mvc.perform(get("/api/auth/me").header("Authorization",student)).andExpect(status().isUnauthorized());
    }
    UUID chapter() throws Exception {
        Subject s=subjects.save(Subject.builder().code("SWD"+suffix).name("Software Design").build());
        return UUID.fromString(call(post("/api/chapters").header("Authorization",instructor).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("subjectId",s.getId(),"title","Architecture","position",1)))).path("id").asText());
    }
    @Test void importsCsvRubricsAndRejectsInvalidRowsAtomically() throws Exception {
        UUID chapter=chapter();String header="question_code,chapter_id,content,bloom,difficulty,sample_answer,rubric_name,max_score,scoring_description\n";
        String csv=header+"Q1,"+chapter+",Explain layered,UNDERSTAND,EASY,Layers,Knowledge,4,0 wrong 4 complete\nQ1,"+chapter+",Explain layered,UNDERSTAND,EASY,Layers,Reasoning,3,0 absent 3 correct\nQ1,"+chapter+",Explain layered,UNDERSTAND,EASY,Layers,Example,3,0 absent 3 relevant\n";
        var result=call(multipart("/api/questions/import").file(new MockMultipartFile("file","questions.csv","text/csv",csv.getBytes())).header("Authorization",instructor));
        assertEquals(1,result.size());assertEquals("DRAFT",result.get(0).path("status").asText());assertEquals(3,result.get(0).path("rubrics").size());
        long before=questions.count();String bad=csv+"Q2,invalid,broken,REMEMBER,EASY,x,y,10,z\n";
        mvc.perform(multipart("/api/questions/import").file(new MockMultipartFile("file","bad.csv","text/csv",bad.getBytes())).header("Authorization",instructor)).andExpect(status().isBadRequest());assertEquals(before,questions.count());
    }
    @org.junit.jupiter.params.ParameterizedTest @org.junit.jupiter.params.provider.EnumSource(BloomLevel.class)
    void uploadsExtractedMaterialAndGeneratesDraftWithRubrics(BloomLevel bloom) throws Exception {
        UUID chapter=chapter();var m=call(multipart("/api/chapters/"+chapter+"/materials").file(new MockMultipartFile("file","chapter.txt","text/plain","Layered architecture separates presentation, domain and persistence.".getBytes())).header("Authorization",instructor));
        when(ai.completeStructured(anyString(),anyString(),any(JsonNode.class))).thenReturn(json.readTree("{\"questions\":[{\"content\":\"Explain layered architecture\",\"sampleAnswer\":\"Separation of layers\",\"sourceReference\":\"page 1: Layered architecture separates\",\"rubrics\":[{\"criteriaName\":\"Knowledge\",\"maxScore\":10,\"description\":\"0 wrong, 5 partial, 10 complete\"}]}]}"));
        var result=call(post("/api/chapters/"+chapter+"/generate").header("Authorization",instructor).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("materialId",m.path("id").asText(),"bloomLevel",bloom.name(),"difficulty","MEDIUM","count",1))));
        assertEquals(bloom.name(),result.get(0).path("bloomLevel").asText());
        assertEquals("DRAFT",result.get(0).path("status").asText());assertEquals(chapter.toString(),result.get(0).path("chapterId").asText());assertEquals(10,result.get(0).path("totalRubricScore").asDouble());
    }
    @Test void generationReceiptMakesRetryIdempotentAndRejectsChangedPayload() throws Exception {
        UUID chapter=chapter();var material=call(multipart("/api/chapters/"+chapter+"/materials").file(new MockMultipartFile("file","batch.txt","text/plain","DI separates dependencies. Constructor injection enables mocks. Interfaces allow substitution.".getBytes())).header("Authorization",instructor));
        var output=json.createObjectNode();var list=output.putArray("questions");
        for(int i=0;i<3;i++){var q=list.addObject();q.put("content","Question "+i).put("sampleAnswer","Answer").put("sourceReference","Page 1: DI separates dependencies");q.putArray("rubrics").addObject().put("criteriaName","Knowledge").put("maxScore",10).put("description","0 incorrect 10 complete");}
        when(ai.completeStructured(anyString(),anyString(),any(JsonNode.class))).thenAnswer(inv->{var schema=(JsonNode)inv.getArgument(2);assertEquals(output.path("questions").size(),schema.path("properties").path("questions").path("minItems").asInt());assertEquals(output.path("questions").size(),schema.path("properties").path("questions").path("maxItems").asInt());return output;});
        var body=new HashMap<String,Object>();body.put("materialId",material.path("id").asText());body.put("bloomLevel","UNDERSTAND");body.put("difficulty","MEDIUM");body.put("count",3);body.put("batchId",UUID.randomUUID());body.put("excludeContents",List.of());
        String path="/api/chapters/"+chapter+"/generate",payload=json.writeValueAsString(body);long before=questions.count();
        var first=call(post(path).header("Authorization",instructor).contentType(MediaType.APPLICATION_JSON).content(payload));
        var again=call(post(path).header("Authorization",instructor).contentType(MediaType.APPLICATION_JSON).content(payload));
        assertEquals(first,again);assertEquals(before+3,questions.count());verify(ai,times(1)).completeStructured(anyString(),anyString(),any(JsonNode.class));
        body.put("count",2);mvc.perform(post(path).header("Authorization",instructor).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body))).andExpect(status().isConflict());
    }
    @Test void failedGenerationRollsBackBatchAndCanRetrySameReceipt() throws Exception {
        UUID chapter=chapter();var material=call(multipart("/api/chapters/"+chapter+"/materials").file(new MockMultipartFile("file","batch.txt","text/plain","DI separates dependencies.".getBytes())).header("Authorization",instructor));
        var output=json.createObjectNode();var list=output.putArray("questions");
        for(int i=0;i<2;i++){var q=list.addObject();q.put("content","Question "+i).put("sampleAnswer","Answer").put("sourceReference","Page 1: DI separates dependencies");q.putArray("rubrics").addObject().put("criteriaName","Knowledge").put("maxScore",i==0?10:9).put("description","Score bands");}
        when(ai.completeStructured(anyString(),anyString(),any(JsonNode.class))).thenAnswer(inv->{var schema=(JsonNode)inv.getArgument(2);assertEquals(output.path("questions").size(),schema.path("properties").path("questions").path("minItems").asInt());assertEquals(output.path("questions").size(),schema.path("properties").path("questions").path("maxItems").asInt());return output;});
        var body=new HashMap<String,Object>();body.put("materialId",material.path("id").asText());body.put("bloomLevel","UNDERSTAND");body.put("difficulty","MEDIUM");body.put("count",2);body.put("batchId",UUID.randomUUID());body.put("excludeContents",List.of("Earlier question"));
        String path="/api/chapters/"+chapter+"/generate",payload=json.writeValueAsString(body);long before=questions.count();
        mvc.perform(post(path).header("Authorization",instructor).contentType(MediaType.APPLICATION_JSON).content(payload)).andExpect(status().isBadRequest());assertEquals(before,questions.count());
        ((com.fasterxml.jackson.databind.node.ObjectNode)list.get(1).path("rubrics").get(0)).put("maxScore",10);
        assertEquals(2,call(post(path).header("Authorization",instructor).contentType(MediaType.APPLICATION_JSON).content(payload)).size());assertEquals(before+2,questions.count());
        body.put("batchId",UUID.randomUUID());body.put("excludeContents",List.of("Question 0"));
        mvc.perform(post(path).header("Authorization",instructor).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body))).andExpect(status().isBadRequest());assertEquals(before+2,questions.count());
    }
    @Test void approvalRequiresRubric() throws Exception {
        Subject s=subjects.save(Subject.builder().code("NO"+suffix).name("No rubric").build());
        var q=call(post("/api/questions").header("Authorization",instructor).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("subjectId",s.getId(),"content","Question","bloomLevel","REMEMBER"))));
        mvc.perform(patch("/api/questions/"+q.path("id").asText()+"/status").param("status","APPROVED").header("Authorization",instructor)).andExpect(status().isBadRequest());
    }
    @Test void examSnapshotsAnswersAndGradingArePersistedAndIsolated() throws Exception {
        Subject subject=subjects.save(Subject.builder().code("EX"+suffix).name("Exam").build());
        var q=call(post("/api/questions").header("Authorization",instructor).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("subjectId",subject.getId(),"content","Explain architecture","sampleAnswer","Reference secret","bloomLevel","UNDERSTAND","status","APPROVED","rubrics",List.of(Map.of("criteriaName","Knowledge","maxScore",10,"description","0 wrong 10 complete"))))));
        Exam exam=exams.save(Exam.builder().subject(subject).title("Viva").maxMainQuestions(1).durationPerStudentMins(15).build());
        var session=sessions.save(ExamSession.builder().exam(exam).student(User.builder().id(studentId).build()).scheduledStartTime(LocalDateTime.now().minusMinutes(1)).build());
        UUID id=session.getId();var attempt=call(post("/api/sessions/"+id+"/start").header("Authorization",student));
        assertFalse(attempt.path("questions").get(0).has("sampleAnswer"));assertFalse(attempt.path("questions").get(0).has("rubrics"));
        var entity=questions.findById(UUID.fromString(q.path("id").asText())).orElseThrow();entity.setContent("Changed later");questions.save(entity);
        assertEquals("Explain architecture",call(get("/api/sessions/"+id+"/attempt").header("Authorization",instructor)).path("questions").get(0).path("content").asText());
        String other=createUserWithCode("OTHER"+suffix);mvc.perform(get("/api/sessions/"+id+"/attempt").header("Authorization",other)).andExpect(status().isForbidden());
        call(post("/api/sessions/"+id+"/answers").header("Authorization",student).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("answers",List.of(Map.of("questionId",q.path("id").asText(),"text","My answer"))))));
        assertNotNull(attempts.findById(id).orElseThrow().getAnswersJson());
        var grade=json.createObjectNode();var marks=grade.putArray("questions").addObject();marks.put("questionId",q.path("id").asText());var rubric=marks.putArray("criteria").addObject();rubric.put("rubricId",q.path("rubrics").get(0).path("id").asText());rubric.put("score",8);rubric.put("evidenceId","E1");rubric.put("explanation","Partial knowledge");var wire=json.createObjectNode();wire.putObject("questions").putObject(q.path("id").asText()).putObject("criteria").set(q.path("rubrics").get(0).path("id").asText(),rubric);
        when(ai.completeStructured(anyString(),anyString(),any(JsonNode.class))).thenReturn(wire);
        call(post("/api/sessions/"+id+"/ai-grade").header("Authorization",instructor));assertEquals(8,sessions.findById(id).orElseThrow().getAiSuggestedScore());
        call(patch("/api/sessions/"+id+"/grade").header("Authorization",instructor).contentType(MediaType.APPLICATION_JSON).content("{\"finalTeacherScore\":8.5,\"teacherFeedback\":\"Reviewed\"}"));
        assertEquals(8.5,sessions.findById(id).orElseThrow().getFinalTeacherScore());
        mvc.perform(get("/api/admin/ai-results").header("Authorization",admin)).andExpect(status().isOk());
        mvc.perform(get("/api/admin/ai-results").header("Authorization",student)).andExpect(status().isForbidden());
    }
    @Test void extractsPdfAndPptxByPageAndSlide() throws Exception {
        UUID chapter=chapter();
        byte[] pdf;
        try(var doc=new org.apache.pdfbox.pdmodel.PDDocument();var out=new java.io.ByteArrayOutputStream()) {
            var page=new org.apache.pdfbox.pdmodel.PDPage();doc.addPage(page);
            try(var content=new org.apache.pdfbox.pdmodel.PDPageContentStream(doc,page)) {
                content.beginText();content.setFont(new org.apache.pdfbox.pdmodel.font.PDType1Font(org.apache.pdfbox.pdmodel.font.Standard14Fonts.FontName.HELVETICA),12);content.newLineAtOffset(30,700);content.showText("Layered architecture PDF source");content.endText();
            }
            doc.save(out);pdf=out.toByteArray();
        }
        byte[] pptx;
        try(var deck=new org.apache.poi.xslf.usermodel.XMLSlideShow();var out=new java.io.ByteArrayOutputStream()) {
            deck.createSlide().createTextBox().setText("Layered architecture PPTX source");deck.write(out);pptx=out.toByteArray();
        }
        var pdfResult=call(multipart("/api/chapters/"+chapter+"/materials").file(new MockMultipartFile("file","chapter.pdf","application/pdf",pdf)).header("Authorization",instructor));
        var pptResult=call(multipart("/api/chapters/"+chapter+"/materials").file(new MockMultipartFile("file","chapter.pptx","application/vnd.openxmlformats-officedocument.presentationml.presentation",pptx)).header("Authorization",instructor));
        assertTrue(pdfResult.path("chunksJson").asText().contains("PDF source"));assertTrue(pptResult.path("chunksJson").asText().contains("PPTX source"));
        assertEquals(1,json.readTree(pdfResult.path("chunksJson").asText()).get(0).path("page").asInt());
        assertNotEquals(pdfResult.path("id").asText(),pptResult.path("id").asText());
    }
    @Test void importsXlsxWithRubric() throws Exception {
        UUID chapter=chapter();byte[] bytes;
        try(var book=new org.apache.poi.xssf.usermodel.XSSFWorkbook();var out=new java.io.ByteArrayOutputStream()) {
            var sheet=book.createSheet("Questions");String[] headers={"question_code","chapter_id","content","bloom","difficulty","sample_answer","rubric_name","max_score","scoring_description"};
            var row=sheet.createRow(0);for(int i=0;i<headers.length;i++)row.createCell(i).setCellValue(headers[i]);
            String[] values={"XLSX1",chapter.toString(),"Explain layers","UNDERSTAND","MEDIUM","Three layers","Knowledge","10","0 wrong; 5 partial; 10 complete"};
            row=sheet.createRow(1);for(int i=0;i<values.length;i++)row.createCell(i).setCellValue(values[i]);book.write(out);bytes=out.toByteArray();
        }
        var result=call(multipart("/api/questions/import").file(new MockMultipartFile("file","questions.xlsx","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",bytes)).header("Authorization",instructor));
        assertEquals("DRAFT",result.get(0).path("status").asText());assertEquals(10,result.get(0).path("totalRubricScore").asDouble());
    }
    String createUserWithCode(String code) throws Exception {
        users.registerUser(RegisterRequest.builder().code(code).fullName("Other").email(code+"@example.com").password("Password@123").role(Role.STUDENT).build());
        return "Bearer "+call(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("emailOrCode",code,"password","Password@123")))).path("accessToken").asText();
    }

    @Test void diagnosticsRequireTeacherOrAdmin() throws Exception {
        when(ai.check()).thenReturn(Map.of("ok",true,"model","mock-model","message","Connected"));
        mvc.perform(post("/api/ai/check")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/ai/check").header("Authorization",student)).andExpect(status().isForbidden());
        mvc.perform(post("/api/ai/check").header("Authorization",instructor)).andExpect(status().isOk()).andExpect(jsonPath("$.ok").value(true));
        mvc.perform(post("/api/ai/check").header("Authorization",admin)).andExpect(status().isOk());
    }

    @Test void studentsCannotOverrideGradingModel() throws Exception {
        mvc.perform(post("/api/sessions/"+UUID.randomUUID()+"/ai-grade").param("model","another-model").header("Authorization",student)).andExpect(status().isForbidden());
    }
}
