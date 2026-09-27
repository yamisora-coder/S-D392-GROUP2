package com.group2.aives.dto.response;

import com.group2.aives.entity.enums.Role;
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
    private String email;
    private String fullName;
    private Role role;
    private String code;
    private LocalDateTime createdAt;
}
