package com.projectpulse.pm.modules.role.controller;

import com.projectpulse.pm.common.api.ApiResponse;
import com.projectpulse.pm.modules.role.dto.RoleDTOs.*;
import com.projectpulse.pm.modules.role.service.RoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<RoleResponse>>> getAllRoles() {
        return ResponseEntity.ok(ApiResponse.success(roleService.getAllRoles()));
    }

    @GetMapping("/{code}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RoleResponse>> getRoleByCode(@PathVariable("code") String code) {
        return ResponseEntity.ok(ApiResponse.success(roleService.getRoleByCode(code)));
    }

    @GetMapping("/{code}/permissions")
    public ResponseEntity<ApiResponse<Set<String>>> getRolePermissions(@PathVariable("code") String code) {
        return ResponseEntity.ok(ApiResponse.success(roleService.getPermissionCodesByRoleCode(code)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RoleResponse>> createRole(@Valid @RequestBody CreateRoleRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Role created successfully", roleService.createRole(request)));
    }

    @PutMapping("/{code}/permissions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RoleResponse>> updateRolePermissions(@PathVariable("code") String code,
                                                                             @Valid @RequestBody UpdateRolePermissionsRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Role permissions updated successfully", roleService.updateRolePermissions(code, request)));
    }
}
