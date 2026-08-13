package com.enterprise.pm.modules.role.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.time.Instant;
import java.util.Set;

public class RoleDTOs {

    public record CreateRoleRequest(
        @NotBlank(message = "Role name is required")
        String name,

        @NotBlank(message = "Role code is required")
        String code,

        String description,
        Set<String> permissionCodes,
        Set<String> serviceCodes
    ) {}

    public record UpdateRolePermissionsRequest(
        @NotEmpty(message = "Permission codes cannot be empty")
        Set<String> permissionCodes
    ) {}

    public record RoleResponse(
        Long id,
        String name,
        String code,
        String description,
        boolean active,
        Set<PermissionResponse> permissions,
        Set<ServiceResponse> services,
        Instant createdAt,
        Instant updatedAt
    ) {}

    public record PermissionResponse(
        Long id,
        String name,
        String code,
        String description
    ) {}

    public record ServiceResponse(
        Long id,
        String name,
        String code,
        String description
    ) {}
}
