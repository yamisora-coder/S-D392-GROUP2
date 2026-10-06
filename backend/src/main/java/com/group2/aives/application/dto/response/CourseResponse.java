package com.group2.aives.application.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseResponse {
    private Long courseId;
    private String courseCode;
    private String courseName;
    private Long managedByUserId;
    private String managedByName;
    private int questionCount;
    private int examCount;
    private int documentCount;
    private LocalDateTime createdAt;
}
