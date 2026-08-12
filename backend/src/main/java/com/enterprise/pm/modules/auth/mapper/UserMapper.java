package com.enterprise.pm.modules.auth.mapper;

import com.enterprise.pm.modules.auth.dto.AuthDTOs.UserResponse;
import com.enterprise.pm.modules.auth.entity.Role;
import com.enterprise.pm.modules.auth.entity.User;

import java.util.stream.Collectors;

public class UserMapper {

    public static UserResponse toUserResponse(User user) {
        if (user == null) return null;
        return new UserResponse(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getStatus(),
            user.getLastLoginAt(),
            user.getRoles().stream().map(Role::getCode).collect(Collectors.toSet())
        );
    }
}
