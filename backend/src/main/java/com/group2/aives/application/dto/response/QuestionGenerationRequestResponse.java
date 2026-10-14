package com.group2.aives.application.dto.response;

import com.group2.aives.domain.enums.BloomLevel;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionGenerationRequestResponse {
    private Long requestId;
    private Long courseId;
    private String courseCode;
    private String courseName;
    private Long requestedByUserId;
    private String requestedByName;
    private String topic;
    private BloomLevel bloomLevel;
    private Integer targetCount;
    private String status;
    private List<QuestionResponse> generatedQuestions;
    private LocalDateTime createdAt;
}
