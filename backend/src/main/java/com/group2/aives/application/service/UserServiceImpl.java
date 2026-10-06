package com.group2.aives.application.service;

import com.group2.aives.application.dto.response.UserResponse;
import com.group2.aives.domain.model.Role;
import com.group2.aives.domain.model.User;
import com.group2.aives.domain.enums.RoleEnum;
import com.group2.aives.application.port.out.UserRepository;
import com.group2.aives.application.port.in.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getUsersByRole(RoleEnum role) {
        return userRepository.findByRoles_RoleName(role).stream()
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

    private UserResponse mapToResponse(User user) {
        Set<String> roleNames = user.getRoles().stream()
                .map(r -> r.getRoleName().name())
                .collect(Collectors.toSet());

        RoleEnum primaryRole = user.getRoles().stream()
                .map(Role::getRoleName)
                .findFirst()
                .orElse(RoleEnum.STUDENT);

        return UserResponse.builder()
                .id(user.getUserId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(primaryRole)
                .roles(roleNames)
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
