package com.group2.aives.infrastructure.config;
import com.group2.aives.application.service.UserService;
import com.group2.aives.application.dto.request.RegisterRequest;
import com.group2.aives.domain.repository.UserRepository;
import com.group2.aives.domain.model.enums.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
@Component @RequiredArgsConstructor
public class AdminBootstrap implements CommandLineRunner {
    private final UserService service;private final UserRepository users;
    @Value("${aives.admin.email:}") private String email;
    @Value("${aives.admin.password:}") private String password;
    @Value("${aives.admin.code:ADMIN01}") private String code;
    public void run(String... args) {
        if(email.isBlank() || password.isBlank() || users.findByEmail(email.trim().toLowerCase()).isPresent()) return;
        service.registerUser(RegisterRequest.builder().code(code).email(email).fullName("Administrator").password(password).role(Role.ADMIN).build());
    }
}
