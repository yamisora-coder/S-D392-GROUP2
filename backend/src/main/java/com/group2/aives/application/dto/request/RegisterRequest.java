package com.group2.aives.application.dto.request;

import com.group2.aives.domain.enums.RoleEnum;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Họ và tên không được để trống")
    @Size(max = 100, message = "Họ và tên không vượt quá 100 ký tự")
    private String fullName;

    private String studentCode;

    private String code; // Hỗ trợ tương thích cả studentCode hoặc code từ FE

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Định dạng email không hợp lệ")
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, message = "Mật khẩu phải có ít nhất 6 ký tự")
    private String password;

    private String confirmPassword;

    private RoleEnum role;

    public String getEffectiveCode() {
        if (studentCode != null && !studentCode.isBlank()) {
            return studentCode.trim().toUpperCase();
        }
        if (code != null && !code.isBlank()) {
            return code.trim().toUpperCase();
        }
        return null;
    }
}
