package com.group2.aives.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RubricRequest {

    private UUID id;

    @NotBlank(message = "Tên tiêu chí rubric không được để trống")
    private String criteriaName;

    @NotNull(message = "Điểm tối đa không được để trống")
    @Positive(message = "Điểm tối đa phải lớn hơn 0")
    private Double maxScore;

    private String description;
}
