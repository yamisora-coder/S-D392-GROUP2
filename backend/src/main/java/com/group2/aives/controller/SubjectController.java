package com.group2.aives.controller;

import com.group2.aives.dto.request.SubjectRequest;
import com.group2.aives.dto.response.SubjectResponse;
import com.group2.aives.service.SubjectService;
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
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
@Tag(name = "1. Môn học (Subjects)", description = "CRUD Môn học & Quản lý chương trình")
@CrossOrigin(origins = "*")
public class SubjectController {

    private final SubjectService subjectService;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả môn học")
    public ResponseEntity<List<SubjectResponse>> getAllSubjects() {
        return ResponseEntity.ok(subjectService.getAllSubjects());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết một môn học theo ID")
    public ResponseEntity<SubjectResponse> getSubjectById(@PathVariable UUID id) {
        return ResponseEntity.ok(subjectService.getSubjectById(id));
    }

    @PostMapping
    @Operation(summary = "Tạo môn học mới")
    public ResponseEntity<SubjectResponse> createSubject(@Valid @RequestBody SubjectRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(subjectService.createSubject(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin môn học")
    public ResponseEntity<SubjectResponse> updateSubject(@PathVariable UUID id, @Valid @RequestBody SubjectRequest request) {
        return ResponseEntity.ok(subjectService.updateSubject(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa môn học")
    public ResponseEntity<Void> deleteSubject(@PathVariable UUID id) {
        subjectService.deleteSubject(id);
        return ResponseEntity.noContent().build();
    }
}
