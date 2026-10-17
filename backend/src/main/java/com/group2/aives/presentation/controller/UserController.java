package com.group2.aives.presentation.controller;

import com.group2.aives.application.dto.request.RegisterRequest;
import com.group2.aives.application.dto.request.UpdateRoleRequest;
import com.group2.aives.application.dto.request.UserRequest;
import com.group2.aives.application.dto.response.AuthResponse;
import com.group2.aives.application.dto.response.UserResponse;
import com.group2.aives.domain.enums.RoleEnum;
import com.group2.aives.application.port.in.AuthService;
import com.group2.aives.application.port.in.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "5. Người dùng (Users)", description = "Quản lý tài khoản Quản trị, Giảng viên và Sinh viên")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;
    private final AuthService authService;

    @GetMapping
    @Operation(summary = "Lấy danh sách người dùng (có thể lọc theo vai trò: ADMIN, LECTURER, STUDENT)")
    public ResponseEntity<List<UserResponse>> getUsers(@RequestParam(required = false) RoleEnum role) {
        if (role != null) {
            return ResponseEntity.ok(userService.getUsersByRole(role));
        }
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin chi tiết một người dùng")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PostMapping
    @Operation(summary = "Tạo tài khoản mới (Admin thực hiện)")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody UserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createUser(request));
    }

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản người dùng mới (Lưu trực tiếp vào PostgreSQL)")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse authResponse = authService.register(request);
        UserResponse response = UserResponse.builder()
                .id(authResponse.getUserId())
                .email(authResponse.getEmail())
                .fullName(authResponse.getFullName())
                .role(request.getRole() != null ? request.getRole() : RoleEnum.STUDENT)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{idOrCode}/role")
    @Operation(summary = "Quản trị viên cập nhật vai trò (Role: ADMIN, LECTURER, STUDENT) của người dùng")
    public ResponseEntity<UserResponse> updateUserRole(
            @PathVariable String idOrCode,
            @Valid @RequestBody UpdateRoleRequest request
    ) {
        return ResponseEntity.ok(userService.updateUserRole(idOrCode, request.getRole()));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin người dùng (Admin thực hiện)")
    public ResponseEntity<UserResponse> updateUser(@PathVariable Long id, @Valid @RequestBody UserRequest request) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa tài khoản người dùng (Admin thực hiện)")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/toggle-active")
    @Operation(summary = "Kích hoạt / Khóa tài khoản người dùng")
    public ResponseEntity<UserResponse> toggleActive(@PathVariable Long id) {
        return ResponseEntity.ok(userService.toggleActive(id));
    }
}
