package com.projectpulse.pm.modules.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public class AuthDTOs {

    public record LoginRequest(
        @NotBlank(message = "Username or email is required")
        String usernameOrEmail,

        @NotBlank(message = "Password is required")
        String password,

        @NotBlank(message = "Captcha token is required")
        String captchaToken
    ) {}

    public record RegisterRequest(
        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 50)
        String username,

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        String password,

        String firstName,
        String lastName,

        Set<Long> roleIds,
        Set<String> roleCodes
    ) {}

    public record RoleResponse(
        Long id,
        String name,
        String code
    ) {}

    public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresInMs,
        UserResponse user
    ) {}

    public record UserResponse(
        Long id,
        String username,
        String email,
        String firstName,
        String lastName,
        String status,
        Instant lastLoginAt,
        Set<String> roles,
        Set<Long> roleIds,
        Set<RoleResponse> roleDetails
    ) {
        public static UserResponse from(com.projectpulse.pm.modules.auth.entity.User user) {
            return com.projectpulse.pm.modules.auth.mapper.UserMapper.toUserResponse(user);
        }
    }

    public record RevokeSessionRequest(
        @NotNull(message = "Session ID is required")
        UUID sessionId
    ) {}

    public record UpdateProfileRequest(
        @NotBlank(message = "First name is required")
        String firstName,

        @NotBlank(message = "Last name is required")
        String lastName,

        @Email(message = "Invalid email format")
        @NotBlank(message = "Email is required")
        String email,

        String newPassword
    ) {}

    public record EditUserRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String email,

        String firstName,
        String lastName,
        String status,
        Set<String> roleCodes
    ) {}
}
