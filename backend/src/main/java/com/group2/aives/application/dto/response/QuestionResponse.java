package com.group2.aives.application.dto.response;

import com.group2.aives.domain.model.enums.BloomLevel;
import com.group2.aives.domain.model.enums.QuestionStatus;
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
    private UUID chapterId;
    private com.group2.aives.domain.model.enums.Difficulty difficulty;
    private UUID materialId;
    private String sourceReference;

    private BloomLevel bloomLevel;
    private Boolean isAiGenerated;
    private QuestionStatus status;
    private String createdByName;
    @Builder.Default
    private List<RubricResponse> rubrics = new ArrayList<>();
    private Double totalRubricScore;
    private LocalDateTime createdAt;
}
