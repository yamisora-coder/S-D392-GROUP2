package com.group2.aives.application.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseDocumentResponse {
    private Long documentId;
    private Long courseId;
    private String courseCode;
    private String courseName;
    private String fileName;
    private String fileUrl;
    private boolean hasContent;
    private LocalDateTime uploadedAt;
}
