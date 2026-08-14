package com.enterprise.pm.security.aspect;

import com.enterprise.pm.security.ProjectSecurityEvaluator;
import com.enterprise.pm.security.UserPrincipal;
import com.enterprise.pm.security.annotation.RequireProjectAccess;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;

@Aspect
@Component
public class ProjectSecurityAspect {

    private final ProjectSecurityEvaluator projectSecurityEvaluator;

    public ProjectSecurityAspect(ProjectSecurityEvaluator projectSecurityEvaluator) {
        this.projectSecurityEvaluator = projectSecurityEvaluator;
    }

    @Before("@annotation(requireProjectAccess)")
    public void validateProjectAccess(JoinPoint joinPoint, RequireProjectAccess requireProjectAccess) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new AccessDeniedException("User is not authenticated");
        }

        // Workspace role bypass (ADMIN, PROJECT_MANAGER, DEVELOPER have active workspace access)
        boolean isAuthorizedRole = principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") ||
                               a.getAuthority().equals("ROLE_PROJECT_MANAGER") ||
                               a.getAuthority().equals("ROLE_DEVELOPER"));
        if (isAuthorizedRole) {
            return;
        }

        Long projectId = extractProjectId(joinPoint, requireProjectAccess.paramName());

        if (projectId == null) {
            throw new IllegalArgumentException("Unable to resolve project ID for access authorization check");
        }

        boolean isMember = projectSecurityEvaluator.isMember(principal.getId(), projectId);

        if (!isMember) {
            throw new AccessDeniedException("Forbidden: You are not an active member of Project " + projectId);
        }
    }

    private Long extractProjectId(JoinPoint joinPoint, String targetParamName) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        String[] parameterNames = signature.getParameterNames();
        Object[] args = joinPoint.getArgs();

        if (parameterNames != null) {
            for (int i = 0; i < parameterNames.length; i++) {
                if (parameterNames[i].equalsIgnoreCase(targetParamName) ||
                    parameterNames[i].equalsIgnoreCase("projectId") ||
                    parameterNames[i].equalsIgnoreCase("id")) {
                    if (args[i] instanceof Long longVal) {
                        return longVal;
                    }
                }
            }
        }

        return null;
    }
}
