package com.group2.aives.application.service;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import com.group2.aives.domain.model.*;
import com.group2.aives.domain.model.enums.*;
import com.group2.aives.domain.repository.*;
import com.group2.aives.infrastructure.persistence.jpa.AttemptJpaRepository;
import com.group2.aives.infrastructure.config.AiClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.*;
@Service @RequiredArgsConstructor
public class AttemptService {
    private final ExamSessionRepository sessions;private final QuestionService questions;private final AttemptJpaRepository attempts;private final ObjectMapper json;private final AiClient ai;private final GradingFormat gradingFormat;
    private ExamSession authorized(UUID id,User actor) {
        var s=sessions.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Ca thi không tồn tại"));
        if(actor.getRole()==Role.STUDENT && !s.getStudent().getId().equals(actor.getId()))throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Ca thi không thuộc tài khoản");return s;
    }
    @Transactional public JsonNode start(UUID id,User actor) throws Exception {
        var s=authorized(id,actor);var existing=attempts.findById(id);
        if(existing.isPresent())return view(existing.get(),actor);
        if(s.getStatus()!=ExamSessionStatus.SCHEDULED)throw new IllegalArgumentException("Ca thi không thể bắt đầu");
        var now=LocalDateTime.now();var end=s.getScheduledStartTime().plusMinutes(s.getExam().getDurationPerStudentMins());
        if(now.isBefore(s.getScheduledStartTime()) || !now.isBefore(end))throw new IllegalArgumentException("Chưa đến giờ hoặc đã hết ca thi");
        var pool=new ArrayList<>(questions.getQuestions(s.getExam().getSubject().getId(),null,QuestionStatus.APPROVED));
        pool.removeIf(q->q.getRubrics()==null || q.getRubrics().isEmpty() || Math.abs(q.getTotalRubricScore()-10)>0.001);
        if(pool.size()<s.getExam().getMaxMainQuestions())throw new IllegalArgumentException("Chưa đủ câu hỏi đã duyệt có rubric");
        Collections.shuffle(pool);var selected=pool.subList(0,s.getExam().getMaxMainQuestions());
        var a=new ExamAttempt();a.setSessionId(id);a.setStartedAt(now);a.setDeadline(end);a.setQuestionsJson(json.writeValueAsString(selected));a.setMaxFollowupsPerQuestion(s.getExam().getMaxFollowupQuestions());a.setAnswerTimeSeconds(s.getExam().getAnswerTimeSeconds());
        if(a.getAnswerTimeSeconds()!=null && a.getAnswerTimeSeconds()>0)startAnswerTimer(a,selected.get(0).getId().toString());
        attempts.save(a);s.setStatus(ExamSessionStatus.IN_PROGRESS);sessions.save(s);return view(a,actor);
    }
    @Transactional(readOnly=true) public JsonNode get(UUID id,User actor) throws Exception {authorized(id,actor);return view(find(id),actor);}
    private void startAnswerTimer(ExamAttempt a,String qid) throws Exception {
        ObjectNode timers=a.getAnswerDeadlinesJson()==null?json.createObjectNode():(ObjectNode)json.readTree(a.getAnswerDeadlinesJson());
        if(!timers.has(qid)){var deadline=LocalDateTime.now().plusSeconds(a.getAnswerTimeSeconds());if(deadline.isAfter(a.getDeadline()))deadline=a.getDeadline();timers.put(qid,deadline.toString());a.setAnswerDeadlinesJson(json.writeValueAsString(timers));}
    }
    @Transactional public JsonNode activate(UUID id,User actor,JsonNode body) throws Exception {
        authorized(id,actor);if(actor.getRole()!=Role.STUDENT)throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        var a=find(id);if(a.getSubmittedAt()!=null || LocalDateTime.now().isAfter(a.getDeadline()))throw new ResponseStatusException(HttpStatus.CONFLICT,"Bài đã nộp hoặc hết giờ");
        String qid=body.path("questionId").asText();boolean valid=false;for(var q:json.readTree(a.getQuestionsJson()))if(q.path("id").asText().equals(qid))valid=true;
        if(!valid)throw new IllegalArgumentException("Câu hỏi không thuộc đề thi");
        if(a.getAnswerTimeSeconds()!=null && a.getAnswerTimeSeconds()>0){startAnswerTimer(a,qid);attempts.saveAndFlush(a);}return view(a,actor);
    }
    private ExamAttempt find(UUID id){return attempts.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Chưa bắt đầu ca thi"));}
    JsonNode view(ExamAttempt a,User actor) throws Exception {
        ObjectNode out=json.createObjectNode();out.put("sessionId",a.getSessionId().toString());out.put("deadline",a.getDeadline().atZone(java.time.ZoneId.systemDefault()).toOffsetDateTime().toString());out.put("submitted",a.getSubmittedAt()!=null);
        var timers=a.getAnswerDeadlinesJson()==null?json.createObjectNode():json.readTree(a.getAnswerDeadlinesJson());
        out.put("answerTimeSeconds",a.getAnswerTimeSeconds()==null?0:a.getAnswerTimeSeconds());
        var publicTimers=json.createObjectNode();timers.fields().forEachRemaining(e->publicTimers.put(e.getKey(),LocalDateTime.parse(e.getValue().asText()).atZone(java.time.ZoneId.systemDefault()).toOffsetDateTime().toString()));out.set("answerDeadlines",publicTimers);
        JsonNode qs=json.readTree(a.getQuestionsJson());
        if(actor.getRole()==Role.STUDENT && a.getSubmittedAt()==null && a.getAnswerTimeSeconds()!=null && a.getAnswerTimeSeconds()>0)for(var q:qs)if(!timers.has(q.path("id").asText()))((ObjectNode)q).put("content","Chọn câu này để bắt đầu tính giờ.");
        if(actor.getRole()==Role.STUDENT)for(var q:qs)((ObjectNode)q).remove(List.of("sampleAnswer","rubrics","sourceReference"));
        out.set("questions",qs);out.set("answers",a.getAnswersJson()==null?json.createArrayNode():json.readTree(a.getAnswersJson()));
        out.put("maxFollowupsPerQuestion",a.getMaxFollowupsPerQuestion()==null?0:a.getMaxFollowupsPerQuestion());
        var turns=a.getFollowupsJson()==null?json.createArrayNode():json.readTree(a.getFollowupsJson());
        if(actor.getRole()==Role.STUDENT)for(var turn:turns)((ObjectNode)turn).remove("rubricId");
        for(var turn:turns)if(turn.hasNonNull("answerDeadline"))((ObjectNode)turn).put("answerDeadline",LocalDateTime.parse(turn.path("answerDeadline").asText()).atZone(java.time.ZoneId.systemDefault()).toOffsetDateTime().toString());
        out.set("followups",turns);
        if(actor.getRole()!=Role.STUDENT)out.set("grading",a.getGradingJson()==null?json.nullNode():json.readTree(a.getGradingJson()));return out;
    }
    @Transactional public JsonNode submit(UUID id,User actor,JsonNode input) throws Exception {
        authorized(id,actor);var a=find(id);
        if(a.getSubmittedAt()!=null)return view(a,actor);
        if(LocalDateTime.now().isAfter(a.getDeadline().plusSeconds(30)))throw new IllegalArgumentException("Đã quá hạn nộp bài");
        var answers=input.path("answers");if(!answers.isArray())throw new IllegalArgumentException("Thiếu danh sách câu trả lời");
        Set<String> valid=new HashSet<>();for(var q:json.readTree(a.getQuestionsJson()))valid.add(q.path("id").asText());
        Set<String> seen=new HashSet<>();
        for(var answer:answers) {
            String qid=answer.path("questionId").asText();
            if(!valid.contains(qid) || !seen.add(qid) || !answer.path("text").isTextual() || answer.path("text").asText().length()>20000)throw new IllegalArgumentException("Câu trả lời không hợp lệ");
        }
        if(!seen.equals(valid))throw new IllegalArgumentException("Phải gửi một câu trả lời cho mỗi câu hỏi (có thể để trống)");
        if(a.getAnswersJson()!=null)for(var sent:json.readTree(a.getAnswersJson()))for(var answer:answers)
            if(sent.path("questionId").equals(answer.path("questionId")) && !sent.path("text").equals(answer.path("text")))throw new IllegalArgumentException("Không thể sửa câu trả lời đã gửi hỏi xoáy");
        if(a.getAnswerTimeSeconds()!=null && a.getAnswerTimeSeconds()>0)for(var answer:answers)if(!answer.path("text").asText().isBlank()){
            boolean sent=false;if(a.getAnswersJson()!=null)for(var previous:json.readTree(a.getAnswersJson()))if(previous.path("questionId").equals(answer.path("questionId")))sent=true;
            if(!sent)throw new IllegalArgumentException("Gửi từng câu trả lời trước khi nộp bài để kiểm tra thời gian");
        }
        a.setAnswersJson(json.writeValueAsString(answers));a.setSubmittedAt(LocalDateTime.now());attempts.save(a);return view(a,actor);
    }
    @Transactional public JsonNode grade(UUID id,User actor,String requestedModel) throws Exception {
        if(requestedModel!=null && actor.getRole()==Role.STUDENT)throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Chỉ giảng viên hoặc Admin có thể chọn model chấm lại.");
        var s=authorized(id,actor);var a=find(id);
        if(a.getSubmittedAt()==null)throw new IllegalArgumentException("Chưa nộp bài");
        if(a.getGradingJson()!=null)return view(a,actor);
        var snapshots=json.readTree(a.getQuestionsJson());
        var answers=json.readTree(a.getAnswersJson()).deepCopy();
        var turns=a.getFollowupsJson()==null?json.createArrayNode():json.readTree(a.getFollowupsJson());
        for(var answer:answers)for(var turn:turns)if(turn.path("questionId").equals(answer.path("questionId")) && !turn.path("answer").asText("").isBlank())
            ((ObjectNode)answer).put("text",answer.path("text").asText()+"\n\n"+turn.path("answer").asText());
        String gradingInstruction="Grade ALL supplied questions and ALL rubric criteria in Vietnamese. Return an object whose questions keys are the exact questionId strings; each question contains criteria keyed by its exact rubricId strings, matching the supplied JSON Schema. Do not output an array. Score only the student's answer against the frozen rubric and reference answer. Empty answers receive zero. For evidenceId, select the id of a relevant provided evidenceChoices entry for this question. Never write evidence text yourself. Use NONE only when there is no supporting evidence or the answer is empty. Keep explanations brief. Do not invent IDs or a total score.";
        var gradingData=(ObjectNode)gradingFormat.input(snapshots,answers);gradingData.set("followupDialogue",turns);
        String gradingInput=json.writeValueAsString(gradingData);
        var schema=gradingFormat.schema(snapshots,answers);
        var wire=requestedModel==null?ai.completeStructured(gradingInstruction,gradingInput,schema):ai.completeStructuredWithModel(requestedModel,gradingInstruction,gradingInput,schema);

        var result=gradingFormat.normalize(wire,snapshots,answers);
        var results=result.path("questions");
        if(!results.isArray()||results.size()!=snapshots.size())throw new IllegalArgumentException("AI thiếu kết quả câu hỏi");
        Map<String,JsonNode> byQuestion=new HashMap<>();for(var r:results)if(byQuestion.put(r.path("questionId").asText(),r)!=null)throw new IllegalArgumentException("AI trùng câu hỏi");
        double total=0;
        for(var q:snapshots) {
            String answerText="";for(var answer:answers)if(answer.path("questionId").asText().equals(q.path("id").asText()))answerText=answer.path("text").asText();
            var r=byQuestion.get(q.path("id").asText());if(r==null || !r.path("criteria").isArray() || r.path("criteria").size()!=q.path("rubrics").size())throw new IllegalArgumentException("AI thiếu tiêu chí");
            Map<String,JsonNode> criteria=new HashMap<>();for(var criterion:r.path("criteria"))if(criteria.put(criterion.path("rubricId").asText(),criterion)!=null)throw new IllegalArgumentException("AI trùng tiêu chí");
            double score=0;
            for(var rubric:q.path("rubrics")) {
                var mark=criteria.get(rubric.path("id").asText());
                if(mark==null || !mark.path("score").isNumber() || !Double.isFinite(mark.path("score").asDouble()) || mark.path("score").asDouble()<0 || mark.path("score").asDouble()>rubric.path("maxScore").asDouble() || !mark.path("explanation").isTextual() || !mark.path("evidence").isTextual())throw new IllegalArgumentException("AI trả điểm hoặc bằng chứng không hợp lệ");
                if(answerText.isBlank() && mark.path("score").asDouble()!=0)throw new IllegalArgumentException("AI không được cho điểm câu trả lời trống");
                if(!mark.path("evidence").asText().isBlank() && !answerText.contains(mark.path("evidence").asText()))throw new IllegalArgumentException("Bằng chứng AI không có trong câu trả lời");
                score+=mark.path("score").asDouble();
            }
            total+=score;
        }
        double normalized=Math.round(total/snapshots.size()*100.0)/100.0;
        if(requestedModel!=null)result.put("model",requestedModel);
        ((ObjectNode)result).put("totalScore",normalized);a.setGradingJson(json.writeValueAsString(result));attempts.save(a);
        s.setAiSuggestedScore(normalized);sessions.save(s);return view(a,actor);
    }
}
