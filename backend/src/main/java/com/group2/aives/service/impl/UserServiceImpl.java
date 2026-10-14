package com.group2.aives.service.impl;

import com.group2.aives.dto.response.UserResponse;
import com.group2.aives.entity.User;
import com.group2.aives.entity.enums.Role;
import com.group2.aives.repository.UserRepository;
import com.group2.aives.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

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
    public UserResponse registerUser(com.group2.aives.dto.request.RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail().trim().toLowerCase()).isPresent()) {
            throw new IllegalArgumentException("Email " + request.getEmail() + " đã tồn tại trên hệ thống!");
        }
        if (userRepository.findByCode(request.getCode().trim().toUpperCase()).isPresent()) {
            throw new IllegalArgumentException("Mã số sinh viên (MSSV) " + request.getCode() + " đã tồn tại trên hệ thống!");
        }

        User user = User.builder()
                .code(request.getCode().trim().toUpperCase())
                .fullName(request.getFullName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .role(request.getRole() != null ? request.getRole() : Role.STUDENT)
                .build();

        User savedUser = userRepository.save(user);
        return mapToResponse(savedUser);
    }

    @Override
    @Transactional
    public UserResponse updateUserRole(String idOrCode, Role role) {
        if (role == null) {
            throw new IllegalArgumentException("Vai trò (Role) không được để trống!");
        }

        User user = null;
        try {
            java.util.UUID uuid = java.util.UUID.fromString(idOrCode.trim());
            user = userRepository.findById(uuid).orElse(null);
        } catch (IllegalArgumentException ignored) {
        }

        if (user == null) {
            user = userRepository.findByCode(idOrCode.trim().toUpperCase())
                    .or(() -> userRepository.findByEmail(idOrCode.trim().toLowerCase()))
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng với mã định danh / ID: " + idOrCode));
        }

        user.setRole(role);
        User updated = userRepository.save(user);
        return mapToResponse(updated);
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .code(user.getCode())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
