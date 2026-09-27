package com.group2.aives.controller;

import com.group2.aives.dto.request.QuestionRequest;
import com.group2.aives.dto.response.QuestionResponse;
import com.group2.aives.entity.enums.BloomLevel;
import com.group2.aives.entity.enums.QuestionStatus;
import com.group2.aives.service.QuestionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

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
            @RequestParam(required = false) UUID subjectId,
            @RequestParam(required = false) BloomLevel bloomLevel,
            @RequestParam(required = false) QuestionStatus status) {
        return ResponseEntity.ok(questionService.getQuestions(subjectId, bloomLevel, status));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết một câu hỏi kèm danh sách rubric")
    public ResponseEntity<QuestionResponse> getQuestionById(@PathVariable UUID id) {
        return ResponseEntity.ok(questionService.getQuestionById(id));
    }

    @PostMapping
    @Operation(summary = "Tạo câu hỏi mới kèm danh sách rubric chấm điểm")
    public ResponseEntity<QuestionResponse> createQuestion(@Valid @RequestBody QuestionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(questionService.createQuestion(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật nội dung câu hỏi và rubric")
    public ResponseEntity<QuestionResponse> updateQuestion(@PathVariable UUID id, @Valid @RequestBody QuestionRequest request) {
        return ResponseEntity.ok(questionService.updateQuestion(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa câu hỏi")
    public ResponseEntity<Void> deleteQuestion(@PathVariable UUID id) {
        questionService.deleteQuestion(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Thay đổi trạng thái câu hỏi (DRAFT, APPROVED, ARCHIVED)")
    public ResponseEntity<QuestionResponse> updateStatus(@PathVariable UUID id, @RequestParam QuestionStatus status) {
        return ResponseEntity.ok(questionService.updateStatus(id, status));
    }
}
