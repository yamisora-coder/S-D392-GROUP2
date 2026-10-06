package com.group2.aives.application.dto.response;

import com.group2.aives.domain.enums.BloomLevel;
import com.group2.aives.domain.enums.QuestionSource;
import com.group2.aives.domain.enums.QuestionStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionResponse {
    private Long id;
    private Long courseId;
    private String courseCode;
    private String courseName;
    private Long rubricId;
    private String rubricName;
    private String questionText;
    private String sampleAnswer;
    private BloomLevel bloomLevel;
    private Short difficulty;
    private QuestionSource sourceType;
    private QuestionStatus status;
    private Long reviewedById;
    private String reviewedByName;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;

    // Helper compatibility aliases
    public String getContent() {
        return questionText;
    }

    public Long getSubjectId() {
        return courseId;
    }

    public String getSubjectCode() {
        return courseCode;
    }

    public String getSubjectName() {
        return courseName;
    }
}
