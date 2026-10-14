package com.group2.aives.application.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.group2.aives.application.dto.request.GradeSubmissionRequest;
import com.group2.aives.application.dto.response.GradingReviewResponse;
import com.group2.aives.application.dto.response.GradingReviewResponse.CriterionInfo;
import com.group2.aives.application.dto.response.GradingReviewResponse.FinalGradeInfo;
import com.group2.aives.application.dto.response.GradingReviewResponse.QuestionReview;
import com.group2.aives.application.dto.response.GradingReviewResponse.TurnReview;
import com.group2.aives.application.dto.response.GradingSessionSummaryResponse;
import com.group2.aives.application.port.in.AiGradingService;
import com.group2.aives.application.port.out.AiGradingSuggestionRepository;
import com.group2.aives.application.port.out.ExamQuestionRepository;
import com.group2.aives.application.port.out.ExamSessionRepository;
import com.group2.aives.application.port.out.FinalGradeRepository;
import com.group2.aives.application.port.out.SessionTurnRepository;
import com.group2.aives.application.port.out.TranscriptRepository;
import com.group2.aives.application.port.out.UserRepository;
import com.group2.aives.domain.enums.RoleEnum;
import com.group2.aives.domain.enums.TurnType;
import com.group2.aives.domain.exception.AppException;
import com.group2.aives.domain.exception.BadRequestException;
import com.group2.aives.domain.exception.ResourceNotFoundException;
import com.group2.aives.domain.exception.UnauthorizedException;
import com.group2.aives.domain.model.AiGradingSuggestion;
import com.group2.aives.domain.model.ExamQuestion;
import com.group2.aives.domain.model.ExamSession;
import com.group2.aives.domain.model.FinalGrade;
import com.group2.aives.domain.model.Question;
import com.group2.aives.domain.model.RubricCriterion;
import com.group2.aives.domain.model.SessionTurn;
import com.group2.aives.domain.model.Transcript;
import com.group2.aives.domain.model.User;
import com.group2.aives.infrastructure.ai.OpenAiClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiGradingServiceImpl implements AiGradingService {

    private static final BigDecimal MAX_SCORE = BigDecimal.TEN;
    private static final String STATUS_COMPLETED = "COMPLETED";

    // Trùng với nội dung AiInterviewServiceImpl.AiDecision.fallback() lưu khi AI lỗi trong lúc thi
    private static final String INTERVIEW_FALLBACK_MARKER = "Không thể đánh giá tự động";

    private final ExamSessionRepository examSessionRepository;
    private final SessionTurnRepository sessionTurnRepository;
    private final ExamQuestionRepository examQuestionRepository;
    private final TranscriptRepository transcriptRepository;
    private final AiGradingSuggestionRepository aiGradingSuggestionRepository;
    private final FinalGradeRepository finalGradeRepository;
    private final UserRepository userRepository;
    private final OpenAiClient openAiClient;
    private final ObjectMapper objectMapper;

    // ── Public methods ────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<GradingSessionSummaryResponse> getGradableSessions(String currentUserEmail) {
        User grader = getGraderOrThrow(currentUserEmail);

        return examSessionRepository.findAll().stream()
                .filter(session -> canGrade(grader, session))
                .sorted(Comparator.comparing(ExamSession::getStartedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::buildSummary)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public GradingReviewResponse getReview(Long sessionId, String currentUserEmail) {
        ExamSession session = getSessionForGrader(sessionId, currentUserEmail);
        return buildReview(session, null);
    }

    @Override
    @Transactional
    public GradingReviewResponse regradeSession(Long sessionId, boolean onlyMissing, String currentUserEmail) {
        ExamSession session = getSessionForGrader(sessionId, currentUserEmail);
        requireCompleted(session);

        List<SessionTurn> turns = sessionTurnRepository.findBySession_SessionIdOrderBySequenceNumberAsc(sessionId);
        List<Long> failed = new ArrayList<>();

        for (SessionTurn turn : turns) {
            Transcript transcript = transcriptRepository.findByTurn_TurnId(turn.getTurnId()).orElse(null);
            if (transcript == null) {
                continue;
            }
            if (onlyMissing && hasValidSuggestion(turn.getTurnId())) {
                continue;
            }
            if (!gradeTurnWithAi(turn, turns)) {
                failed.add(turn.getTurnId());
            }
        }

        log.info("Ca thi {} — AI chấm lại xong, {} lượt lỗi", sessionId, failed.size());
        return buildReview(session, failed);
    }

    @Override
    @Transactional
    public GradingReviewResponse regradeTurn(Long sessionId, Long turnId, String currentUserEmail) {
        ExamSession session = getSessionForGrader(sessionId, currentUserEmail);
        requireCompleted(session);

        List<SessionTurn> turns = sessionTurnRepository.findBySession_SessionIdOrderBySequenceNumberAsc(sessionId);
        SessionTurn turn = turns.stream()
                .filter(t -> t.getTurnId().equals(turnId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy lượt hỏi " + turnId + " trong ca thi " + sessionId));

        if (transcriptRepository.findByTurn_TurnId(turnId).isEmpty()) {
            throw new BadRequestException("Sinh viên chưa trả lời lượt hỏi này nên chưa thể chấm.");
        }

        List<Long> failed = gradeTurnWithAi(turn, turns) ? List.of() : List.of(turnId);
        return buildReview(session, failed);
    }

    @Override
    @Transactional
    public GradingReviewResponse confirmFinalGrade(Long sessionId, GradeSubmissionRequest request,
                                                   String currentUserEmail) {
        User grader = getGraderOrThrow(currentUserEmail);
        ExamSession session = getSessionOrThrow(sessionId);
        requireCanGrade(grader, session);
        requireCompleted(session);

        FinalGrade finalGrade = finalGradeRepository.findBySession_SessionId(sessionId)
                .orElseGet(() -> FinalGrade.builder().session(session).build());

        String feedback = request.getFeedback() == null ? null : request.getFeedback().trim();
        finalGrade.setConfirmedBy(grader);
        finalGrade.setFinalScore(request.getFinalScore().setScale(2, RoundingMode.HALF_UP));
        finalGrade.setLecturerFeedback(feedback == null || feedback.isEmpty() ? null : feedback);
        finalGradeRepository.save(finalGrade);
        session.setFinalGrade(finalGrade);

        log.info("Ca thi {} — giảng viên {} chốt điểm {}", sessionId, grader.getEmail(), finalGrade.getFinalScore());
        return buildReview(session, null);
    }

    // ── Quyền chấm điểm ───────────────────────────────────────────────────────

    private User getGraderOrThrow(String email) {
        if (email == null) {
            throw new UnauthorizedException("Chưa đăng nhập hoặc phiên làm việc đã hết hạn");
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Không tìm thấy tài khoản đăng nhập"));
        if (!hasRole(user, RoleEnum.LECTURER) && !hasRole(user, RoleEnum.ADMIN)) {
            throw new AppException("Chỉ giảng viên hoặc quản trị viên mới được chấm điểm", HttpStatus.FORBIDDEN);
        }
        return user;
    }

    private ExamSession getSessionForGrader(Long sessionId, String email) {
        User grader = getGraderOrThrow(email);
        ExamSession session = getSessionOrThrow(sessionId);
        requireCanGrade(grader, session);
        return session;
    }

    private boolean canGrade(User grader, ExamSession session) {
        if (hasRole(grader, RoleEnum.ADMIN)) {
            return true;
        }
        // Giảng viên chỉ chấm ca thi thuộc môn học mình phụ trách
        User manager = session.getExam() != null && session.getExam().getCourse() != null
                ? session.getExam().getCourse().getManagedBy()
                : null;
        return manager != null && Objects.equals(manager.getUserId(), grader.getUserId());
    }

    private void requireCanGrade(User grader, ExamSession session) {
        if (!canGrade(grader, session)) {
            throw new AppException("Bạn không phụ trách môn học của ca thi này nên không thể chấm điểm",
                    HttpStatus.FORBIDDEN);
        }
    }

    private void requireCompleted(ExamSession session) {
        if (!STATUS_COMPLETED.equals(session.getStatus())) {
            throw new BadRequestException("Ca thi chưa kết thúc (trạng thái: " + session.getStatus()
                    + "). Chỉ chấm điểm sau khi sinh viên hoàn thành phiên vấn đáp.");
        }
    }

    private boolean hasRole(User user, RoleEnum role) {
        return user.getRoles() != null && user.getRoles().stream().anyMatch(r -> r.getRoleName() == role);
    }

    private ExamSession getSessionOrThrow(Long sessionId) {
        return examSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ca thi ID: " + sessionId));
    }

    // ── AI chấm điểm ──────────────────────────────────────────────────────────

    /**
     * Gọi AI chấm một lượt trả lời, đối chiếu với đáp án mẫu và rubric của câu hỏi.
     * Với lượt hỏi xoáy, AI chấm toàn bộ những gì sinh viên đã trả lời cho câu hỏi đó tính đến lượt này.
     * @return false nếu AI lỗi (gợi ý cũ được giữ nguyên)
     */
    private boolean gradeTurnWithAi(SessionTurn turn, List<SessionTurn> sessionTurns) {
        try {
            AiGradeResult result = callAiForGrade(turn, sessionTurns);
            AiGradingSuggestion suggestion = aiGradingSuggestionRepository.findByTurn_TurnId(turn.getTurnId())
                    .orElseGet(() -> AiGradingSuggestion.builder().turn(turn).build());
            suggestion.setSuggestedScore(result.score);
            suggestion.setStrengths(result.strengths);
            suggestion.setWeaknesses(result.weaknesses);
            suggestion.setMissingPoints(result.missingPoints);
            aiGradingSuggestionRepository.save(suggestion);
            return true;
        } catch (Exception e) {
            log.error("AI chấm điểm lỗi (lượt {}): {}", turn.getTurnId(), e.getMessage());
            return false;
        }
    }

    private AiGradeResult callAiForGrade(SessionTurn turn, List<SessionTurn> sessionTurns) throws Exception {
        SessionTurn mainTurn = TurnType.MAIN.equals(turn.getTurnType()) ? turn : turn.getParentTurn();
        Question question = turn.getQuestion();
        List<RubricCriterion> criteria = question != null && question.getRubric() != null
                ? question.getRubric().getCriteria()
                : List.of();

        String systemPrompt =
            "Bạn là trợ lý chấm thi vấn đáp đại học. Nhiệm vụ: đối chiếu câu trả lời của sinh viên " +
            "với đáp án mẫu và rubric để đề xuất điểm và nhận xét cho giảng viên tham khảo. " +
            "Giảng viên là người quyết định điểm cuối cùng. " +
            "Chỉ chấm dựa trên những gì sinh viên thực sự nói trong transcript, không suy diễn thêm. " +
            "Transcript được chuyển từ giọng nói nên có thể sai chính tả — đừng trừ điểm vì lỗi nhận dạng giọng nói. " +
            "Nếu có điểm trôi chảy (fluency score), hãy cân nhắc như một tín hiệu phụ về sự tự tin khi trình bày, không phải tiêu chí chính. " +
            "Nhận xét ngắn gọn, cụ thể, bằng tiếng Việt. Trả về JSON object hợp lệ.";

        StringBuilder rubricText = new StringBuilder();
        for (int i = 0; i < criteria.size(); i++) {
            RubricCriterion c = criteria.get(i);
            rubricText.append(String.format("%d. %s (tối đa %s điểm) — ý cần có: %s%n",
                    i + 1, c.getCriterionName(), c.getMaxScore().stripTrailingZeros().toPlainString(),
                    blankToDefault(c.getExpectedAnswerKeywords(), "(không ghi)")));
        }

        String userPrompt = String.format(
            "Câu hỏi chính: \"%s\"\n" +
            "Đáp án mẫu: \"%s\"\n" +
            "Rubric:\n%s\n" +
            "Các lượt hỏi - đáp của sinh viên cho câu hỏi này:\n%s\n" +
            "Hãy chấm TOÀN BỘ những gì sinh viên đã trả lời cho câu hỏi chính ở trên (gộp tất cả các lượt). " +
            "Chấm từng tiêu chí rubric theo đúng thứ tự, điểm mỗi tiêu chí từ 0 đến điểm tối đa của tiêu chí đó.\n" +
            "Trả về JSON:\n" +
            "{\n" +
            "  \"criteria\": [ { \"index\": 1, \"score\": 1.5, \"comment\": \"Nhận xét ngắn\" } ],\n" +
            "  \"suggestedScore\": 7.5,\n" +
            "  \"strengths\": \"Điểm mạnh trong câu trả lời\",\n" +
            "  \"weaknesses\": \"Điểm yếu hoặc chỗ sai\",\n" +
            "  \"missingPoints\": \"Những ý trong đáp án/rubric mà sinh viên chưa nêu\"\n" +
            "}\n" +
            "suggestedScore là điểm tổng thang 10.",
            mainTurn != null ? mainTurn.getQuestionText() : turn.getQuestionText(),
            question != null ? blankToDefault(question.getSampleAnswer(), "(không có đáp án mẫu)") : "(không có đáp án mẫu)",
            criteria.isEmpty() ? "(không có rubric — chấm theo đáp án mẫu)\n" : rubricText.toString(),
            buildAnswerChain(turn, mainTurn, sessionTurns)
        );

        String content = openAiClient.callChatCompletion(systemPrompt, userPrompt);
        JsonNode root = objectMapper.readTree(stripCodeFence(content));

        AiGradeResult result = new AiGradeResult();
        result.score = computeScore(root, criteria);
        result.strengths = textOrNull(root, "strengths");
        result.weaknesses = textOrNull(root, "weaknesses");
        result.missingPoints = textOrNull(root, "missingPoints");
        return result;
    }

    /** Các lượt (câu chính + hỏi xoáy) của cùng câu hỏi, tính đến lượt đang chấm. */
    private String buildAnswerChain(SessionTurn turn, SessionTurn mainTurn, List<SessionTurn> sessionTurns) {
        Long mainId = mainTurn != null ? mainTurn.getTurnId() : turn.getTurnId();
        StringBuilder sb = new StringBuilder();
        for (SessionTurn t : sessionTurns) {
            boolean inChain = t.getTurnId().equals(mainId)
                    || (t.getParentTurn() != null && t.getParentTurn().getTurnId().equals(mainId));
            if (!inChain || t.getSequenceNumber() > turn.getSequenceNumber()) {
                continue;
            }
            String answer = transcriptRepository.findByTurn_TurnId(t.getTurnId())
                    .map(Transcript::getSttText)
                    .orElse("(chưa trả lời)");
            String label = TurnType.MAIN.equals(t.getTurnType()) ? "Câu hỏi chính" : "Câu hỏi xoáy";
            Transcript fullTr = transcriptRepository.findByTurn_TurnId(t.getTurnId()).orElse(null);
            String fluencyNote = (fullTr != null && fullTr.getFluencyScore() != null)
                    ? String.format(" [Điểm trôi chảy: %.1f/10]", fullTr.getFluencyScore())
                    : "";
            String durationNote = (fullTr != null && fullTr.getAnswerDurationSeconds() != null)
                    ? String.format(" [Thời gian trả lời: %ds]", fullTr.getAnswerDurationSeconds())
                    : "";
            sb.append(String.format("- %s: \"%s\"%n  Sinh viên trả lời: \"%s\"%s%s%n",
                    label, t.getQuestionText(), answer, fluencyNote, durationNote));
        }
        return sb.toString();
    }

    /**
     * Ưu tiên tự cộng điểm từng tiêu chí rồi quy đổi thang 10 (chính xác hơn để AI tự tính tổng);
     * nếu AI không trả đủ tiêu chí thì dùng suggestedScore.
     */
    private BigDecimal computeScore(JsonNode root, List<RubricCriterion> criteria) {
        JsonNode items = root.path("criteria");
        if (!criteria.isEmpty() && items.isArray() && items.size() == criteria.size()) {
            BigDecimal earned = BigDecimal.ZERO;
            BigDecimal total = BigDecimal.ZERO;
            boolean complete = true;
            for (JsonNode item : items) {
                int index = item.path("index").asInt(-1) - 1;
                if (index < 0 || index >= criteria.size() || !item.path("score").isNumber()) {
                    complete = false;
                    break;
                }
                BigDecimal max = criteria.get(index).getMaxScore();
                earned = earned.add(clamp(item.path("score").decimalValue(), max));
                total = total.add(max);
            }
            if (complete && total.signum() > 0) {
                return earned.multiply(MAX_SCORE).divide(total, 2, RoundingMode.HALF_UP);
            }
        }
        if (!root.path("suggestedScore").isNumber()) {
            throw new IllegalStateException("AI không trả về điểm hợp lệ");
        }
        return clamp(root.path("suggestedScore").decimalValue(), MAX_SCORE).setScale(2, RoundingMode.HALF_UP);
    }

    // ── Dựng dữ liệu trả về ───────────────────────────────────────────────────

    private GradingReviewResponse buildReview(ExamSession session, List<Long> failedTurnIds) {
        Long sessionId = session.getSessionId();
        List<SessionTurn> turns = sessionTurnRepository.findBySession_SessionIdOrderBySequenceNumberAsc(sessionId);
        List<ExamQuestion> examQuestions = session.getExam() != null
                ? examQuestionRepository.findByExam_ExamIdOrderByQuestionOrderAsc(session.getExam().getExamId())
                : List.of();

        // Gom lượt hỏi xoáy vào câu hỏi chính tương ứng
        Map<Long, List<SessionTurn>> chains = new LinkedHashMap<>();
        for (SessionTurn t : turns) {
            Long mainId = TurnType.MAIN.equals(t.getTurnType()) || t.getParentTurn() == null
                    ? t.getTurnId()
                    : t.getParentTurn().getTurnId();
            chains.computeIfAbsent(mainId, k -> new ArrayList<>()).add(t);
        }

        List<QuestionReview> questions = new ArrayList<>();
        int answered = 0;
        int aiGraded = 0;
        boolean complete = true;
        BigDecimal scoreSum = BigDecimal.ZERO;

        for (List<SessionTurn> chain : chains.values()) {
            SessionTurn main = chain.get(0);
            Question q = main.getQuestion();
            List<TurnReview> turnReviews = new ArrayList<>();
            BigDecimal best = null;

            for (SessionTurn t : chain) {
                TurnReview tr = buildTurnReview(t);
                turnReviews.add(tr);
                if (Boolean.TRUE.equals(tr.getAnswered())) {
                    answered++;
                    boolean valid = tr.getAiSuggestedScore() != null && !Boolean.TRUE.equals(tr.getAiFallback());
                    if (valid) {
                        aiGraded++;
                        best = best == null || tr.getAiSuggestedScore().compareTo(best) > 0 ? tr.getAiSuggestedScore() : best;
                    } else {
                        complete = false;
                    }
                }
            }
            if (best != null) {
                scoreSum = scoreSum.add(best);
            }

            questions.add(QuestionReview.builder()
                    .questionId(q != null ? q.getQuestionId() : null)
                    .questionOrder(findQuestionOrder(examQuestions, q))
                    .questionText(main.getQuestionText())
                    .sampleAnswer(q != null ? q.getSampleAnswer() : null)
                    .rubricName(q != null && q.getRubric() != null ? q.getRubric().getName() : null)
                    .criteria(q != null && q.getRubric() != null
                            ? q.getRubric().getCriteria().stream()
                                .map(c -> CriterionInfo.builder()
                                        .criterionName(c.getCriterionName())
                                        .maxScore(c.getMaxScore())
                                        .expectedAnswerKeywords(c.getExpectedAnswerKeywords())
                                        .build())
                                .collect(Collectors.toList())
                            : List.of())
                    .aiQuestionScore(best)
                    .turns(turnReviews)
                    .build());
        }

        // Câu hỏi chưa được hỏi tới (phiên dừng giữa chừng) tính 0 điểm trong điểm tổng gợi ý
        int totalQuestions = Math.max(examQuestions.size(), chains.size());
        BigDecimal aiTotal = aiGraded > 0 && totalQuestions > 0
                ? scoreSum.divide(BigDecimal.valueOf(totalQuestions), 2, RoundingMode.HALF_UP)
                : null;

        User student = session.getStudent();
        return GradingReviewResponse.builder()
                .sessionId(sessionId)
                .examId(session.getExam() != null ? session.getExam().getExamId() : null)
                .examTitle(session.getExam() != null ? session.getExam().getTitle() : null)
                .courseCode(session.getExam() != null && session.getExam().getCourse() != null
                        ? session.getExam().getCourse().getCourseCode() : null)
                .courseName(session.getExam() != null && session.getExam().getCourse() != null
                        ? session.getExam().getCourse().getCourseName() : null)
                .studentId(student != null ? student.getUserId() : null)
                .studentName(student != null ? student.getFullName() : null)
                .studentEmail(student != null ? student.getEmail() : null)
                .status(session.getStatus())
                .startedAt(session.getStartedAt())
                .endedAt(session.getEndedAt())
                .questions(questions)
                .aiSuggestedScore(aiTotal)
                .totalExamQuestions(totalQuestions)
                .answeredTurns(answered)
                .aiGradedTurns(aiGraded)
                .aiScoreComplete(complete)
                .finalGrade(buildFinalGradeInfo(sessionId))
                .failedTurnIds(failedTurnIds)
                .build();
    }

    private TurnReview buildTurnReview(SessionTurn t) {
        Transcript transcript = transcriptRepository.findByTurn_TurnId(t.getTurnId()).orElse(null);
        AiGradingSuggestion suggestion = aiGradingSuggestionRepository.findByTurn_TurnId(t.getTurnId()).orElse(null);
        return TurnReview.builder()
                .turnId(t.getTurnId())
                .turnType(t.getTurnType().name())
                .sequenceNumber(t.getSequenceNumber())
                .questionText(t.getQuestionText())
                .answered(transcript != null)
                .answerText(transcript != null ? transcript.getSttText() : null)
                .answerDurationSeconds(transcript != null ? transcript.getAnswerDurationSeconds() : null)
                .aiSuggestedScore(suggestion != null ? suggestion.getSuggestedScore() : null)
                .strengths(suggestion != null ? suggestion.getStrengths() : null)
                .weaknesses(suggestion != null ? suggestion.getWeaknesses() : null)
                .missingPoints(suggestion != null ? suggestion.getMissingPoints() : null)
                .aiFallback(suggestion != null && isFallback(suggestion))
                .build();
    }

    private GradingSessionSummaryResponse buildSummary(ExamSession session) {
        GradingReviewResponse review = buildReview(session, null);
        return GradingSessionSummaryResponse.builder()
                .sessionId(review.getSessionId())
                .examTitle(review.getExamTitle())
                .courseCode(review.getCourseCode())
                .courseName(review.getCourseName())
                .studentName(review.getStudentName())
                .studentEmail(review.getStudentEmail())
                .status(review.getStatus())
                .startedAt(review.getStartedAt())
                .endedAt(review.getEndedAt())
                .answeredTurns(review.getAnsweredTurns())
                .aiSuggestedScore(review.getAiSuggestedScore())
                .aiScoreComplete(review.getAiScoreComplete())
                .finalScore(review.getFinalGrade() != null ? review.getFinalGrade().getFinalScore() : null)
                .build();
    }

    private FinalGradeInfo buildFinalGradeInfo(Long sessionId) {
        return finalGradeRepository.findBySession_SessionId(sessionId)
                .map(fg -> FinalGradeInfo.builder()
                        .finalScore(fg.getFinalScore())
                        .lecturerFeedback(fg.getLecturerFeedback())
                        .confirmedById(fg.getConfirmedBy() != null ? fg.getConfirmedBy().getUserId() : null)
                        .confirmedByName(fg.getConfirmedBy() != null ? fg.getConfirmedBy().getFullName() : null)
                        .confirmedAt(fg.getConfirmedAt())
                        .build())
                .orElse(null);
    }

    // ── Tiện ích ──────────────────────────────────────────────────────────────

    private boolean hasValidSuggestion(Long turnId) {
        return aiGradingSuggestionRepository.findByTurn_TurnId(turnId)
                .filter(s -> s.getSuggestedScore() != null && !isFallback(s))
                .isPresent();
    }

    private boolean isFallback(AiGradingSuggestion s) {
        return s.getStrengths() != null && s.getStrengths().startsWith(INTERVIEW_FALLBACK_MARKER);
    }

    private Integer findQuestionOrder(List<ExamQuestion> examQuestions, Question q) {
        if (q == null) {
            return null;
        }
        return examQuestions.stream()
                .filter(eq -> eq.getQuestion() != null && eq.getQuestion().getQuestionId().equals(q.getQuestionId()))
                .map(ExamQuestion::getQuestionOrder)
                .findFirst()
                .orElse(null);
    }

    private static BigDecimal clamp(BigDecimal value, BigDecimal max) {
        if (value.signum() < 0) {
            return BigDecimal.ZERO;
        }
        return value.compareTo(max) > 0 ? max : value;
    }

    private static String stripCodeFence(String content) {
        String s = content == null ? "" : content.trim();
        if (s.startsWith("```")) {
            s = s.replaceFirst("^```(?:json)?\\s*", "").replaceFirst("\\s*```$", "");
        }
        return s;
    }

    private static String textOrNull(JsonNode root, String field) {
        JsonNode node = root.path(field);
        if (node.isMissingNode() || node.isNull()) {
            return null;
        }
        String text = node.isArray()
                ? String.join("\n", toBulletLines(node))
                : node.asText();
        return text.isBlank() ? null : text.trim();
    }

    // AI đôi khi trả mảng thay vì chuỗi — gộp thành các dòng
    private static List<String> toBulletLines(JsonNode array) {
        List<String> lines = new ArrayList<>();
        array.forEach(item -> lines.add("- " + item.asText()));
        return lines;
    }

    private static String blankToDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private static class AiGradeResult {
        private BigDecimal score;
        private String strengths;
        private String weaknesses;
        private String missingPoints;
    }
}
