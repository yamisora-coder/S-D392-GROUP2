package com.group2.aives.presentation.controller;

import com.group2.aives.application.dto.request.QuestionRequest;
import com.group2.aives.application.dto.response.QuestionResponse;
import com.group2.aives.domain.enums.BloomLevel;
import com.group2.aives.domain.enums.QuestionStatus;
import com.group2.aives.application.port.in.QuestionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
@Tag(name = "2. Ngân hàng câu hỏi & Rubric (Questions)", description = "CRUD Câu hỏi vấn đáp theo thang Bloom & Rubric chấm điểm")
@CrossOrigin(origins = "*")
public class QuestionController {

    private final QuestionService questionService;

    @GetMapping
    @Operation(summary = "Lấy danh sách câu hỏi (Có thể lọc theo Môn học, Thang Bloom, Trạng thái)")
    public ResponseEntity<List<QuestionResponse>> getQuestions(
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) BloomLevel bloomLevel,
            @RequestParam(required = false) QuestionStatus status) {
        return ResponseEntity.ok(questionService.getQuestions(courseId, bloomLevel, status));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết một câu hỏi")
    public ResponseEntity<QuestionResponse> getQuestionById(@PathVariable Long id) {
        return ResponseEntity.ok(questionService.getQuestionById(id));
    }

    @PostMapping
    @Operation(summary = "Tạo câu hỏi mới")
    public ResponseEntity<QuestionResponse> createQuestion(@Valid @RequestBody QuestionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(questionService.createQuestion(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật nội dung câu hỏi")
    public ResponseEntity<QuestionResponse> updateQuestion(@PathVariable Long id, @Valid @RequestBody QuestionRequest request) {
        return ResponseEntity.ok(questionService.updateQuestion(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa câu hỏi")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long id) {
        questionService.deleteQuestion(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Thay đổi trạng thái câu hỏi (DRAFT, PENDING_REVIEW, APPROVED, REJECTED)")
    public ResponseEntity<QuestionResponse> updateStatus(@PathVariable Long id, @RequestParam QuestionStatus status) {
        return ResponseEntity.ok(questionService.updateStatus(id, status));
    }
}
