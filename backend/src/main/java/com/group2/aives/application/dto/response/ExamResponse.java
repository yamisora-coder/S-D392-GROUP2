package com.group2.aives.application.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamResponse {
    private UUID id;
    private UUID subjectId;
    private String subjectCode;
    private String subjectName;
    private String title;
    private Integer durationPerStudentMins;
    private Integer maxMainQuestions;
    private Integer maxFollowupQuestions;
    private Integer answerTimeSeconds;
    private int sessionCount;
    private LocalDateTime createdAt;
}
