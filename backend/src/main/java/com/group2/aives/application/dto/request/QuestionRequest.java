package com.group2.aives.application.dto.request;

import com.group2.aives.domain.model.enums.BloomLevel;
import com.group2.aives.domain.model.enums.QuestionStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionRequest {

    @NotNull(message = "Môn học không được để trống")
    private UUID subjectId;

    @NotBlank(message = "Nội dung câu hỏi không được để trống")
    private String content;

    private String sampleAnswer;
    private UUID chapterId;
    private com.group2.aives.domain.model.enums.Difficulty difficulty;
    private UUID materialId;
    private String sourceReference;


    @NotNull(message = "Mức độ nhận thức Bloom không được để trống")
    private BloomLevel bloomLevel;

    private Boolean isAiGenerated;

    private QuestionStatus status;

    private UUID createdById;

    @jakarta.validation.Valid
    @Builder.Default
    private List<RubricRequest> rubrics = new ArrayList<>();
}
