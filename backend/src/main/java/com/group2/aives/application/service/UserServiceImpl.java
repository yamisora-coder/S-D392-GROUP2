package com.group2.aives.application.service;

import com.group2.aives.application.dto.request.UserRequest;
import com.group2.aives.application.dto.response.UserResponse;
import com.group2.aives.domain.exception.BadRequestException;
import com.group2.aives.domain.exception.ResourceNotFoundException;
import com.group2.aives.domain.model.Role;
import com.group2.aives.domain.model.User;
import com.group2.aives.domain.enums.RoleEnum;
import com.group2.aives.application.port.out.RoleRepository;
import com.group2.aives.application.port.out.UserRepository;
import com.group2.aives.application.port.in.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

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

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        return mapToResponse(userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng ID: " + id)));
    }

    @Override
    @Transactional
    public UserResponse createUser(UserRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email đã tồn tại: " + email);
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new BadRequestException("Mật khẩu không được để trống khi tạo tài khoản mới");
        }

        Role role = roleRepository.findByRoleName(request.getRole())
                .orElseGet(() -> roleRepository.save(Role.builder().roleName(request.getRole()).build()));

        Set<Role> roles = new HashSet<>();
        roles.add(role);

        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .roles(roles)
                .build();

        return mapToResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, UserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng ID: " + id));

        String email = request.getEmail().trim().toLowerCase();
        if (!user.getEmail().equals(email) && userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email đã tồn tại: " + email);
        }

        user.setFullName(request.getFullName().trim());
        user.setEmail(email);
        if (request.getIsActive() != null) {
            user.setIsActive(request.getIsActive());
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        Role role = roleRepository.findByRoleName(request.getRole())
                .orElseGet(() -> roleRepository.save(Role.builder().roleName(request.getRole()).build()));
        Set<Role> roles = new HashSet<>();
        roles.add(role);
        user.setRoles(roles);

        return mapToResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy người dùng ID: " + id);
        }
        userRepository.deleteById(id);
    }

    @Override
    @Transactional
    public UserResponse toggleActive(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng ID: " + id));
        user.setIsActive(user.getIsActive() == null || !user.getIsActive());
        return mapToResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserResponse updateUserRole(String idOrCode, RoleEnum role) {
        if (role == null) {
            throw new BadRequestException("Vai trò (Role) không được để trống!");
        }

        User user = null;
        try {
            Long id = Long.parseLong(idOrCode.trim());
            user = userRepository.findById(id).orElse(null);
        } catch (NumberFormatException ignored) {
        }

        if (user == null) {
            user = userRepository.findByEmail(idOrCode.trim().toLowerCase())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với mã định danh / Email / ID: " + idOrCode));
        }

        Role targetRole = roleRepository.findByRoleName(role)
                .orElseGet(() -> roleRepository.save(Role.builder().roleName(role).build()));

        Set<Role> roles = new HashSet<>();
        roles.add(targetRole);
        user.setRoles(roles);

        return mapToResponse(userRepository.save(user));
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
