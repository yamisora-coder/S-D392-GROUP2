package com.group2.aives.application.dto.response;

import com.group2.aives.domain.model.enums.Role;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private UUID id;
    @com.fasterxml.jackson.annotation.JsonProperty("isAdmin")
    private boolean isAdmin;
    private String accessToken;
    private String email;
    private String fullName;
    private Role role;
    private String code;
    private String status; // ACTIVE | LOCKED
    private LocalDateTime createdAt;
}
