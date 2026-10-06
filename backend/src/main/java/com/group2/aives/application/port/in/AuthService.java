package com.group2.aives.application.port.in;

import com.group2.aives.application.dto.request.LoginRequest;
import com.group2.aives.application.dto.request.RegisterRequest;
import com.group2.aives.application.dto.response.AuthResponse;
import com.group2.aives.application.dto.response.UserResponse;

public interface AuthService {

    AuthResponse login(LoginRequest request);

    AuthResponse register(RegisterRequest request);

    UserResponse getCurrentUser(String email);
}
