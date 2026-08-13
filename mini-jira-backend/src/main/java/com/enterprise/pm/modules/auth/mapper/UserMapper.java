package com.enterprise.pm.modules.auth.mapper;

import com.enterprise.pm.modules.auth.dto.AuthDTOs.RoleResponse;
import com.enterprise.pm.modules.auth.dto.AuthDTOs.UserResponse;
import com.enterprise.pm.modules.auth.entity.Role;
import com.enterprise.pm.modules.auth.entity.User;

import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

public class UserMapper {

    public static UserResponse toUserResponse(User user) {
        if (user == null) return null;

        Set<Role> roles = user.getRoles() != null ? user.getRoles() : Collections.emptySet();

        return new UserResponse(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getStatus(),
            user.getLastLoginAt(),
            roles.stream().map(Role::getCode).collect(Collectors.toSet()),
            roles.stream().map(Role::getId).collect(Collectors.toSet()),
            roles.stream().map(r -> new RoleResponse(r.getId(), r.getName(), r.getCode())).collect(Collectors.toSet())
        );
    }
}
