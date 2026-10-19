package com.group2.aives.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    @NotBlank(message = "Vui lòng nhập MSSV / Mã giảng viên / Email")
    private String emailOrCode;

    @NotBlank(message = "Vui lòng nhập mật khẩu")
    private String password;
}
