package com.group2.aives.application.dto.response;

import com.group2.aives.domain.enums.RoleEnum;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private Long id;
    private String email;
    private String fullName;
    private RoleEnum role;
    private Set<String> roles;
    private Boolean isActive;
    private LocalDateTime createdAt;

    // Helper compatibility aliases
    public String getCode() {
        return email;
    }
}
