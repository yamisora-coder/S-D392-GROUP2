package com.group2.aives.application.dto.request;

import com.group2.aives.domain.model.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {

    @NotBlank(message = "Mã số sinh viên (MSSV) không được để trống")
    private String code;

    @NotBlank(message = "Họ và tên không được để trống")
    private String fullName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    @jakarta.validation.constraints.Size(min=8, max=128, message="Mật khẩu cần từ 8 đến 128 ký tự")
    private String password;

    private Role role; // Mặc định là STUDENT nếu null
}
