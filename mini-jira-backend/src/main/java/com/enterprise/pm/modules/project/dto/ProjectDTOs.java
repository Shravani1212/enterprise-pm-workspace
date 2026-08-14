package com.enterprise.pm.modules.project.dto;

import com.enterprise.pm.modules.auth.dto.AuthDTOs.UserResponse;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public class ProjectDTOs {

    public record ProjectCreateRequest(
        @NotBlank(message = "Project name is required")
        @Size(min = 2, max = 100)
        String name,

        @NotBlank(message = "Project code is required")
        @Size(min = 2, max = 20)
        String code,

        String description,
        LocalDate startDate,
        LocalDate endDate
    ) {}

    public record ProjectUpdateRequest(
        @NotBlank(message = "Project name is required")
        @Size(min = 2, max = 100)
        String name,

        String description,
        LocalDate startDate,
        LocalDate endDate
    ) {}

    public record ProjectResponse(
        Long id,
        String name,
        String code,
        String description,
        String status,
        LocalDate startDate,
        LocalDate endDate,
        UserResponse createdBy,
        List<ProjectMemberResponse> members,
        Instant createdAt,
        Instant updatedAt,
        Long version
    ) {}

    public record ProjectMemberResponse(
        Long id,
        Long projectId,
        UserResponse user,
        String projectRole,
        boolean active,
        Instant joinedAt
    ) {}

    public record AddMemberRequest(
        @jakarta.validation.constraints.NotNull(message = "User ID is required")
        Long userId,

        @jakarta.validation.constraints.NotBlank(message = "Role code is required")
        String roleCode
    ) {}
}
