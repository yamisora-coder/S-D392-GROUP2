package com.group2.aives;
import com.fasterxml.jackson.databind.*;
import com.group2.aives.domain.model.*;
import com.group2.aives.domain.model.enums.*;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import java.time.LocalDateTime;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
class VivaDialogueIntegrationTest extends WorkflowIntegrationTest {
    UUID id;String qid,rid;
    void fixture() throws Exception {
        Subject subject=subjects.save(Subject.builder().code("DIALOG"+suffix).name("Viva dialogue").build());
        var q=call(post("/api/questions").header("Authorization",instructor).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("subjectId",subject.getId(),"content","Explain dependency injection","sampleAnswer","Dependencies are supplied externally","bloomLevel","UNDERSTAND","status","APPROVED","rubrics",List.of(Map.of("criteriaName","Knowledge","maxScore",10,"description","0 incorrect 10 complete"))))));
        qid=q.path("id").asText();rid=q.path("rubrics").get(0).path("id").asText();
        var exam=exams.save(Exam.builder().subject(subject).title("Dialogue test").maxMainQuestions(1).maxFollowupQuestions(2).durationPerStudentMins(15).build());
        id=sessions.save(ExamSession.builder().exam(exam).student(User.builder().id(studentId).build()).scheduledStartTime(LocalDateTime.now().minusMinutes(1)).build()).getId();
        call(post("/api/sessions/"+id+"/start").header("Authorization",student));
    }
    JsonNode send(String endpoint,Map<String,Object> body) throws Exception {
        return call(post("/api/sessions/"+id+"/"+endpoint).header("Authorization",student).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)));
    }
    void answer() throws Exception {send("responses",Map.of("questionId",qid,"text","Dependencies are provided externally."));}
    void mockQuestion(String text) throws Exception {doReturn(json.valueToTree(Map.of("question",text,"rubricId",rid))).when(ai).followup(anyString(),anyString(),any(JsonNode.class));}
    @Test void dialogueSurvivesRefreshAndGradesFollowupEvidence() throws Exception {
        fixture();answer();mockQuestion("What supplies these dependencies?");
        var first=send("follow-up",Map.of("questionId",qid));assertEquals(1,first.path("followups").size());assertFalse(first.path("followups").get(0).has("rubricId"));
        send("follow-up",Map.of("questionId",qid));verify(ai,times(1)).followup(anyString(),anyString(),any(JsonNode.class));
        String fid=first.path("followups").get(0).path("id").asText();
        send("responses",Map.of("questionId",qid,"followupId",fid,"text","The Spring container supplies them."));
        mockQuestion("How does constructor injection help testing?");
        var second=send("follow-up",Map.of("questionId",qid));assertEquals(2,second.path("followups").size());
        send("responses",Map.of("questionId",qid,"followupId",second.path("followups").get(1).path("id").asText(),"text","Tests can pass a fake dependency."));
        mvc.perform(post("/api/sessions/"+id+"/follow-up").header("Authorization",student).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("questionId",qid)))).andExpect(status().isConflict());
        var refreshed=call(get("/api/sessions/"+id+"/attempt").header("Authorization",student));assertEquals(2,refreshed.path("followups").size());
        send("answers",Map.of("answers",List.of(Map.of("questionId",qid,"text","Dependencies are provided externally."))));
        when(ai.completeStructured(anyString(),anyString(),any(JsonNode.class))).thenAnswer(inv->{
            var input=json.readTree((String)inv.getArgument(1));assertEquals(2,input.path("followupDialogue").size());
            assertTrue(input.path("questions").get(0).path("studentAnswer").asText().contains("fake dependency"));
            return json.valueToTree(Map.of("questions",Map.of(qid,Map.of("criteria",Map.of(rid,Map.of("score",9,"evidenceId","E2","explanation","Correct container explanation"))))));
        });
        send("ai-grade",Map.of());var teacher=call(get("/api/sessions/"+id+"/attempt").header("Authorization",instructor));
        assertEquals("The Spring container supplies them.",teacher.path("grading").path("questions").get(0).path("criteria").get(0).path("evidence").asText());
    }
    @Test void providerFailureKeepsAnswerAndRetryWorks() throws Exception {
        fixture();answer();when(ai.followup(anyString(),anyString(),any(JsonNode.class))).thenThrow(new IllegalArgumentException("Provider unavailable"));
        mvc.perform(post("/api/sessions/"+id+"/follow-up").header("Authorization",student).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("questionId",qid)))).andExpect(status().isBadRequest());
        var saved=call(get("/api/sessions/"+id+"/attempt").header("Authorization",student));assertEquals(1,saved.path("answers").size());assertEquals(0,saved.path("followups").size());
        mockQuestion("Give an example?");assertEquals(1,send("follow-up",Map.of("questionId",qid)).path("followups").size());
    }
    @Test void rejectsOtherActorsLateAndSubmittedAttempts() throws Exception {
        fixture();answer();String body=json.writeValueAsString(Map.of("questionId",qid));
        String other=createOtherStudent();
        for(String token:List.of(other,instructor,admin))mvc.perform(post("/api/sessions/"+id+"/follow-up").header("Authorization",token).contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isForbidden());
        var a=attempts.findById(id).orElseThrow();a.setDeadline(LocalDateTime.now().minusSeconds(2));attempts.save(a);
        mvc.perform(post("/api/sessions/"+id+"/follow-up").header("Authorization",student).contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isConflict());
        send("answers",Map.of("answers",List.of(Map.of("questionId",qid,"text","Dependencies are provided externally."))));
        mvc.perform(post("/api/sessions/"+id+"/responses").header("Authorization",student).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("questionId",qid,"text","changed")))).andExpect(status().isConflict());
        verifyNoInteractions(ai);
    }
    @Test void rejectsMissingMainAnswerForeignQuestionAndInvalidAiRubric() throws Exception {
        fixture();String body=json.writeValueAsString(Map.of("questionId",qid));
        mvc.perform(post("/api/sessions/"+id+"/follow-up").header("Authorization",student).contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isBadRequest());
        mvc.perform(post("/api/sessions/"+id+"/responses").header("Authorization",student).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("questionId",UUID.randomUUID(),"text","test")))).andExpect(status().isBadRequest());
        verifyNoInteractions(ai);answer();
        doReturn(json.valueToTree(Map.of("question","Question?","rubricId",UUID.randomUUID().toString()))).when(ai).followup(anyString(),anyString(),any(JsonNode.class));
        mvc.perform(post("/api/sessions/"+id+"/follow-up").header("Authorization",student).contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isBadRequest());
        assertNull(attempts.findById(id).orElseThrow().getFollowupsJson());
        assertNotNull(attempts.findById(id).orElseThrow().getAnswersJson());
    }
    String createOtherStudent() throws Exception {suffix=UUID.randomUUID().toString().substring(0,8);return createUser(Role.STUDENT);}
    @Test void mainAnswerCannotBeRewrittenAtSubmission() throws Exception {
        fixture();answer();
        mvc.perform(post("/api/sessions/"+id+"/answers").header("Authorization",student).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("answers",List.of(Map.of("questionId",qid,"text","changed")))))).andExpect(status().isBadRequest());
        assertNull(attempts.findById(id).orElseThrow().getSubmittedAt());
    }
}
