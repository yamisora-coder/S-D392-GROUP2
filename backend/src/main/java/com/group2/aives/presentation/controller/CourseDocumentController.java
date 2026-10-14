package com.group2.aives.presentation.controller;

import com.group2.aives.application.dto.request.CourseDocumentRequest;
import com.group2.aives.application.dto.response.CourseDocumentResponse;
import com.group2.aives.application.port.in.CourseDocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/course-documents")
@RequiredArgsConstructor
@Tag(name = "3. Tài liệu môn học (Course Documents)", description = "Quản lý tài liệu giảng dạy — nền tảng cho AI sinh câu hỏi (RAG)")
@CrossOrigin(origins = "*")
public class CourseDocumentController {

    private final CourseDocumentService courseDocumentService;

    @GetMapping
    @Operation(summary = "Lấy danh sách tài liệu của một môn học")
    public ResponseEntity<List<CourseDocumentResponse>> getDocumentsByCourse(
            @RequestParam Long courseId) {
        return ResponseEntity.ok(courseDocumentService.getDocumentsByCourse(courseId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết một tài liệu")
    public ResponseEntity<CourseDocumentResponse> getDocumentById(@PathVariable Long id) {
        return ResponseEntity.ok(courseDocumentService.getDocumentById(id));
    }

    @PostMapping
    @Operation(summary = "Thêm tài liệu môn học (kèm nội dung văn bản nếu có, dùng cho RAG)")
    public ResponseEntity<CourseDocumentResponse> addDocument(@Valid @RequestBody CourseDocumentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(courseDocumentService.addDocument(request));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload file tài liệu lên server (multipart/form-data)",
               description = "Lưu file vào thư mục uploads/documents trên server. "
                           + "Trả về URL file để dùng cho RAG hoặc tham chiếu.")
    public ResponseEntity<CourseDocumentResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam Long courseId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(courseDocumentService.uploadFile(file, courseId));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa tài liệu môn học")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        courseDocumentService.deleteDocument(id);
        return ResponseEntity.noContent().build();
    }
}
