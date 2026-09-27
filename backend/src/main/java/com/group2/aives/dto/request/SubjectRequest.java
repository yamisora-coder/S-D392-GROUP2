package com.group2.aives.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubjectRequest {

    @NotBlank(message = "Mã môn học không được để trống")
    private String code;

    @NotBlank(message = "Tên môn học không được để trống")
    private String name;

    private String description;
}
