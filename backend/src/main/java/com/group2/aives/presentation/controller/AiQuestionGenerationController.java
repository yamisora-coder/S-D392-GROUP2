package com.group2.aives.presentation.controller;

import com.group2.aives.application.dto.request.GenerateQuestionsRequest;
import com.group2.aives.application.dto.response.QuestionGenerationRequestResponse;
import com.group2.aives.application.port.in.AiQuestionGenerationService;
import com.group2.aives.infrastructure.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai/question-generation")
@RequiredArgsConstructor
@Tag(name = "AI. Sinh câu hỏi bằng AI (AI Question Generation)",
     description = "Giảng viên dùng AI sinh câu hỏi từ tài liệu môn học (RAG), gắn nhãn thang Bloom & Rubric. " +
                   "Câu hỏi sinh ra ở trạng thái PENDING_REVIEW — giảng viên duyệt qua PATCH /api/questions/{id}/status.")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyRole('LECTURER', 'ADMIN')")
public class AiQuestionGenerationController {

    private final AiQuestionGenerationService aiQuestionGenerationService;

    @PostMapping
    @Operation(summary = "Yêu cầu AI sinh câu hỏi vấn đáp từ tài liệu môn học",
               description = "AI sử dụng nội dung tài liệu đã upload (RAG) để tạo câu hỏi theo chủ đề & mức Bloom. " +
                             "Câu hỏi được lưu với status=PENDING_REVIEW để giảng viên kiểm duyệt.")
    public ResponseEntity<QuestionGenerationRequestResponse> generateQuestions(
            @Valid @RequestBody GenerateQuestionsRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = (userDetails != null && userDetails.getUser() != null) ? userDetails.getUser().getUserId() : 1L;
        QuestionGenerationRequestResponse response = aiQuestionGenerationService.generateQuestions(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách các yêu cầu sinh câu hỏi",
               description = "Có thể lọc theo courseId hoặc userId của người yêu cầu.")
    public ResponseEntity<List<QuestionGenerationRequestResponse>> getGenerationRequests(
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) Long userId) {
        return ResponseEntity.ok(aiQuestionGenerationService.getGenerationRequests(courseId, userId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết một yêu cầu sinh câu hỏi kèm danh sách câu hỏi đã sinh")
    public ResponseEntity<QuestionGenerationRequestResponse> getGenerationRequestById(@PathVariable Long id) {
        return ResponseEntity.ok(aiQuestionGenerationService.getGenerationRequestById(id));
    }
}
