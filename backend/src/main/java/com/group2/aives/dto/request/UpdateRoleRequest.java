package com.group2.aives.dto.request;

import com.group2.aives.entity.enums.Role;
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
