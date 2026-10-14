package com.group2.aives.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Hồ sơ chấm điểm đầy đủ của một ca thi cho giảng viên (Human-in-the-loop):
 * transcript từng lượt hỏi + gợi ý chấm điểm của AI + điểm giảng viên đã chốt.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GradingReviewResponse {

    // Thông tin ca thi
    private Long sessionId;
    private Long examId;
    private String examTitle;
    private String courseCode;
    private String courseName;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private String status;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;

    // Chi tiết theo từng câu hỏi chính (kèm các lượt hỏi xoáy)
    private List<QuestionReview> questions;

    // Tổng hợp điểm AI đề xuất cho cả ca thi (thang 10) — chỉ mang tính gợi ý
    private BigDecimal aiSuggestedScore;
    private Integer totalExamQuestions;
    private Integer answeredTurns;
    private Integer aiGradedTurns;
    // false khi còn lượt đã trả lời nhưng chưa có gợi ý AI hợp lệ → giảng viên nên chấm lại bằng AI
    private Boolean aiScoreComplete;

    // Điểm cuối cùng do giảng viên quyết định (null nếu chưa chốt)
    private FinalGradeInfo finalGrade;

    // Danh sách lượt AI chấm lại thất bại (chỉ có giá trị sau khi gọi chấm lại)
    private List<Long> failedTurnIds;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuestionReview {
        private Long questionId;
        private Integer questionOrder;
        private String questionText;
        private String sampleAnswer;
        private String rubricName;
        private List<CriterionInfo> criteria;
        // Điểm AI cho câu hỏi = điểm cao nhất trong chuỗi câu chính + câu hỏi xoáy
        private BigDecimal aiQuestionScore;
        private List<TurnReview> turns;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CriterionInfo {
        private String criterionName;
        private BigDecimal maxScore;
        private String expectedAnswerKeywords;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TurnReview {
        private Long turnId;
        private String turnType;        // MAIN | FOLLOW_UP
        private Integer sequenceNumber;
        private String questionText;

        // Transcript đầy đủ câu trả lời của sinh viên
        private Boolean answered;
        private String answerText;
        private Integer answerDurationSeconds;

        // Gợi ý chấm điểm của AI
        private BigDecimal aiSuggestedScore;
        private String strengths;
        private String weaknesses;
        private String missingPoints;
        // true khi AI lỗi lúc thi và chỉ lưu điểm mặc định → cần chấm lại
        private Boolean aiFallback;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FinalGradeInfo {
        private BigDecimal finalScore;
        private String lecturerFeedback;
        private Long confirmedById;
        private String confirmedByName;
        private LocalDateTime confirmedAt;
    }
}
