package com.group2.aives.presentation.controller;
import com.fasterxml.jackson.databind.JsonNode;
import com.group2.aives.application.service.AttemptService;
import com.group2.aives.domain.model.User;
import com.group2.aives.domain.repository.ExamSessionRepository;
import com.group2.aives.infrastructure.persistence.jpa.AttemptJpaRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequiredArgsConstructor
public class AttemptController {
    private final com.group2.aives.application.service.VivaDialogueService dialogue;private final AttemptService service;private final ExamSessionRepository sessions;private final AttemptJpaRepository attempts;
    private User actor(HttpServletRequest r){return (User)r.getAttribute("actor");}
    @PostMapping("/api/sessions/{id}/start") public JsonNode start(@PathVariable UUID id,HttpServletRequest r) throws Exception{return service.start(id,actor(r));}
    @GetMapping("/api/sessions/{id}/attempt") public JsonNode get(@PathVariable UUID id,HttpServletRequest r) throws Exception{return service.get(id,actor(r));}
    @PostMapping("/api/sessions/{id}/answers") public JsonNode submit(@PathVariable UUID id,@RequestBody JsonNode body,HttpServletRequest r) throws Exception{return service.submit(id,actor(r),body);}
    @PostMapping("/api/sessions/{id}/ai-grade") public JsonNode grade(@PathVariable UUID id,@RequestParam(required=false) String model,HttpServletRequest r) throws Exception{return service.grade(id,actor(r),model);}
    @PostMapping("/api/sessions/{id}/question") public JsonNode activate(@PathVariable UUID id,@RequestBody JsonNode body,HttpServletRequest r) throws Exception{return service.activate(id,actor(r),body);}
    @PostMapping("/api/sessions/{id}/responses") public JsonNode respond(@PathVariable UUID id,@RequestBody JsonNode body,HttpServletRequest r) throws Exception{return dialogue.respond(id,actor(r),body);}
    @PostMapping("/api/sessions/{id}/follow-up") public JsonNode followup(@PathVariable UUID id,@RequestBody JsonNode body,HttpServletRequest r) throws Exception{return dialogue.generate(id,actor(r),body);}
    @GetMapping("/api/admin/ai-results") public List<Map<String,Object>> results() {
        return sessions.findAll().stream().filter(s->s.getAiSuggestedScore()!=null).map(s->{Map<String,Object> row=new LinkedHashMap<>();row.put("sessionId",s.getId());row.put("student",s.getStudent().getFullName());row.put("exam",s.getExam().getTitle());row.put("aiScore",s.getAiSuggestedScore());row.put("teacherScore",s.getFinalTeacherScore());row.put("feedback",s.getTeacherFeedback());row.put("grading",attempts.findById(s.getId()).map(a->a.getGradingJson()).orElse(null));return row;}).toList();
    }
}
