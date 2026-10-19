package com.group2.aives.presentation.controller;

import com.group2.aives.application.dto.response.UserResponse;
import com.group2.aives.domain.model.enums.Role;
import com.group2.aives.application.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "5. Người dùng (Users)", description = "Quản lý tài khoản Giảng viên và Sinh viên")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "Lấy danh sách người dùng (có thể lọc theo vai trò: ADMIN, INSTRUCTOR, STUDENT)")
    public ResponseEntity<List<UserResponse>> getUsers(@RequestParam(required = false) Role role) {
        if (role != null) {
            return ResponseEntity.ok(userService.getUsersByRole(role));
        }
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản người dùng mới (Lưu trực tiếp vào PostgreSQL)")
    public ResponseEntity<UserResponse> register(@RequestBody @jakarta.validation.Valid com.group2.aives.application.dto.request.RegisterRequest request) {
        return ResponseEntity.ok(userService.registerUser(request));
    }

    @PutMapping("/{idOrCode}/role")
    @Operation(summary = "Quản trị viên cập nhật vai trò (Role: ADMIN, INSTRUCTOR, STUDENT) của người dùng")
    public ResponseEntity<UserResponse> updateUserRole(
            @PathVariable String idOrCode,
            @RequestBody @jakarta.validation.Valid com.group2.aives.application.dto.request.UpdateRoleRequest request
    ) {
        return ResponseEntity.ok(userService.updateUserRole(idOrCode, request.getRole()));
    }

    @PatchMapping("/{idOrCode}/status")
    @Operation(summary = "Khóa / Mở khóa tài khoản người dùng")
    public ResponseEntity<UserResponse> toggleUserStatus(@PathVariable String idOrCode) {
        return ResponseEntity.ok(userService.toggleUserStatus(idOrCode));
    }
}
