package com.group2.aives.application.port.in;

import com.group2.aives.application.dto.request.GradeSubmissionRequest;
import com.group2.aives.application.dto.response.GradingReviewResponse;
import com.group2.aives.application.dto.response.GradingSessionSummaryResponse;

import java.util.List;

/**
 * Hỗ trợ chấm điểm bằng AI theo mô hình Human-in-the-loop:
 * AI đối chiếu transcript với đáp án mẫu / rubric để đưa ra điểm gợi ý và nhận xét,
 * giảng viên xem, điều chỉnh và là người quyết định điểm cuối cùng.
 */
public interface AiGradingService {

    /** Danh sách ca thi mà giảng viên hiện tại được phép chấm (Admin xem tất cả) */
    List<GradingSessionSummaryResponse> getGradableSessions(String currentUserEmail);

    /** Transcript đầy đủ + gợi ý AI + điểm đã chốt của một ca thi */
    GradingReviewResponse getReview(Long sessionId, String currentUserEmail);

    /**
     * Yêu cầu AI chấm lại các lượt đã trả lời của ca thi.
     * @param onlyMissing true: chỉ chấm các lượt chưa có gợi ý hợp lệ (AI lỗi lúc thi)
     */
    GradingReviewResponse regradeSession(Long sessionId, boolean onlyMissing, String currentUserEmail);

    /** Yêu cầu AI chấm lại một lượt trả lời cụ thể */
    GradingReviewResponse regradeTurn(Long sessionId, Long turnId, String currentUserEmail);

    /** Giảng viên chốt điểm cuối cùng (có thể khác điểm AI đề xuất) */
    GradingReviewResponse confirmFinalGrade(Long sessionId, GradeSubmissionRequest request, String currentUserEmail);
}
