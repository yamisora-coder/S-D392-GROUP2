package com.group2.aives.presentation.controller;
import com.group2.aives.application.service.AttemptService;import com.group2.aives.domain.model.User;import com.group2.aives.domain.model.enums.Role;import com.group2.aives.domain.repository.ExamSessionRepository;
import jakarta.servlet.http.HttpServletRequest;import lombok.RequiredArgsConstructor;import org.springframework.web.bind.annotation.*;import org.springframework.http.*;import java.util.*;import java.nio.charset.StandardCharsets;
@RestController @RequiredArgsConstructor
public class TranscriptController {
 private final AttemptService attempts;private final ExamSessionRepository sessions;
 @GetMapping("/api/sessions/{id}/transcript") public ResponseEntity<byte[]> download(@PathVariable UUID id,HttpServletRequest request) throws Exception {
  var actor=(User)request.getAttribute("actor");var a=attempts.get(id,actor);
  if(actor.getRole()==Role.STUDENT&&!a.path("submitted").asBoolean())throw new org.springframework.web.server.ResponseStatusException(HttpStatus.CONFLICT,"Nộp bài trước khi tải transcript");
  var session=sessions.findById(id).orElseThrow();var text=new StringBuilder("\ufeffAIVES — TRANSCRIPT VẤN ĐÁP\n");
  text.append("Kỳ thi: ").append(session.getExam().getTitle()).append("\nSinh viên: ").append(session.getStudent().getCode()).append("\nCa thi: ").append(id).append("\nĐã nộp: ").append(a.path("submitted")).append("\n");
  for(var q:a.path("questions")){
   String qid=q.path("id").asText();text.append("\nCÂU HỎI: ").append(q.path("content").asText()).append("\nBloom: ").append(q.path("bloomLevel").asText()).append("\n");
   for(var answer:a.path("answers"))if(answer.path("questionId").asText().equals(qid))text.append("SINH VIÊN: ").append(answer.path("text").asText()).append("\n");
   for(var turn:a.path("followups"))if(turn.path("questionId").asText().equals(qid))text.append("AI [").append(turn.path("askedAt").asText()).append("]: ").append(turn.path("question").asText()).append("\nSINH VIÊN [").append(turn.path("answeredAt").asText("")).append("]: ").append(turn.path("answer").asText("Chưa trả lời")).append("\n");
  }
  if(session.getFinalTeacherScore()!=null)text.append("\nĐiểm giảng viên duyệt: ").append(session.getFinalTeacherScore()).append("/10\nNhận xét: ").append(Objects.requireNonNullElse(session.getTeacherFeedback(),""));
  if(actor.getRole()!=Role.STUDENT)text.append("\nKết quả AI theo rubric: ").append(a.path("grading").toPrettyString());
  return ResponseEntity.ok().contentType(new MediaType("text","plain",StandardCharsets.UTF_8)).header(HttpHeaders.CONTENT_DISPOSITION,ContentDisposition.attachment().filename("transcript-"+id+".txt").build().toString()).cacheControl(CacheControl.noStore()).body(text.toString().getBytes(StandardCharsets.UTF_8));
 }
}
