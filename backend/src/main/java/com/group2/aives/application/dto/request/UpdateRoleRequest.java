package com.group2.aives.application.dto.request;

import com.group2.aives.domain.model.enums.Role;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateRoleRequest {

    @NotNull(message = "Vai trò (Role) không được để trống")
    private Role role;
}
