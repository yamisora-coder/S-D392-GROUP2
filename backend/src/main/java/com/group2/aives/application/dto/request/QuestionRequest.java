package com.group2.aives.application.dto.request;

import com.group2.aives.domain.enums.BloomLevel;
import com.group2.aives.domain.enums.QuestionSource;
import com.group2.aives.domain.enums.QuestionStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionRequest {

    @NotNull(message = "Môn học không được để trống")
    private Long courseId;

    @NotNull(message = "Bộ Rubric chấm điểm không được để trống")
    private Long rubricId;

    @NotBlank(message = "Nội dung câu hỏi không được để trống")
    private String questionText;

    private String sampleAnswer;

    @NotNull(message = "Mức độ nhận thức Bloom không được để trống")
    private BloomLevel bloomLevel;

    @Builder.Default
    private Short difficulty = 1;

    @Builder.Default
    private QuestionSource sourceType = QuestionSource.MANUAL;

    @Builder.Default
    private QuestionStatus status = QuestionStatus.DRAFT;

    private Long reviewedById;

    // Helper compatibility aliases
    public String getContent() {
        return questionText;
    }

    public void setContent(String content) {
        this.questionText = content;
    }

    public Long getSubjectId() {
        return courseId;
    }

    public void setSubjectId(Long subjectId) {
        this.courseId = subjectId;
    }
}
