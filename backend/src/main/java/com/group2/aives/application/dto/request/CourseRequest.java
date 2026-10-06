package com.group2.aives.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseRequest {

    @NotBlank(message = "Mã môn học không được để trống")
    private String courseCode;

    @NotBlank(message = "Tên môn học không được để trống")
    private String courseName;

    @NotNull(message = "ID giảng viên quản trị môn học không được để trống")
    private Long managedByUserId;
}
