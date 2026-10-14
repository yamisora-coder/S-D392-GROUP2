package com.group2.aives.application.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.group2.aives.application.dto.request.SubmitAnswerRequest;
import com.group2.aives.application.dto.response.InterviewTurnResponse;
import com.group2.aives.application.port.in.AiInterviewService;
import com.group2.aives.application.port.out.*;
import com.group2.aives.domain.enums.TurnType;
import com.group2.aives.domain.model.*;
import com.group2.aives.infrastructure.ai.OpenAiClient;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiInterviewServiceImpl implements AiInterviewService {

    private final ExamSessionRepository examSessionRepository;
    private final SessionTurnRepository sessionTurnRepository;
    private final ExamQuestionRepository examQuestionRepository;
    private final TranscriptRepository transcriptRepository;
    private final AiGradingSuggestionRepository aiGradingSuggestionRepository;
    private final OpenAiClient openAiClient;
    private final ObjectMapper objectMapper;

    // ── Public methods ────────────────────────────────────────────────────────

    @Override
    @Transactional
    public InterviewTurnResponse startSession(Long sessionId) {
        ExamSession session = getSessionOrThrow(sessionId);

        if (!"ONGOING".equals(session.getStatus())) {
            throw new RuntimeException("Phiên thi đã kết thúc hoặc không ở trạng thái có thể bắt đầu.");
        }

        List<SessionTurn> existingTurns = sessionTurnRepository
                .findBySession_SessionIdOrderBySequenceNumberAsc(sessionId);

        if (!existingTurns.isEmpty()) {
            // Tìm lượt chưa trả lời cuối cùng
            for (int i = existingTurns.size() - 1; i >= 0; i--) {
                SessionTurn t = existingTurns.get(i);
                if (transcriptRepository.findByTurn_TurnId(t.getTurnId()).isEmpty()) {
                    return buildTurnResponse(t, session, null);
                }
            }
            // Tất cả đã trả lời
            return buildCompleteResponse(session);
        }

        // Phiên mới: tạo lượt hỏi đầu tiên
        List<ExamQuestion> questions = examQuestionRepository
                .findByExam_ExamIdOrderByQuestionOrderAsc(session.getExam().getExamId());

        if (questions.isEmpty()) {
            throw new RuntimeException("Đề thi chưa có câu hỏi nào. Giảng viên cần thêm câu hỏi vào đề thi.");
        }

        int timeLimitPerQ = calcTimeLimitPerQuestion(session.getExam(), questions.size());
        ExamQuestion firstQ = questions.get(0);

        SessionTurn firstTurn = SessionTurn.builder()
                .session(session)
                .question(firstQ.getQuestion())
                .turnType(TurnType.MAIN)
                .questionText(firstQ.getQuestion().getQuestionText())
                .sequenceNumber(1)
                .timeLimitSeconds(timeLimitPerQ)
                .build();

        firstTurn = sessionTurnRepository.save(firstTurn);
        log.info("Phiên {} bắt đầu — câu hỏi 1/{}", sessionId, questions.size());
        return buildTurnResponse(firstTurn, session, null);
    }

    @Override
    @Transactional
    public InterviewTurnResponse submitAnswer(Long sessionId, Long turnId, SubmitAnswerRequest request) {
        ExamSession session = getSessionOrThrow(sessionId);

        if (!"ONGOING".equals(session.getStatus())) {
            throw new RuntimeException("Phiên thi đã kết thúc.");
        }

        SessionTurn turn = sessionTurnRepository.findById(turnId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lượt hỏi ID: " + turnId));

        if (!turn.getSession().getSessionId().equals(sessionId)) {
            throw new RuntimeException("Lượt hỏi này không thuộc phiên thi " + sessionId);
        }

        if (transcriptRepository.findByTurn_TurnId(turnId).isPresent()) {
            throw new RuntimeException("Câu trả lời đã được ghi nhận cho lượt này.");
        }

        // 1. Lưu transcript (kết quả STT từ frontend)
        Transcript transcript = Transcript.builder()
                .turn(turn)
                .sttText(request.getSttText().trim())
                .studentAudioUrl(request.getAudioUrl())
                .answerDurationSeconds(request.getAnswerDurationSeconds())
                .build();
        transcriptRepository.save(transcript);

        // 2. Lấy từ khoá rubric làm ngữ cảnh chấm điểm
        String rubricKeywords = extractRubricKeywords(turn);

        // 3. Gọi AI phân tích câu trả lời
        AiDecision decision;
        try {
            decision = callAiForDecision(turn.getQuestionText(), request.getSttText(), rubricKeywords);
        } catch (Exception e) {
            log.error("AI phân tích lỗi (phiên {}, lượt {}): {}", sessionId, turnId, e.getMessage());
            decision = AiDecision.fallback();
        }

        // 4. Lưu gợi ý chấm điểm của AI
        saveAiGradingSuggestion(turn, decision);

        // 5. Xác định câu hỏi tiếp theo
        SessionTurn mainTurn = TurnType.MAIN.equals(turn.getTurnType()) ? turn : turn.getParentTurn();
        int followUpCount = countFollowUps(sessionId, mainTurn.getTurnId());
        int maxFollowUp = session.getExam().getMaxFollowUpPerQ();

        boolean doFollowUp = decision.isShouldAskFollowUp()
                && followUpCount < maxFollowUp
                && decision.getFollowUpQuestion() != null
                && !decision.getFollowUpQuestion().isBlank();

        if (doFollowUp) {
            int nextSeq = nextSequenceNumber(sessionId);
            SessionTurn followUpTurn = SessionTurn.builder()
                    .session(session)
                    .question(mainTurn.getQuestion())
                    .parentTurn(mainTurn)
                    .turnType(TurnType.FOLLOW_UP)
                    .questionText(decision.getFollowUpQuestion())
                    .sequenceNumber(nextSeq)
                    .timeLimitSeconds(60)
                    .build();
            followUpTurn = sessionTurnRepository.save(followUpTurn);
            log.info("Phiên {} — hỏi xoáy #{}", sessionId, followUpCount + 1);
            return buildTurnResponse(followUpTurn, session, decision.getReason());
        }

        // Chuyển sang câu hỏi chính tiếp theo
        return advanceToNextMainQuestion(session, mainTurn);
    }

    @Override
    @Transactional(readOnly = true)
    public InterviewTurnResponse getCurrentTurn(Long sessionId) {
        ExamSession session = getSessionOrThrow(sessionId);

        if ("COMPLETED".equals(session.getStatus())) {
            return buildCompleteResponse(session);
        }

        List<SessionTurn> turns = sessionTurnRepository
                .findBySession_SessionIdOrderBySequenceNumberAsc(sessionId);

        for (int i = turns.size() - 1; i >= 0; i--) {
            SessionTurn t = turns.get(i);
            if (transcriptRepository.findByTurn_TurnId(t.getTurnId()).isEmpty()) {
                return buildTurnResponse(t, session, null);
            }
        }

        return buildCompleteResponse(session);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InterviewTurnResponse> getSessionTurns(Long sessionId) {
        ExamSession session = getSessionOrThrow(sessionId);

        return sessionTurnRepository
                .findBySession_SessionIdOrderBySequenceNumberAsc(sessionId)
                .stream()
                .map(t -> buildTurnResponse(t, session, null))
                .collect(Collectors.toList());
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private InterviewTurnResponse advanceToNextMainQuestion(ExamSession session, SessionTurn currentMainTurn) {
        List<ExamQuestion> questions = examQuestionRepository
                .findByExam_ExamIdOrderByQuestionOrderAsc(session.getExam().getExamId());

        Long currentQId = currentMainTurn.getQuestion().getQuestionId();
        int currentIndex = -1;
        for (int i = 0; i < questions.size(); i++) {
            if (questions.get(i).getQuestion().getQuestionId().equals(currentQId)) {
                currentIndex = i;
                break;
            }
        }

        int nextIndex = currentIndex + 1;

        if (nextIndex >= questions.size()) {
            // Hết câu hỏi → kết thúc phiên
            session.setStatus("COMPLETED");
            session.setEndedAt(LocalDateTime.now());
            examSessionRepository.save(session);
            log.info("Phiên {} đã hoàn thành.", session.getSessionId());
            return buildCompleteResponse(session);
        }

        ExamQuestion nextQ = questions.get(nextIndex);
        int timeLimitPerQ = calcTimeLimitPerQuestion(session.getExam(), questions.size());
        int nextSeq = nextSequenceNumber(session.getSessionId());

        SessionTurn nextTurn = SessionTurn.builder()
                .session(session)
                .question(nextQ.getQuestion())
                .turnType(TurnType.MAIN)
                .questionText(nextQ.getQuestion().getQuestionText())
                .sequenceNumber(nextSeq)
                .timeLimitSeconds(timeLimitPerQ)
                .build();
        nextTurn = sessionTurnRepository.save(nextTurn);
        log.info("Phiên {} — câu hỏi chính {}/{}", session.getSessionId(), nextIndex + 1, questions.size());
        return buildTurnResponse(nextTurn, session, null);
    }

    private AiDecision callAiForDecision(String questionText, String studentAnswer, String rubricKeywords) {
        String systemPrompt =
            "Bạn là giám khảo vấn đáp đại học có nhiều năm kinh nghiệm. " +
            "Nhiệm vụ: đánh giá câu trả lời của sinh viên và quyết định có cần hỏi xoáy thêm không. " +
            "Hỏi thêm khi câu trả lời còn mơ hồ, thiếu ý quan trọng, hoặc mâu thuẫn với câu hỏi. " +
            "Không hỏi thêm khi câu trả lời đã đầy đủ và đúng trọng tâm. " +
            "Câu hỏi xoáy phải ngắn gọn, cụ thể, giúp sinh viên bổ sung ý còn thiếu. " +
            "Luôn trả lời bằng tiếng Việt. Trả về JSON object hợp lệ.";

        String userPrompt = String.format(
            "Câu hỏi vấn đáp: \"%s\"\n" +
            "Câu trả lời của sinh viên: \"%s\"\n" +
            "Tiêu chí & từ khoá chấm điểm: %s\n\n" +
            "Trả về JSON:\n" +
            "{\n" +
            "  \"shouldAskFollowUp\": true,\n" +
            "  \"followUpQuestion\": \"Câu hỏi hỏi xoáy cụ thể\",\n" +
            "  \"reason\": \"Lý do cần hỏi thêm (ý còn thiếu/mơ hồ)\",\n" +
            "  \"suggestedScore\": 7.5,\n" +
            "  \"strengths\": \"Điểm mạnh trong câu trả lời\",\n" +
            "  \"weaknesses\": \"Điểm yếu hoặc sai sót\",\n" +
            "  \"missingPoints\": \"Những ý quan trọng còn thiếu\"\n" +
            "}",
            questionText,
            studentAnswer,
            rubricKeywords.isBlank() ? "(không có tiêu chí cụ thể)" : rubricKeywords
        );

        String content = openAiClient.callChatCompletion(systemPrompt, userPrompt);

        try {
            JsonNode root = objectMapper.readTree(content);
            AiDecision d = new AiDecision();
            d.setShouldAskFollowUp(root.path("shouldAskFollowUp").asBoolean(false));
            d.setFollowUpQuestion(root.path("followUpQuestion").asText(null));
            d.setReason(root.path("reason").asText(null));
            d.setSuggestedScore(root.path("suggestedScore").asDouble(5.0));
            d.setStrengths(root.path("strengths").asText(null));
            d.setWeaknesses(root.path("weaknesses").asText(null));
            d.setMissingPoints(root.path("missingPoints").asText(null));
            return d;
        } catch (Exception e) {
            log.error("Lỗi parse JSON từ AI: {}", e.getMessage());
            return AiDecision.fallback();
        }
    }

    private void saveAiGradingSuggestion(SessionTurn turn, AiDecision decision) {
        if (aiGradingSuggestionRepository.findByTurn_TurnId(turn.getTurnId()).isPresent()) {
            return;
        }
        AiGradingSuggestion suggestion = AiGradingSuggestion.builder()
                .turn(turn)
                .suggestedScore(BigDecimal.valueOf(decision.getSuggestedScore()))
                .strengths(decision.getStrengths())
                .weaknesses(decision.getWeaknesses())
                .missingPoints(decision.getMissingPoints())
                .build();
        aiGradingSuggestionRepository.save(suggestion);
    }

    private String extractRubricKeywords(SessionTurn turn) {
        if (turn.getQuestion() == null || turn.getQuestion().getRubric() == null) {
            return "";
        }
        Rubric rubric = turn.getQuestion().getRubric();
        return rubric.getCriteria().stream()
                .filter(c -> c.getExpectedAnswerKeywords() != null && !c.getExpectedAnswerKeywords().isBlank())
                .map(c -> c.getCriterionName() + ": " + c.getExpectedAnswerKeywords())
                .collect(Collectors.joining("; "));
    }

    private int countFollowUps(Long sessionId, Long mainTurnId) {
        return (int) sessionTurnRepository
                .findBySession_SessionIdOrderBySequenceNumberAsc(sessionId)
                .stream()
                .filter(t -> TurnType.FOLLOW_UP.equals(t.getTurnType()))
                .filter(t -> t.getParentTurn() != null && t.getParentTurn().getTurnId().equals(mainTurnId))
                .count();
    }

    private int nextSequenceNumber(Long sessionId) {
        List<SessionTurn> turns = sessionTurnRepository
                .findBySession_SessionIdOrderBySequenceNumberAsc(sessionId);
        return turns.isEmpty() ? 1 : turns.get(turns.size() - 1).getSequenceNumber() + 1;
    }

    private int calcTimeLimitPerQuestion(Exam exam, int questionCount) {
        int totalSeconds = exam.getDurationMinutes() * 60;
        return Math.max(60, totalSeconds / questionCount);
    }

    private InterviewTurnResponse buildTurnResponse(SessionTurn turn, ExamSession session, String aiFeedback) {
        SessionTurn mainTurn = TurnType.MAIN.equals(turn.getTurnType()) ? turn : turn.getParentTurn();
        int followUpCount = mainTurn != null
                ? countFollowUps(session.getSessionId(), mainTurn.getTurnId())
                : 0;

        // Lấy transcript nếu đã có
        String studentAnswer = null;
        var transcript = transcriptRepository.findByTurn_TurnId(turn.getTurnId()).orElse(null);
        if (transcript != null) {
            studentAnswer = transcript.getSttText();
        }

        // Lấy AI grading suggestion nếu đã có
        Double suggestedScore = null;
        String strengths = null, weaknesses = null, missingPoints = null;
        var suggestion = aiGradingSuggestionRepository.findByTurn_TurnId(turn.getTurnId()).orElse(null);
        if (suggestion != null) {
            suggestedScore = suggestion.getSuggestedScore() != null ? suggestion.getSuggestedScore().doubleValue() : null;
            strengths = suggestion.getStrengths();
            weaknesses = suggestion.getWeaknesses();
            missingPoints = suggestion.getMissingPoints();
        }

        return InterviewTurnResponse.builder()
                .turnId(turn.getTurnId())
                .sessionId(session.getSessionId())
                .questionId(turn.getQuestion() != null ? turn.getQuestion().getQuestionId() : null)
                .turnType(turn.getTurnType().name())
                .questionText(turn.getQuestionText())
                .timeLimitSeconds(turn.getTimeLimitSeconds())
                .sequenceNumber(turn.getSequenceNumber())
                .followUpCount(followUpCount)
                .maxFollowUpAllowed(session.getExam().getMaxFollowUpPerQ())
                .sessionStatus(session.getStatus())
                .aiFeedback(aiFeedback)
                .nextAction("ANSWER_REQUIRED")
                .studentAnswer(studentAnswer)
                .suggestedScore(suggestedScore)
                .strengths(strengths)
                .weaknesses(weaknesses)
                .missingPoints(missingPoints)
                .build();
    }

    private InterviewTurnResponse buildCompleteResponse(ExamSession session) {
        return InterviewTurnResponse.builder()
                .sessionId(session.getSessionId())
                .sessionStatus(session.getStatus())
                .nextAction("SESSION_COMPLETE")
                .aiFeedback("Phiên vấn đáp đã hoàn thành. Cảm ơn bạn đã tham gia!")
                .build();
    }

    private ExamSession getSessionOrThrow(Long sessionId) {
        return examSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiên thi ID: " + sessionId));
    }

    // ── Inner class: kết quả phân tích AI ────────────────────────────────────

    @Getter
    @Setter
    private static class AiDecision {
        private boolean shouldAskFollowUp;
        private String followUpQuestion;
        private String reason;
        private double suggestedScore;
        private String strengths;
        private String weaknesses;
        private String missingPoints;

        static AiDecision fallback() {
            AiDecision d = new AiDecision();
            d.setShouldAskFollowUp(false);
            d.setSuggestedScore(5.0);
            d.setStrengths("Không thể đánh giá tự động — giảng viên vui lòng chấm thủ công.");
            d.setWeaknesses("");
            d.setMissingPoints("");
            return d;
        }
    }
}
