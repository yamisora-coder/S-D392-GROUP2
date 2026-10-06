package com.group2.aives.application.service;

import com.group2.aives.application.dto.request.LoginRequest;
import com.group2.aives.application.dto.request.RegisterRequest;
import com.group2.aives.application.dto.response.AuthResponse;
import com.group2.aives.application.dto.response.UserResponse;
import com.group2.aives.application.port.in.AuthService;
import com.group2.aives.application.port.out.RoleRepository;
import com.group2.aives.application.port.out.UserRepository;
import com.group2.aives.domain.enums.RoleEnum;
import com.group2.aives.domain.exception.BadRequestException;
import com.group2.aives.domain.exception.ResourceNotFoundException;
import com.group2.aives.domain.model.Role;
import com.group2.aives.domain.model.User;
import com.group2.aives.infrastructure.security.CustomUserDetails;
import com.group2.aives.infrastructure.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String identifier = request.getIdentifier().trim().toLowerCase();

        // Tìm người dùng theo email chính xác hoặc tiền tố email (hỗ trợ MSSV e.g. SV102938)
        User user = userRepository.findByEmail(identifier)
                .orElseGet(() -> userRepository.findAll().stream()
                        .filter(u -> u.getEmail().toLowerCase().startsWith(identifier + "@") || u.getEmail().equalsIgnoreCase(identifier))
                        .findFirst()
                        .orElseThrow(() -> new BadRequestException("Tài khoản hoặc mật khẩu không chính xác")));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Tài khoản hoặc mật khẩu không chính xác");
        }

        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new BadRequestException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
        }

        CustomUserDetails userDetails = new CustomUserDetails(user);
        String token = jwtTokenProvider.generateToken(userDetails, user.getUserId(), user.getFullName());

        Set<String> roleNames = user.getRoles().stream()
                .map(r -> r.getRoleName().name())
                .collect(Collectors.toSet());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getUserId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(roleNames)
                .build();
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Mật khẩu xác nhận không khớp với mật khẩu đã nhập");
        }

        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email này đã được sử dụng trong hệ thống: " + email);
        }

        // Lấy vai trò mặc định STUDENT
        Role studentRole = roleRepository.findByRoleName(RoleEnum.STUDENT)
                .orElseGet(() -> roleRepository.save(Role.builder().roleName(RoleEnum.STUDENT).build()));

        Set<Role> roles = new HashSet<>();
        roles.add(studentRole);

        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .isActive(true)
                .roles(roles)
                .build();

        User saved = userRepository.save(user);

        CustomUserDetails userDetails = new CustomUserDetails(saved);
        String token = jwtTokenProvider.generateToken(userDetails, saved.getUserId(), saved.getFullName());

        Set<String> roleNames = saved.getRoles().stream()
                .map(r -> r.getRoleName().name())
                .collect(Collectors.toSet());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(saved.getUserId())
                .email(saved.getEmail())
                .fullName(saved.getFullName())
                .roles(roleNames)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin người dùng với email: " + email));

        RoleEnum primaryRole = user.getRoles().isEmpty() 
                ? RoleEnum.STUDENT 
                : user.getRoles().iterator().next().getRoleName();

        return UserResponse.builder()
                .id(user.getUserId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(primaryRole)
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
