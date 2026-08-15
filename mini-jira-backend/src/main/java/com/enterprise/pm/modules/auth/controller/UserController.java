package com.enterprise.pm.modules.auth.controller;

import com.enterprise.pm.common.api.ApiResponse;
import com.enterprise.pm.modules.auth.dto.AuthDTOs.*;
import com.enterprise.pm.modules.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final AuthService authService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers(
            @RequestParam(value = "role", required = false) String role
    ) {
        return ResponseEntity.ok(ApiResponse.success(authService.getUsers(role)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(@Valid @RequestBody RegisterRequest request) {
        UserResponse user = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success("User created successfully", user));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> editUser(
            @PathVariable("id") Long id,
            @Valid @RequestBody EditUserRequest request
    ) {
        UserResponse user = authService.editUser(id, request);
        return ResponseEntity.ok(ApiResponse.success("User updated successfully", user));
    }
}
