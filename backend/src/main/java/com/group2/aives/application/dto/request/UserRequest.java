package com.group2.aives.application.dto.request;

import com.group2.aives.domain.enums.RoleEnum;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserRequest {

    @NotBlank(message = "Họ tên không được để trống")
    private String fullName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    private String password;

    @NotNull(message = "Vai trò không được để trống")
    private RoleEnum role;

    @Builder.Default
    private Boolean isActive = true;
}
