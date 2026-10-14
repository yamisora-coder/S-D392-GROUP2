package com.group2.aives.presentation.controller;

import com.group2.aives.application.dto.request.UserRequest;
import com.group2.aives.application.dto.response.UserResponse;
import com.group2.aives.domain.enums.RoleEnum;
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
