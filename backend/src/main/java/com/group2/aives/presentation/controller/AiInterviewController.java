package com.group2.aives.presentation.controller;

import com.group2.aives.application.dto.request.SubmitAnswerRequest;
import com.group2.aives.application.dto.response.InterviewTurnResponse;
import com.group2.aives.application.port.in.AiInterviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/interview")
@RequiredArgsConstructor
@Tag(name = "AI. Phỏng vấn AI (AI Interview Engine)",
     description = "Lõi phỏng vấn AI: quản lý luồng vấn đáp, sinh câu hỏi xoáy adaptive follow-up, " +
                   "lưu transcript STT và gợi ý chấm điểm tự động theo Rubric.")
@CrossOrigin(origins = "*")
public class AiInterviewController {

    private final AiInterviewService aiInterviewService;

    @PostMapping("/sessions/{sessionId}/start")
    @Operation(
        summary = "Bắt đầu / tiếp tục phiên vấn đáp",
        description = "Khởi tạo lượt hỏi đầu tiên cho phiên thi. " +
                      "Nếu phiên đã được bắt đầu từ trước, trả về câu hỏi hiện tại đang chờ trả lời. " +
                      "Frontend đọc questionText bằng TTS (Web Speech API) cho sinh viên nghe."
    )
    public ResponseEntity<InterviewTurnResponse> startSession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(aiInterviewService.startSession(sessionId));
    }

    @PostMapping("/sessions/{sessionId}/turns/{turnId}/submit")
    @Operation(
        summary = "Nộp câu trả lời — AI phân tích và sinh câu hỏi xoáy (adaptive follow-up)",
        description = "Frontend gửi sttText (văn bản chuyển từ giọng nói sinh viên qua Web Speech API). " +
                      "AI phân tích độ đầy đủ của câu trả lời so với Rubric:\n" +
                      "• Nếu còn mơ hồ / thiếu ý → sinh câu hỏi xoáy (FOLLOW_UP), nextAction=ANSWER_REQUIRED\n" +
                      "• Nếu đủ hoặc đã hết lượt xoáy → chuyển câu hỏi chính tiếp theo hoặc kết thúc phiên"
    )
    public ResponseEntity<InterviewTurnResponse> submitAnswer(
            @PathVariable Long sessionId,
            @PathVariable Long turnId,
            @Valid @RequestBody SubmitAnswerRequest request) {
        return ResponseEntity.ok(aiInterviewService.submitAnswer(sessionId, turnId, request));
    }

    @GetMapping("/sessions/{sessionId}/current-turn")
    @Operation(
        summary = "Lấy lượt hỏi hiện tại đang chờ trả lời",
        description = "Dùng khi frontend cần khôi phục trạng thái sau khi reload trang."
    )
    public ResponseEntity<InterviewTurnResponse> getCurrentTurn(@PathVariable Long sessionId) {
        return ResponseEntity.ok(aiInterviewService.getCurrentTurn(sessionId));
    }

    @GetMapping("/sessions/{sessionId}/turns")
    @Operation(
        summary = "Lấy toàn bộ lịch sử câu hỏi & câu trả lời trong phiên",
        description = "Trả về danh sách tất cả các lượt (MAIN + FOLLOW_UP) theo thứ tự sequence_number."
    )
    public ResponseEntity<List<InterviewTurnResponse>> getSessionTurns(@PathVariable Long sessionId) {
        return ResponseEntity.ok(aiInterviewService.getSessionTurns(sessionId));
    }
}
