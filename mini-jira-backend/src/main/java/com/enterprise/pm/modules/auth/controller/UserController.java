package com.enterprise.pm.modules.auth.controller;

import com.enterprise.pm.common.api.ApiResponse;
import com.enterprise.pm.modules.auth.dto.AuthDTOs.RegisterRequest;
import com.enterprise.pm.modules.auth.dto.AuthDTOs.UserResponse;
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
    @PreAuthorize("hasAnyRole('ADMIN', 'ROLE_ADMIN', 'PROJECT_MANAGER', 'ROLE_PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(@Valid @RequestBody RegisterRequest request) {
        UserResponse user = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success("User created successfully", user));
    }
}
