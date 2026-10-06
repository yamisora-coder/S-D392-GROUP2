package com.group2.aives.application.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RubricResponse {
    private Long id;
    private String name;
    private String description;
    @Builder.Default
    private List<CriterionResponse> criteria = new ArrayList<>();
    private BigDecimal totalMaxScore;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CriterionResponse {
        private Long criterionId;
        private String criterionName;
        private BigDecimal maxScore;
        private String expectedAnswerKeywords;
    }
}
