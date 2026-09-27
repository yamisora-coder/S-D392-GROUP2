package com.group2.aives.service;

import com.group2.aives.dto.response.UserResponse;
import com.group2.aives.entity.enums.Role;

import java.util.List;

public interface UserService {
    List<UserResponse> getUsersByRole(Role role);
    List<UserResponse> getAllUsers();
}
