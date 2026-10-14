package com.group2.aives.presentation.controller;

import com.group2.aives.application.dto.request.ExamQuestionRequest;
import com.group2.aives.application.dto.response.ExamQuestionResponse;
import com.group2.aives.application.port.in.ExamQuestionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exams/{examId}/questions")
@RequiredArgsConstructor
@Tag(name = "3b. Câu hỏi trong kỳ thi (Exam Questions)", description = "Gán, sắp xếp và gỡ câu hỏi khỏi kỳ thi")
@CrossOrigin(origins = "*")
public class ExamQuestionController {

    private final ExamQuestionService examQuestionService;

    @GetMapping
    @Operation(summary = "Lấy danh sách câu hỏi của kỳ thi (theo thứ tự)")
    public ResponseEntity<List<ExamQuestionResponse>> getQuestions(@PathVariable Long examId) {
        return ResponseEntity.ok(examQuestionService.getQuestionsByExam(examId));
    }

    @PostMapping
    @Operation(summary = "Thêm câu hỏi vào kỳ thi")
    public ResponseEntity<ExamQuestionResponse> addQuestion(
            @PathVariable Long examId,
            @Valid @RequestBody ExamQuestionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(examQuestionService.addQuestionToExam(examId, request));
    }

    @PatchMapping("/{questionId}/order")
    @Operation(summary = "Cập nhật thứ tự câu hỏi trong kỳ thi")
    public ResponseEntity<ExamQuestionResponse> updateOrder(
            @PathVariable Long examId,
            @PathVariable Long questionId,
            @RequestParam Integer order) {
        return ResponseEntity.ok(examQuestionService.updateQuestionOrder(examId, questionId, order));
    }

    @DeleteMapping("/{questionId}")
    @Operation(summary = "Gỡ câu hỏi khỏi kỳ thi")
    public ResponseEntity<Void> removeQuestion(
            @PathVariable Long examId,
            @PathVariable Long questionId) {
        examQuestionService.removeQuestionFromExam(examId, questionId);
        return ResponseEntity.noContent().build();
    }
}
