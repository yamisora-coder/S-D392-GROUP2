package com.group2.aives.presentation.controller;
import com.group2.aives.application.dto.request.RegisterRequest;
import com.group2.aives.application.dto.response.UserResponse;
import com.group2.aives.application.service.UserService;
import com.group2.aives.domain.model.enums.Role;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/admin/users") @RequiredArgsConstructor
public class AdminUserController {
    private final UserService users;
    @PostMapping("/admins") public ResponseEntity<UserResponse> admin(@Valid @RequestBody RegisterRequest request) {
        request.setRole(Role.ADMIN);return ResponseEntity.status(201).body(users.registerUser(request));
    }
    @PostMapping public ResponseEntity<UserResponse> create(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(201).body(users.registerUser(request));
    }
}
