package com.group2.aives.presentation.controller;

import com.group2.aives.application.dto.request.LoginRequest;
import com.group2.aives.application.dto.request.RegisterRequest;
import com.group2.aives.application.dto.response.AuthResponse;
import com.group2.aives.application.dto.response.UserResponse;
import com.group2.aives.application.port.in.AuthService;
import com.group2.aives.presentation.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "0. Xác thực & Tài khoản (Authentication)", description = "Đăng nhập, Đăng ký tài khoản Sinh viên, Lấy thông tin cá nhân & Đăng xuất")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập hệ thống (Email / MSSV & Mật khẩu)", description = "Xác thực và cấp Bearer JWT token có thời hạn 24 giờ")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Đăng nhập thành công!", response));
    }

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản sinh viên mới", description = "Đăng ký tài khoản mới với vai trò STUDENT và tự động cấp JWT token")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Đăng ký tài khoản thành công!", response));
    }

    @GetMapping("/me")
    @Operation(summary = "Lấy thông tin tài khoản hiện tại", description = "Đọc Bearer token từ Header và trả về thông tin người dùng đang đăng nhập")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Chưa đăng nhập hoặc phiên làm việc đã hết hạn"));
        }
        UserResponse user = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Thông tin người dùng", user));
    }

    @PostMapping("/logout")
    @Operation(summary = "Đăng xuất khỏi hệ thống", description = "Xác nhận kết thúc phiên làm việc trên client")
    public ResponseEntity<ApiResponse<Void>> logout() {
        return ResponseEntity.ok(ApiResponse.ok("Đăng xuất thành công!", null));
    }
}
