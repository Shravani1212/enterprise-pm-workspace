package com.enterprise.pm.modules.auth.controller;

import com.enterprise.pm.common.api.ApiResponse;
import com.enterprise.pm.common.exception.ResourceNotFoundException;
import com.enterprise.pm.modules.auth.dto.AuthDTOs.*;
import com.enterprise.pm.modules.auth.entity.Session;
import com.enterprise.pm.modules.auth.entity.User;
import com.enterprise.pm.modules.auth.repository.UserRepository;
import com.enterprise.pm.modules.auth.service.AuthService;
import com.enterprise.pm.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponse>> register(@Valid @RequestBody RegisterRequest request) {
        UserResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success("User registered successfully", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request,
                                                           HttpServletRequest httpRequest) {
        String deviceInfo = httpRequest.getHeader("User-Agent");
        String ipAddress = httpRequest.getRemoteAddr();
        AuthResponse response = authService.login(request, deviceInfo, ipAddress);

        ResponseCookie accessCookie = createCookie("jwt_access_token", response.accessToken(), 3600);
        ResponseCookie refreshCookie = createCookie("jwt_refresh_token", response.refreshToken(), 7 * 24 * 3600);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @CookieValue(name = "jwt_refresh_token", required = false) String cookieRefreshToken) {

        if (cookieRefreshToken == null || cookieRefreshToken.isBlank()) {
            throw new IllegalArgumentException("Refresh token HttpOnly cookie is required");
        }

        AuthResponse response = authService.refreshToken(cookieRefreshToken);
        ResponseCookie accessCookie = createCookie("jwt_access_token", response.accessToken(), 3600);
        ResponseCookie refreshCookie = createCookie("jwt_refresh_token", response.refreshToken(), 7 * 24 * 3600);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(ApiResponse.success("Token refreshed successfully", response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @CookieValue(name = "jwt_refresh_token", required = false) String cookieRefreshToken) {

        if (cookieRefreshToken != null && !cookieRefreshToken.isBlank()) {
            authService.logout(cookieRefreshToken);
        }

        ResponseCookie clearAccessCookie = createCookie("jwt_access_token", "", 0);
        ResponseCookie clearRefreshCookie = createCookie("jwt_refresh_token", "", 0);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearAccessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, clearRefreshCookie.toString())
                .body(ApiResponse.success("Logout successful", null));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(@AuthenticationPrincipal UserPrincipal currentUser) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + currentUser.getId()));
        return ResponseEntity.ok(ApiResponse.success(UserResponse.from(user)));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserResponse response = authService.updateProfile(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", response));
    }

    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<List<Session>>> getActiveSessions(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<Session> sessions = authService.getUserActiveSessions(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(sessions));
    }

    @PostMapping("/sessions/revoke")
    public ResponseEntity<ApiResponse<Void>> revokeSession(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody RevokeSessionRequest request) {
        authService.revokeSession(currentUser.getId(), request.sessionId());
        return ResponseEntity.ok(ApiResponse.success("Session revoked successfully", null));
    }

    private ResponseCookie createCookie(String name, String value, long maxAgeSeconds) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(false) // Set to true in production with HTTPS
                .path("/")
                .maxAge(maxAgeSeconds)
                .sameSite("Strict")
                .build();
    }
}
