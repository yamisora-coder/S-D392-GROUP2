package com.group2.aives.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RubricRequest {

    private Long id;

    @NotBlank(message = "Tên bộ rubric không được để trống")
    private String name;

    private String description;

    @Builder.Default
    private List<CriterionRequest> criteria = new ArrayList<>();

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CriterionRequest {
        private Long criterionId;

        @NotBlank(message = "Tên tiêu chí không được để trống")
        private String criterionName;

        @NotNull(message = "Điểm tối đa không được để trống")
        @Positive(message = "Điểm tối đa phải lớn hơn 0")
        private BigDecimal maxScore;

        private String expectedAnswerKeywords;
    }
}
