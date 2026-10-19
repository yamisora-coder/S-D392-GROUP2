package com.group2.aives.presentation.controller;

import com.group2.aives.application.dto.request.LoginRequest;
import com.group2.aives.application.dto.response.UserResponse;
import com.group2.aives.application.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "0. Xác thực (Auth)", description = "Đăng nhập bằng MSSV / Mã giảng viên / Email")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserService userService;

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập, trả về thông tin người dùng")
    public ResponseEntity<UserResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(userService.login(request));
    }
}
