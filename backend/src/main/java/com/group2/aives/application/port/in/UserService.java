package com.group2.aives.application.port.in;

import com.group2.aives.application.dto.response.UserResponse;
import com.group2.aives.domain.enums.RoleEnum;

import java.util.List;

public interface UserService {
    List<UserResponse> getUsersByRole(RoleEnum role);
    List<UserResponse> getAllUsers();
}
