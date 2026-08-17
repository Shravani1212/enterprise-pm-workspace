package com.projectpulse.pm.security;

import com.projectpulse.pm.modules.project.repository.ProjectMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class ProjectSecurityEvaluator {

    private final ProjectMemberRepository projectMemberRepository;

    @Cacheable(value = "project_memberships", key = "#userId + '_' + #projectId")
    @Transactional(readOnly = true)
    public boolean isMember(Long userId, Long projectId) {
        if (userId == null || projectId == null) {
            return false;
        }
        return projectMemberRepository.existsByProjectIdAndUserIdAndActiveTrue(projectId, userId);
    }

    public void verifyProjectAccess(com.projectpulse.pm.security.UserPrincipal currentUser, Long projectId) {
        if (projectId == null) {
            throw new com.projectpulse.pm.common.exception.ResourceNotFoundException("Project reference not found");
        }
        boolean isAuthorized = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") ||
                               a.getAuthority().equals("ROLE_PROJECT_MANAGER") ||
                               a.getAuthority().equals("ROLE_DEVELOPER"));
        if (!isAuthorized && !isMember(currentUser.getId(), projectId)) {
            throw new org.springframework.security.access.AccessDeniedException("Forbidden: You are not an active member of Project " + projectId);
        }
    }
}
