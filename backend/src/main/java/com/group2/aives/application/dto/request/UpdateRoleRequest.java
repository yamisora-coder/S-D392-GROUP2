package com.group2.aives.application.dto.request;

import com.group2.aives.domain.enums.RoleEnum;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRoleRequest {

    @NotNull(message = "Vai trò (Role) không được để trống")
    private RoleEnum role;
}
