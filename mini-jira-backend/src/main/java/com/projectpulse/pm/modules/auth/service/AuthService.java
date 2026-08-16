package com.projectpulse.pm.modules.auth.service;

import com.projectpulse.pm.common.exception.ResourceNotFoundException;
import com.projectpulse.pm.modules.auth.dto.AuthDTOs.*;
import com.projectpulse.pm.modules.auth.entity.RefreshToken;
import com.projectpulse.pm.modules.auth.entity.Role;
import com.projectpulse.pm.modules.auth.entity.Session;
import com.projectpulse.pm.modules.auth.entity.User;
import com.projectpulse.pm.modules.auth.mapper.UserMapper;
import com.projectpulse.pm.modules.auth.repository.RefreshTokenRepository;
import com.projectpulse.pm.modules.auth.repository.RoleRepository;
import com.projectpulse.pm.modules.auth.repository.SessionRepository;
import com.projectpulse.pm.modules.auth.repository.UserRepository;
import com.projectpulse.pm.security.JwtTokenProvider;
import com.projectpulse.pm.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final SessionRepository sessionRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final com.projectpulse.pm.modules.project.repository.ProjectRepository projectRepository;
    private final com.projectpulse.pm.modules.project.repository.ProjectMemberRepository projectMemberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;

    @Value("${app.jwt.access-token-expiration-ms:900000}")
    private long accessTokenExpirationMs;

    @Value("${app.jwt.refresh-token-expiration-ms:604800000}")
    private long refreshTokenExpirationMs;

    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        User user = User.builder()
                .username(request.username())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .firstName(request.firstName() != null && !request.firstName().isBlank() ? request.firstName() : request.username())
                .lastName(request.lastName() != null && !request.lastName().isBlank() ? request.lastName() : "User")
                .status("ACTIVE")
                .build();

        java.util.Set<Role> assignedRoles = new java.util.HashSet<>();

        if (request.roleIds() != null && !request.roleIds().isEmpty()) {
            List<Role> foundRoles = roleRepository.findAllById(request.roleIds());
            assignedRoles.addAll(foundRoles);
        }
        if (request.roleCodes() != null && !request.roleCodes().isEmpty()) {
            for (String code : request.roleCodes()) {
                if (code != null && !code.isBlank()) {
                    String cleanCode = code.replace("ROLE_", "");
                    roleRepository.findByCode(cleanCode).ifPresent(assignedRoles::add);
                    roleRepository.findByCode("ROLE_" + cleanCode).ifPresent(assignedRoles::add);
                    roleRepository.findByCode(code).ifPresent(assignedRoles::add);
                }
            }
        }
        if (assignedRoles.isEmpty()) {
            roleRepository.findByCode("DEVELOPER").ifPresent(assignedRoles::add);
            roleRepository.findByCode("ROLE_DEVELOPER").ifPresent(assignedRoles::add);
        }

        user.setRoles(assignedRoles);
        User savedUser = userRepository.save(user);

        // Auto-enroll new user into all active workspace projects
        try {
            Role assignedRole = assignedRoles.stream().findFirst().orElse(null);
            List<com.projectpulse.pm.modules.project.entity.Project> projects = projectRepository.findAll();
            for (com.projectpulse.pm.modules.project.entity.Project p : projects) {
                com.projectpulse.pm.modules.project.entity.ProjectMember member = com.projectpulse.pm.modules.project.entity.ProjectMember.builder()
                        .project(p)
                        .user(savedUser)
                        .projectRole(assignedRole)
                        .active(true)
                        .build();
                projectMemberRepository.save(member);
            }
        } catch (Exception e) {
            // Ignore auto-enrollment warnings
        }

        return UserMapper.toUserResponse(savedUser);
    }

    @Transactional
    public AuthResponse login(LoginRequest request, String deviceInfo, String ipAddress) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.usernameOrEmail(), request.password())
        );

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        String accessToken = tokenProvider.generateAccessToken(authentication);
        String rawRefreshToken = UUID.randomUUID().toString();
        String tokenHash = hashToken(rawRefreshToken);

        Session session = Session.builder()
                .user(user)
                .tokenHash(tokenHash)
                .deviceInfo(deviceInfo != null ? deviceInfo : "Unknown Device")
                .ipAddress(ipAddress != null ? ipAddress : "127.0.0.1")
                .expiresAt(Instant.now().plusMillis(refreshTokenExpirationMs))
                .build();

        Session savedSession = sessionRepository.save(session);

        RefreshToken refreshToken = RefreshToken.builder()
                .session(savedSession)
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(Instant.now().plusMillis(refreshTokenExpirationMs))
                .build();

        refreshTokenRepository.save(refreshToken);

        return new AuthResponse(
                accessToken,
                rawRefreshToken,
                "Bearer",
                accessTokenExpirationMs,
                UserMapper.toUserResponse(user)
        );
    }

    @Transactional
    public AuthResponse refreshToken(String rawRefreshToken) {
        String tokenHash = hashToken(rawRefreshToken);

        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));

        if (refreshToken.isExpiredOrRevoked()) {
            throw new IllegalArgumentException("Refresh token has expired or been revoked");
        }

        Session session = refreshToken.getSession();
        if (session.isExpiredOrRevoked()) {
            throw new IllegalArgumentException("Session has been revoked");
        }

        User user = refreshToken.getUser();
        UserPrincipal principal = UserPrincipal.create(user);
        Authentication authentication = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

        String newAccessToken = tokenProvider.generateAccessToken(authentication);
        String newRawRefreshToken = UUID.randomUUID().toString();
        String newTokenHash = hashToken(newRawRefreshToken);

        refreshToken.setRevokedAt(Instant.now());
        refreshTokenRepository.save(refreshToken);

        RefreshToken newRefreshToken = RefreshToken.builder()
                .session(session)
                .user(user)
                .tokenHash(newTokenHash)
                .expiresAt(Instant.now().plusMillis(refreshTokenExpirationMs))
                .build();

        refreshTokenRepository.save(newRefreshToken);

        session.setLastAccessedAt(Instant.now());
        session.setTokenHash(newTokenHash);
        sessionRepository.save(session);

        return new AuthResponse(
                newAccessToken,
                newRawRefreshToken,
                "Bearer",
                accessTokenExpirationMs,
                UserMapper.toUserResponse(user)
        );
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        String tokenHash = hashToken(rawRefreshToken);
        refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
            token.setRevokedAt(Instant.now());
            refreshTokenRepository.save(token);

            Session session = token.getSession();
            session.setRevokedAt(Instant.now());
            sessionRepository.save(session);
        });
    }

    @Transactional(readOnly = true)
    public List<Session> getUserActiveSessions(Long userId) {
        return sessionRepository.findActiveSessionsByUserId(userId);
    }

    @Transactional
    public void revokeSession(Long userId, UUID sessionId) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        if (!session.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized to revoke this session");
        }

        session.setRevokedAt(Instant.now());
        sessionRepository.save(session);
    }

    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.getEmail().equalsIgnoreCase(request.email()) && userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email is already taken by another user");
        }

        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setEmail(request.email());

        if (request.newPassword() != null && !request.newPassword().isBlank()) {
            if (request.newPassword().length() < 6) {
                throw new IllegalArgumentException("New password must be at least 6 characters");
            }
            user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        }

        User updatedUser = userRepository.save(user);
        return UserMapper.toUserResponse(updatedUser);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getUsers(String role) {
        if (role == null || role.isBlank()) {
            return userRepository.findAll().stream()
                    .map(UserMapper::toUserResponse)
                    .toList();
        }
        List<String> rolesList = java.util.Arrays.stream(role.split(","))
                .map(String::trim)
                .map(String::toUpperCase)
                .filter(s -> !s.isBlank())
                .toList();
        return userRepository.findByRoleCodesIn(rolesList).stream()
                .map(UserMapper::toUserResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return getUsers(null);
    }

    @Transactional
    public UserResponse editUser(Long id, EditUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));

        if (!user.getEmail().equalsIgnoreCase(request.email()) && userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email is already registered by another user");
        }

        user.setEmail(request.email());
        if (request.firstName() != null && !request.firstName().isBlank()) {
            user.setFirstName(request.firstName());
        }
        if (request.lastName() != null && !request.lastName().isBlank()) {
            user.setLastName(request.lastName());
        }
        if (request.status() != null && !request.status().isBlank()) {
            user.setStatus(request.status());
        }

        if (request.roleCodes() != null && !request.roleCodes().isEmpty()) {
            java.util.Set<Role> assignedRoles = new java.util.HashSet<>();
            for (String code : request.roleCodes()) {
                if (code != null && !code.isBlank()) {
                    String cleanCode = code.replace("ROLE_", "");
                    roleRepository.findByCode(cleanCode).ifPresent(assignedRoles::add);
                    roleRepository.findByCode("ROLE_" + cleanCode).ifPresent(assignedRoles::add);
                    roleRepository.findByCode(code).ifPresent(assignedRoles::add);
                }
            }
            if (!assignedRoles.isEmpty()) {
                user.setRoles(assignedRoles);
            }
        }

        User savedUser = userRepository.save(user);
        return UserMapper.toUserResponse(savedUser);
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes());
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }
}
