package com.group2.aives.presentation.controller;

import com.group2.aives.application.dto.request.GradeSubmissionRequest;
import com.group2.aives.application.dto.request.SessionRequest;
import com.group2.aives.application.dto.response.SessionResponse;
import com.group2.aives.application.port.in.SessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
@Tag(name = "4. Ca thi & Chấm điểm (Sessions & Grading)", description = "Lập lịch ca thi cho sinh viên & Giảng viên chốt điểm (Human-in-the-loop)")
@CrossOrigin(origins = "*")
public class SessionController {

    private final SessionService sessionService;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả các ca thi")
    public ResponseEntity<List<SessionResponse>> getAllSessions() {
        return ResponseEntity.ok(sessionService.getAllSessions());
    }

    @GetMapping("/exam/{examId}")
    @Operation(summary = "Lấy danh sách ca thi của một kỳ thi cụ thể")
    public ResponseEntity<List<SessionResponse>> getSessionsByExamId(@PathVariable Long examId) {
        return ResponseEntity.ok(sessionService.getSessionsByExamId(examId));
    }

    @PostMapping
    @Operation(summary = "Xếp lịch thi cho một sinh viên vào kỳ thi")
    public ResponseEntity<SessionResponse> createSession(@Valid @RequestBody SessionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sessionService.createSession(request));
    }

    @PatchMapping("/{sessionId}/grade")
    @Operation(summary = "Giảng viên chốt điểm và nhận xét cuối cùng (Human-in-the-loop)")
    public ResponseEntity<SessionResponse> finalizeGrade(
            @PathVariable Long sessionId,
            @Valid @RequestBody GradeSubmissionRequest request) {
        return ResponseEntity.ok(sessionService.finalizeGrade(sessionId, request));
    }

    @DeleteMapping("/{sessionId}")
    @Operation(summary = "Xóa ca thi")
    public ResponseEntity<Void> deleteSession(@PathVariable Long sessionId) {
        sessionService.deleteSession(sessionId);
        return ResponseEntity.noContent().build();
    }
}
