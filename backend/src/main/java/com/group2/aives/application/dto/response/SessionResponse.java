package com.group2.aives.application.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionResponse {
    private Long id;
    private Long examId;
    private String examTitle;
    private String courseCode;
    private String courseName;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private LocalDateTime scheduledStartTime;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private String status;
    private BigDecimal finalScore;
    private String lecturerFeedback;

    // Helper compatibility aliases
    public String getSubjectName() {
        return courseName;
    }

    public BigDecimal getFinalTeacherScore() {
        return finalScore;
    }

    public String getTeacherFeedback() {
        return lecturerFeedback;
    }
}
