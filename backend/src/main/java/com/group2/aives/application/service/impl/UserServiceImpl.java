package com.group2.aives.application.service.impl;

import com.group2.aives.application.dto.request.LoginRequest;
import com.group2.aives.application.dto.request.RegisterRequest;
import com.group2.aives.application.dto.response.UserResponse;
import com.group2.aives.application.service.UserService;
import com.group2.aives.domain.model.User;
import com.group2.aives.domain.model.enums.Role;
import com.group2.aives.domain.repository.UserRepository;
import com.group2.aives.domain.service.PasswordHasher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordHasher passwordHasher;

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getUsersByRole(Role role) {
        return userRepository.findByRole(role).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UserResponse registerUser(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail().trim().toLowerCase()).isPresent()) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT, "Email " + request.getEmail() + " đã tồn tại trên hệ thống!");
        }
        if (userRepository.findByCode(request.getCode().trim().toUpperCase()).isPresent()) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT, "Mã số sinh viên (MSSV) " + request.getCode() + " đã tồn tại trên hệ thống!");
        }

        User user = User.builder()
                .code(request.getCode().trim().toUpperCase())
                .fullName(request.getFullName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .role(request.getRole() != null ? request.getRole() : Role.STUDENT)
                .passwordHash(passwordHasher.hash(request.getPassword()))
                .active(true)
                .build();

        User savedUser = userRepository.save(user);
        return mapToResponse(savedUser);
    }

    @Override
    @Transactional
    public UserResponse updateUserRole(String idOrCode, Role role) {
        User user = findByIdOrCodeOrEmail(idOrCode);
        user.changeRole(role);
        return mapToResponse(userRepository.save(user));
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse login(LoginRequest request) {
        String key = request.getEmailOrCode().trim();
        User user = userRepository.findByCode(key.toUpperCase())
                .or(() -> userRepository.findByEmail(key.toLowerCase()))
                .orElseThrow(() -> new IllegalArgumentException("Tài khoản (MSSV / Email) không tồn tại trên hệ thống!"));

        if (!passwordHasher.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Mật khẩu không chính xác! Vui lòng thử lại.");
        }
        if (!user.isAccountActive()) {
            throw new IllegalArgumentException("Tài khoản đã bị khóa. Vui lòng liên hệ Quản trị viên.");
        }
        return mapToResponse(user);
    }

    @Override
    @Transactional
    public UserResponse toggleUserStatus(String idOrCode) {
        User user = findByIdOrCodeOrEmail(idOrCode);
        user.toggleActive();
        return mapToResponse(userRepository.save(user));
    }

    private User findByIdOrCodeOrEmail(String idOrCode) {
        if (idOrCode == null || idOrCode.isBlank()) {
            throw new IllegalArgumentException("Mã tài khoản không hợp lệ!");
        }
        String key = idOrCode.trim();
        Optional<User> byId = Optional.empty();
        try {
            byId = userRepository.findById(UUID.fromString(key));
        } catch (IllegalArgumentException ignored) {
            // không phải UUID -> tìm theo mã / email
        }
        return byId
                .or(() -> userRepository.findByCode(key.toUpperCase()))
                .or(() -> userRepository.findByEmail(key.toLowerCase()))
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng với mã định danh / ID: " + idOrCode));
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .isAdmin(user.getRole() == Role.ADMIN)
                .code(user.getCode())
                .status(user.isAccountActive() ? "ACTIVE" : "LOCKED")
                .createdAt(user.getCreatedAt())
                .build();
    }
}
