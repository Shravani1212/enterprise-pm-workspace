package com.projectpulse.pm.modules.role.service;

import com.projectpulse.pm.common.exception.ResourceNotFoundException;
import com.projectpulse.pm.modules.auth.entity.Permission;
import com.projectpulse.pm.modules.auth.entity.Role;
import com.projectpulse.pm.modules.auth.entity.ServiceEntity;
import com.projectpulse.pm.modules.auth.repository.RoleRepository;
import com.projectpulse.pm.modules.role.dto.RoleDTOs.*;
import com.projectpulse.pm.modules.role.repository.PermissionRepository;
import com.projectpulse.pm.modules.role.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final ServiceRepository serviceRepository;

    @Transactional(readOnly = true)
    public List<RoleResponse> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(this::toRoleResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public RoleResponse getRoleByCode(String code) {
        Role role = roleRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with code: " + code));
        return toRoleResponse(role);
    }

    @Cacheable(value = "role_permissions", key = "#roleCode")
    @Transactional(readOnly = true)
    public Set<String> getPermissionCodesByRoleCode(String roleCode) {
        Role role = roleRepository.findByCode(roleCode)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with code: " + roleCode));

        return role.getPermissions().stream()
                .map(Permission::getCode)
                .collect(Collectors.toSet());
    }

    @Transactional
    public RoleResponse createRole(CreateRoleRequest request) {
        if (roleRepository.findByCode(request.code()).isPresent()) {
            throw new IllegalArgumentException("Role code already exists: " + request.code());
        }

        Role role = Role.builder()
                .name(request.name())
                .code(request.code())
                .description(request.description())
                .active(true)
                .build();

        if (request.permissionCodes() != null && !request.permissionCodes().isEmpty()) {
            Set<Permission> permissions = request.permissionCodes().stream()
                    .map(code -> permissionRepository.findByCode(code)
                            .orElseThrow(() -> new ResourceNotFoundException("Permission not found: " + code)))
                    .collect(Collectors.toSet());
            role.setPermissions(permissions);
        }

        if (request.serviceCodes() != null && !request.serviceCodes().isEmpty()) {
            Set<ServiceEntity> services = request.serviceCodes().stream()
                    .map(code -> serviceRepository.findByCode(code)
                            .orElseThrow(() -> new ResourceNotFoundException("Service not found: " + code)))
                    .collect(Collectors.toSet());
            role.setServices(services);
        }

        Role savedRole = roleRepository.save(role);
        return toRoleResponse(savedRole);
    }

    @CacheEvict(value = "role_permissions", key = "#roleCode")
    @Transactional
    public RoleResponse updateRolePermissions(String roleCode, UpdateRolePermissionsRequest request) {
        Role role = roleRepository.findByCode(roleCode)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with code: " + roleCode));

        Set<Permission> newPermissions = request.permissionCodes().stream()
                .map(code -> permissionRepository.findByCode(code)
                        .orElseThrow(() -> new ResourceNotFoundException("Permission not found: " + code)))
                .collect(Collectors.toSet());

        role.setPermissions(newPermissions);
        role.setUpdatedAt(Instant.now());

        Role updatedRole = roleRepository.save(role);
        return toRoleResponse(updatedRole);
    }

    private RoleResponse toRoleResponse(Role role) {
        Set<PermissionResponse> permissionResponses = role.getPermissions() != null
                ? role.getPermissions().stream().map(p -> new PermissionResponse(p.getId(), p.getName(), p.getCode(), p.getDescription())).collect(Collectors.toSet())
                : java.util.Collections.emptySet();

        Set<ServiceResponse> serviceResponses = role.getServices() != null
                ? role.getServices().stream().map(s -> new ServiceResponse(s.getId(), s.getName(), s.getCode(), s.getDescription())).collect(Collectors.toSet())
                : java.util.Collections.emptySet();

        return new RoleResponse(
                role.getId(),
                role.getName(),
                role.getCode(),
                role.getDescription(),
                role.isActive(),
                permissionResponses,
                serviceResponses,
                role.getCreatedAt(),
                role.getUpdatedAt()
        );
    }
}
