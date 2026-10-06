package com.group2.aives.application.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamResponse {
    private Long id;
    private Long courseId;
    private String courseCode;
    private String courseName;
    private String title;
    private Integer durationMinutes;
    private Integer maxFollowUpPerQ;
    private int sessionCount;
    private LocalDateTime createdAt;

    // Helper compatibility aliases
    public Long getSubjectId() {
        return courseId;
    }

    public String getSubjectCode() {
        return courseCode;
    }

    public String getSubjectName() {
        return courseName;
    }

    public Integer getDurationPerStudentMins() {
        return durationMinutes;
    }

    public Integer getMaxFollowupQuestions() {
        return maxFollowUpPerQ;
    }
}
