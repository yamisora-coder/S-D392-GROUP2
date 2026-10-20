package com.group2.aives;
import com.fasterxml.jackson.databind.*;import com.fasterxml.jackson.databind.node.*;
import com.group2.aives.domain.model.*;import com.group2.aives.domain.model.enums.*;import com.group2.aives.infrastructure.persistence.jpa.*;
import org.junit.jupiter.api.Test;import org.springframework.beans.factory.annotation.Autowired;import org.springframework.http.MediaType;import org.springframework.mock.web.MockMultipartFile;import java.time.LocalDateTime;import java.util.*;
import static org.junit.jupiter.api.Assertions.*;import static org.mockito.Mockito.*;import static org.mockito.ArgumentMatchers.*;import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
class HardeningIntegrationTest extends WorkflowIntegrationTest {
 @Autowired AttemptRecordingJpaRepository recordings;
 UUID id;String qid;
 void fixture(boolean timed) throws Exception {
  var subject=subjects.save(Subject.builder().code("HARD"+suffix).name("Hardening test").build());
  var q=call(post("/api/questions").header("Authorization",instructor).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("subjectId",subject.getId(),"content","Explain DI","sampleAnswer","PRIVATE REFERENCE","bloomLevel","UNDERSTAND","status","APPROVED","rubrics",List.of(Map.of("criteriaName","Knowledge","maxScore",10,"description","0 wrong 10 complete"))))));qid=q.path("id").asText();
  var exam=exams.save(Exam.builder().subject(subject).title("Timing and recording test").maxMainQuestions(1).maxFollowupQuestions(2).durationPerStudentMins(15).answerTimeSeconds(timed?15:null).build());
  id=sessions.save(ExamSession.builder().exam(exam).student(User.builder().id(studentId).build()).scheduledStartTime(LocalDateTime.now().minusSeconds(1)).build()).getId();call(post("/api/sessions/"+id+"/start").header("Authorization",student));
 }
 JsonNode send(String suffix,Map<String,Object> body) throws Exception {return call(post("/api/sessions/"+id+suffix).header("Authorization",student).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)));}
 @Test void settingsPersistAndAreRestrictedAndAuditIsReal() throws Exception {
  var original=call(get("/api/admin/settings").header("Authorization",admin));
  var input=json.valueToTree(Map.of("model","test-model","temperature",0.1,"followupTimeoutSeconds",10,"answerTimeSeconds",90,"recordingRetentionDays",7));
  try {
   mvc.perform(put("/api/admin/settings").header("Authorization",student).contentType(MediaType.APPLICATION_JSON).content(input.toString())).andExpect(status().isForbidden());
   mvc.perform(put("/api/admin/settings").header("Authorization",instructor).contentType(MediaType.APPLICATION_JSON).content(input.toString())).andExpect(status().isForbidden());
   assertEquals(input,call(put("/api/admin/settings").header("Authorization",admin).contentType(MediaType.APPLICATION_JSON).content(input.toString())));
   assertEquals("test-model",call(get("/api/admin/settings").header("Authorization",admin)).path("model").asText());
   var audit=call(get("/api/admin/audit").header("Authorization",admin));boolean recorded=false;for(var e:audit)if(e.path("target").asText().equals("/api/admin/settings")&&e.path("action").asText().equals("PUT"))recorded=true;assertTrue(recorded);assertFalse(audit.toString().contains("Password@123"));
   ((ObjectNode)input).put("answerTimeSeconds",1);mvc.perform(put("/api/admin/settings").header("Authorization",admin).contentType(MediaType.APPLICATION_JSON).content(input.toString())).andExpect(status().isBadRequest());
  }finally{call(put("/api/admin/settings").header("Authorization",admin).contentType(MediaType.APPLICATION_JSON).content(original.toString()));}
 }
 @Test void timerDoesNotResetAndRejectsLateAnswers() throws Exception {
  fixture(true);var original=call(get("/api/sessions/"+id+"/attempt").header("Authorization",student)).path("answerDeadlines").path(qid).asText();
  assertEquals(original,send("/question",Map.of("questionId",qid)).path("answerDeadlines").path(qid).asText());
  var a=attempts.findById(id).orElseThrow();a.setAnswerDeadlinesJson(json.writeValueAsString(Map.of(qid,LocalDateTime.now().minusSeconds(5).toString())));attempts.save(a);
  mvc.perform(post("/api/sessions/"+id+"/responses").header("Authorization",student).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("questionId",qid,"text","late")))).andExpect(status().isConflict());
  mvc.perform(post("/api/sessions/"+id+"/answers").header("Authorization",student).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("answers",List.of(Map.of("questionId",qid,"text","bypass")))))).andExpect(status().isBadRequest());
 }
 @Test void timedAnswerAndFollowupHaveSeparateDeadlines() throws Exception {
  fixture(true);send("/responses",Map.of("questionId",qid,"text","DI supplies dependencies externally"));
  var teacher=call(get("/api/sessions/"+id+"/attempt").header("Authorization",instructor));String rid=teacher.path("questions").get(0).path("rubrics").get(0).path("id").asText();
  when(ai.followup(anyString(),anyString(),any(JsonNode.class))).thenReturn(json.valueToTree(Map.of("question","Give an example?","rubricId",rid)));
  var next=send("/follow-up",Map.of("questionId",qid));assertFalse(next.path("followups").get(0).path("answerDeadline").asText().isBlank());
  send("/responses",Map.of("questionId",qid,"followupId",next.path("followups").get(0).path("id").asText(),"text","A mock is passed through the constructor."));
  send("/answers",Map.of("answers",List.of(Map.of("questionId",qid,"text","DI supplies dependencies externally"))));
 }
 @Test void transcriptDownloadIsOwnedAndHidesReferenceAnswer() throws Exception {
  fixture(false);send("/answers",Map.of("answers",List.of(Map.of("questionId",qid,"text","My own answer"))));
  var result=mvc.perform(get("/api/sessions/"+id+"/transcript").header("Authorization",student)).andExpect(status().isOk()).andReturn().getResponse();
  String text=result.getContentAsString(java.nio.charset.StandardCharsets.UTF_8);assertTrue(text.contains("My own answer"));assertFalse(text.contains("PRIVATE REFERENCE"));assertTrue(result.getHeader("Content-Disposition").contains("attachment"));
  String other=createUserWithCode("OTHER"+suffix);mvc.perform(get("/api/sessions/"+id+"/transcript").header("Authorization",other)).andExpect(status().isForbidden());
 }
 @Test void recordingNeedsConsentSupportsRetryAndWithdrawal() throws Exception {
  fixture(false);String recordingId=UUID.randomUUID().toString();byte[] bytes={0x1A,0x45,(byte)0xDF,(byte)0xA3,0,1,2};
  var file=new MockMultipartFile("file","audio.webm","audio/webm",bytes);
  mvc.perform(multipart("/api/sessions/"+id+"/recordings").file(file).param("sequence","0").param("recordingId",recordingId).header("Authorization",student)).andExpect(status().isForbidden());
  send("/recording-consent",Map.of("accepted",true));
  for(int i=0;i<2;i++)call(multipart("/api/sessions/"+id+"/recordings").file(file).param("sequence","0").param("recordingId",recordingId).header("Authorization",student));
  assertEquals(1,call(get("/api/sessions/"+id+"/recordings").header("Authorization",student)).size());
  assertArrayEquals(bytes,mvc.perform(get("/api/sessions/"+id+"/recordings/0").header("Authorization",instructor)).andExpect(status().isOk()).andReturn().getResponse().getContentAsByteArray());
  String other=createUserWithCode("RECOTHER"+suffix);mvc.perform(get("/api/sessions/"+id+"/recordings/0").header("Authorization",other)).andExpect(status().isForbidden());
  mvc.perform(delete("/api/sessions/"+id+"/recordings").header("Authorization",student)).andExpect(status().isOk());assertFalse(recordings.findById(id+":0").isPresent());assertNull(attempts.findById(id).orElseThrow().getRecordingConsentAt());
 }
 @Test void expiredRecordingsAreUnavailable() throws Exception {
  fixture(false);var row=new AttemptRecording();row.setId(id+":0");row.setSessionId(id);row.setSequence(0);row.setRecordingId(UUID.randomUUID().toString());row.setContentType("audio/webm");row.setData(new byte[]{1});row.setBytes(1);row.setExpiresAt(LocalDateTime.now().minusSeconds(1));recordings.save(row);
  assertEquals(0,call(get("/api/sessions/"+id+"/recordings").header("Authorization",student)).size());mvc.perform(get("/api/sessions/"+id+"/recordings/0").header("Authorization",student)).andExpect(status().isGone());recordings.removeExpired(LocalDateTime.now());assertFalse(recordings.existsById(id+":0"));
 }
 @Test void retrievalFindsRelevantPagesAndPersistsIndex() throws Exception {
  UUID chapter=chapter();var material=call(multipart("/api/chapters/"+chapter+"/materials").file(new MockMultipartFile("file","source.txt","text/plain",("Unrelated gardening content. ".repeat(100)+"Dependency injection supplies dependencies. Constructor injection permits unit testing using mocks. ".repeat(20)).getBytes())).header("Authorization",instructor));
  var result=call(get("/api/materials/"+material.path("id").asText()+"/search").param("q","dependency injection").header("Authorization",instructor));assertTrue(result.size()>0);assertTrue(result.get(0).path("text").asText().toLowerCase().contains("dependency"));assertTrue(result.get(0).path("score").asDouble()>0);
  mvc.perform(get("/api/materials/"+material.path("id").asText()+"/search").param("q","dependency").header("Authorization",student)).andExpect(status().isForbidden());
 }
}
