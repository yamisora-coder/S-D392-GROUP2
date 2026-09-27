package com.group2.aives.dto.response;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RubricResponse {
    private UUID id;
    private String criteriaName;
    private Double maxScore;
    private String description;
}
