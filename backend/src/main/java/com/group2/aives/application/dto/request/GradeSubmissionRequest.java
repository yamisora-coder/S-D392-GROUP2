package com.group2.aives.application.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GradeSubmissionRequest {

    @NotNull(message = "Điểm chốt không được để trống")
    @DecimalMin(value = "0.0", message = "Điểm tối thiểu là 0")
    @DecimalMax(value = "10.0", message = "Điểm tối đa là 10")
    private BigDecimal finalScore;

    private String feedback;

    private Long confirmedById;

    // Helper compatibility aliases
    public BigDecimal getFinalTeacherScore() {
        return finalScore;
    }

    public void setFinalTeacherScore(BigDecimal score) {
        this.finalScore = score;
    }

    public String getTeacherFeedback() {
        return feedback;
    }

    public void setTeacherFeedback(String feedback) {
        this.feedback = feedback;
    }
}
