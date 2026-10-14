package com.group2.aives.application.service;

import com.group2.aives.application.dto.request.CourseDocumentRequest;
import com.group2.aives.application.dto.response.CourseDocumentResponse;
import com.group2.aives.application.port.in.CourseDocumentService;
import com.group2.aives.application.port.out.CourseDocumentContentRepository;
import com.group2.aives.application.port.out.CourseDocumentRepository;
import com.group2.aives.application.port.out.CourseRepository;
import com.group2.aives.domain.model.Course;
import com.group2.aives.domain.model.CourseDocument;
import com.group2.aives.domain.model.CourseDocumentContent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j

@Service
@RequiredArgsConstructor
public class CourseDocumentServiceImpl implements CourseDocumentService {

    private final CourseDocumentRepository courseDocumentRepository;
    private final CourseDocumentContentRepository courseDocumentContentRepository;
    private final CourseRepository courseRepository;

    @Value("${app.upload.dir:uploads/documents}")
    private String uploadDir;

    @Override
    @Transactional(readOnly = true)
    public List<CourseDocumentResponse> getDocumentsByCourse(Long courseId) {
        return courseDocumentRepository.findByCourse_CourseId(courseId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CourseDocumentResponse getDocumentById(Long documentId) {
        CourseDocument doc = courseDocumentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài liệu với ID: " + documentId));
        return mapToResponse(doc);
    }

    @Override
    @Transactional
    public CourseDocumentResponse addDocument(CourseDocumentRequest request) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy môn học với ID: " + request.getCourseId()));

        CourseDocument document = CourseDocument.builder()
                .course(course)
                .fileName(request.getFileName().trim())
                .fileUrl(request.getFileUrl().trim())
                .build();

        CourseDocument saved = courseDocumentRepository.save(document);

        if (request.getContentText() != null && !request.getContentText().isBlank()) {
            CourseDocumentContent content = CourseDocumentContent.builder()
                    .document(saved)
                    .contentText(request.getContentText().trim())
                    .build();
            courseDocumentContentRepository.save(content);
        }

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public CourseDocumentResponse uploadFile(MultipartFile file, Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy môn học ID: " + courseId));

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String extension = originalName.contains(".")
                ? originalName.substring(originalName.lastIndexOf('.'))
                : "";
        String storedName = UUID.randomUUID() + extension;

        try {
            Path dir = Paths.get(uploadDir);
            Files.createDirectories(dir);
            Path target = dir.resolve(storedName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            log.info("File đã lưu: {}", target.toAbsolutePath());
        } catch (IOException e) {
            throw new RuntimeException("Lỗi khi lưu file: " + e.getMessage(), e);
        }

        String fileUrl = "/uploads/documents/" + storedName;

        CourseDocument document = CourseDocument.builder()
                .course(course)
                .fileName(originalName)
                .fileUrl(fileUrl)
                .build();

        return mapToResponse(courseDocumentRepository.save(document));
    }

    @Override
    @Transactional
    public void deleteDocument(Long documentId) {
        if (!courseDocumentRepository.existsById(documentId)) {
            throw new RuntimeException("Không tìm thấy tài liệu với ID: " + documentId);
        }
        courseDocumentRepository.deleteById(documentId);
    }

    private CourseDocumentResponse mapToResponse(CourseDocument doc) {
        boolean hasContent = courseDocumentContentRepository.existsByDocument_DocumentId(doc.getDocumentId());
        return CourseDocumentResponse.builder()
                .documentId(doc.getDocumentId())
                .courseId(doc.getCourse() != null ? doc.getCourse().getCourseId() : null)
                .courseCode(doc.getCourse() != null ? doc.getCourse().getCourseCode() : null)
                .courseName(doc.getCourse() != null ? doc.getCourse().getCourseName() : null)
                .fileName(doc.getFileName())
                .fileUrl(doc.getFileUrl())
                .hasContent(hasContent)
                .uploadedAt(doc.getUploadedAt())
                .build();
    }
}
