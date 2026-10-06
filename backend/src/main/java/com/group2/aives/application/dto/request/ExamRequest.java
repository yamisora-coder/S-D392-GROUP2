package com.group2.aives.application.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExamRequest {

    @NotNull(message = "Môn học không được để trống")
    private Long courseId;

    @NotBlank(message = "Tên kỳ thi không được để trống")
    private String title;

    @NotNull(message = "Thời lượng thi không được để trống")
    @Min(value = 1, message = "Thời lượng thi tối thiểu 1 phút")
    private Integer durationMinutes;

    @Builder.Default
    @Min(value = 0, message = "Số câu hỏi đào sâu không âm")
    private Integer maxFollowUpPerQ = 2;

    // Helper compatibility aliases
    public Long getSubjectId() {
        return courseId;
    }

    public void setSubjectId(Long subjectId) {
        this.courseId = subjectId;
    }

    public Integer getDurationPerStudentMins() {
        return durationMinutes;
    }

    public void setDurationPerStudentMins(Integer durationPerStudentMins) {
        this.durationMinutes = durationPerStudentMins;
    }

    public Integer getMaxFollowupQuestions() {
        return maxFollowUpPerQ;
    }

    public void setMaxFollowupQuestions(Integer maxFollowupQuestions) {
        this.maxFollowUpPerQ = maxFollowupQuestions;
    }
}
