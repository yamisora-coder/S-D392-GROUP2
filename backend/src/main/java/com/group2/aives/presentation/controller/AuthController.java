package com.group2.aives.presentation.controller;
import com.group2.aives.application.dto.request.*;
import com.group2.aives.application.dto.response.UserResponse;
import com.group2.aives.application.service.UserService;
import com.group2.aives.domain.model.User;
import com.group2.aives.domain.model.enums.Role;
import com.group2.aives.infrastructure.security.TokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/auth") @RequiredArgsConstructor
public class AuthController {
    private final UserService users; private final TokenService tokens;
    @PostMapping("/login") public UserResponse login(@Valid @RequestBody LoginRequest request) {
        UserResponse user=users.login(request);user.setAccessToken(tokens.issue(user.getId()));return user;
    }
    @PostMapping("/register") public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        request.setRole(Role.STUDENT);return ResponseEntity.status(201).body(users.registerUser(request));
    }
    @GetMapping("/me") public UserResponse me(HttpServletRequest request) {
        User u=(User)request.getAttribute("actor");
        return UserResponse.builder().id(u.getId()).code(u.getCode()).email(u.getEmail()).fullName(u.getFullName())
            .role(u.getRole()).isAdmin(u.getRole()==Role.ADMIN).status("ACTIVE").build();
    }
    @PostMapping("/logout") public ResponseEntity<Void> logout(@RequestHeader("Authorization") String auth) {
        tokens.revoke(auth.substring(7));return ResponseEntity.noContent().build();
    }
}
