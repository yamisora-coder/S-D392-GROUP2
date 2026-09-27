package com.group2.aives.controller;

import com.group2.aives.dto.response.UserResponse;
import com.group2.aives.entity.enums.Role;
import com.group2.aives.service.UserService;
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
}
