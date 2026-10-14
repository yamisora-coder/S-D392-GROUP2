package com.group2.aives.presentation.controller;

import com.group2.aives.application.dto.request.GradeSubmissionRequest;
import com.group2.aives.application.dto.response.GradingReviewResponse;
import com.group2.aives.application.dto.response.GradingSessionSummaryResponse;
import com.group2.aives.application.port.in.AiGradingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/grading")
@RequiredArgsConstructor
@Tag(name = "AI. Hỗ trợ chấm điểm (AI-assisted Grading)",
     description = "AI đối chiếu transcript với đáp án mẫu / rubric để gợi ý điểm và nhận xét " +
                   "(điểm mạnh, điểm yếu, ý còn thiếu). Giảng viên xem transcript đầy đủ, điều chỉnh " +
                   "và quyết định điểm cuối cùng (Human-in-the-loop).")
@CrossOrigin(origins = "*")
public class AiGradingController {

    private final AiGradingService aiGradingService;

    @GetMapping("/sessions")
    @Operation(summary = "Danh sách ca thi giảng viên được chấm",
               description = "Kèm điểm AI đề xuất và điểm đã chốt. Giảng viên chỉ thấy ca thi thuộc môn mình phụ trách; Admin thấy tất cả.")
    public ResponseEntity<List<GradingSessionSummaryResponse>> getGradableSessions(
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(aiGradingService.getGradableSessions(username(user)));
    }

    @GetMapping("/sessions/{sessionId}")
    @Operation(summary = "Xem transcript đầy đủ + điểm AI đề xuất của một ca thi",
               description = "Trả về từng câu hỏi (đáp án mẫu, rubric), các lượt hỏi chính / hỏi xoáy, " +
                             "transcript câu trả lời, gợi ý chấm điểm của AI và điểm giảng viên đã chốt.")
    public ResponseEntity<GradingReviewResponse> getReview(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(aiGradingService.getReview(sessionId, username(user)));
    }

    @PostMapping("/sessions/{sessionId}/ai-regrade")
    @Operation(summary = "Yêu cầu AI chấm lại ca thi",
               description = "onlyMissing=true (mặc định): chỉ chấm các lượt chưa có gợi ý hợp lệ (ví dụ AI lỗi trong lúc thi). " +
                             "onlyMissing=false: chấm lại toàn bộ. Không thay đổi điểm giảng viên đã chốt.")
    public ResponseEntity<GradingReviewResponse> regradeSession(
            @PathVariable Long sessionId,
            @RequestParam(defaultValue = "true") boolean onlyMissing,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(aiGradingService.regradeSession(sessionId, onlyMissing, username(user)));
    }

    @PostMapping("/sessions/{sessionId}/turns/{turnId}/ai-regrade")
    @Operation(summary = "Yêu cầu AI chấm lại một lượt trả lời")
    public ResponseEntity<GradingReviewResponse> regradeTurn(
            @PathVariable Long sessionId,
            @PathVariable Long turnId,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(aiGradingService.regradeTurn(sessionId, turnId, username(user)));
    }

    @PutMapping("/sessions/{sessionId}/final-grade")
    @Operation(summary = "Giảng viên chốt điểm cuối cùng (Human-in-the-loop)",
               description = "Điểm thang 0–10, có thể khác điểm AI đề xuất. Người chốt là tài khoản đang đăng nhập " +
                             "(trường confirmedById trong body bị bỏ qua). Chỉ chốt được khi ca thi đã hoàn thành.")
    public ResponseEntity<GradingReviewResponse> confirmFinalGrade(
            @PathVariable Long sessionId,
            @Valid @RequestBody GradeSubmissionRequest request,
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(aiGradingService.confirmFinalGrade(sessionId, request, username(user)));
    }

    private static String username(UserDetails user) {
        return user != null ? user.getUsername() : null;
    }
}
