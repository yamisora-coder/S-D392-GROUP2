package com.group2.aives.dto.response;

import com.group2.aives.entity.enums.BloomLevel;
import com.group2.aives.entity.enums.QuestionStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionResponse {
    private UUID id;
    private UUID subjectId;
    private String subjectCode;
    private String subjectName;
    private String content;
    private String sampleAnswer;
    private BloomLevel bloomLevel;
    private Boolean isAiGenerated;
    private QuestionStatus status;
    private String createdByName;
    @Builder.Default
    private List<RubricResponse> rubrics = new ArrayList<>();
    private Double totalRubricScore;
    private LocalDateTime createdAt;
}
