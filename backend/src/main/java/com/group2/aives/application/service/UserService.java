package com.group2.aives.application.service;

import com.group2.aives.application.dto.request.LoginRequest;
import com.group2.aives.application.dto.request.RegisterRequest;
import com.group2.aives.application.dto.response.UserResponse;
import com.group2.aives.domain.model.enums.Role;

import java.util.List;

public interface UserService {
    List<UserResponse> getUsersByRole(Role role);
    List<UserResponse> getAllUsers();
    UserResponse registerUser(RegisterRequest request);
    UserResponse updateUserRole(String idOrCode, Role role);
    UserResponse login(LoginRequest request);
    UserResponse toggleUserStatus(String idOrCode);
}
