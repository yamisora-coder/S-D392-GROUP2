package com.group2.aives.application.port.in;

import com.group2.aives.application.dto.request.CourseDocumentRequest;
import com.group2.aives.application.dto.response.CourseDocumentResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface CourseDocumentService {
    List<CourseDocumentResponse> getDocumentsByCourse(Long courseId);
    CourseDocumentResponse getDocumentById(Long documentId);
    CourseDocumentResponse addDocument(CourseDocumentRequest request);
    CourseDocumentResponse uploadFile(MultipartFile file, Long courseId);
    void deleteDocument(Long documentId);
}
