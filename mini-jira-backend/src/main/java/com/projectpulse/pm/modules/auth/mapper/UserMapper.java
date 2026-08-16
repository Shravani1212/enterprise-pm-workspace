package com.projectpulse.pm.modules.auth.mapper;

import com.projectpulse.pm.modules.auth.dto.AuthDTOs.RoleResponse;
import com.projectpulse.pm.modules.auth.dto.AuthDTOs.UserResponse;
import com.projectpulse.pm.modules.auth.entity.Role;
import com.projectpulse.pm.modules.auth.entity.User;
import org.hibernate.LazyInitializationException;

import java.util.Collections;
import java.util.Set;
import java.util.stream.Collectors;

public class UserMapper {

    public static UserResponse toUserResponse(User user) {
        if (user == null) return null;

        Set<String> roleCodes = Collections.emptySet();
        Set<Long> roleIds = Collections.emptySet();
        Set<RoleResponse> roleResponses = Collections.emptySet();

        try {
            if (user.getRoles() != null) {
                roleCodes = user.getRoles().stream().map(Role::getCode).collect(Collectors.toSet());
                roleIds = user.getRoles().stream().map(Role::getId).collect(Collectors.toSet());
                roleResponses = user.getRoles().stream()
                        .map(r -> new RoleResponse(r.getId(), r.getName(), r.getCode()))
                        .collect(Collectors.toSet());
            }
        } catch (LazyInitializationException e) {
            roleCodes = Collections.emptySet();
            roleIds = Collections.emptySet();
            roleResponses = Collections.emptySet();
        }

        return new UserResponse(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getStatus(),
            user.getLastLoginAt(),
            roleCodes,
            roleIds,
            roleResponses
        );
    }
}
