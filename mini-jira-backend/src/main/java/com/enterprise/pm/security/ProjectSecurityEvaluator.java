package com.enterprise.pm.security;

import com.enterprise.pm.modules.project.repository.ProjectMemberRepository;
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
}
