package com.group2.aives.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GradeSubmissionRequest {

    @NotNull(message = "Điểm chốt không được để trống")
    @Min(value = 0, message = "Điểm tối thiểu là 0")
    @Max(value = 10, message = "Điểm tối đa là 10")
    private Double finalTeacherScore;

    private String teacherFeedback;
}
