package com.enterprise.pm.modules.project.controller;

import com.enterprise.pm.common.api.ApiResponse;
import com.enterprise.pm.modules.project.dto.ProjectDTOs.*;
import com.enterprise.pm.modules.project.service.ProjectService;
import com.enterprise.pm.security.UserPrincipal;
import com.enterprise.pm.security.annotation.RequireProjectAccess;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> getUserProjects(@AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getUserProjects(currentUser)));
    }

    @GetMapping("/{id}")
    @RequireProjectAccess(paramName = "id")
    public ResponseEntity<ApiResponse<ProjectResponse>> getProjectById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getProjectById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<ProjectResponse>> createProject(@Valid @RequestBody ProjectCreateRequest request,
                                                                       @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success("Project created successfully", projectService.createProject(request, currentUser)));
    }

    @GetMapping("/{id}/members")
    @RequireProjectAccess(paramName = "id")
    public ResponseEntity<ApiResponse<List<ProjectMemberResponse>>> getProjectMembers(@PathVariable("id") Long id) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getProjectMembers(id)));
    }

    @PostMapping("/{id}/members")
    @RequireProjectAccess(paramName = "id")
    public ResponseEntity<ApiResponse<ProjectMemberResponse>> addProjectMember(@PathVariable("id") Long id,
                                                                                @Valid @RequestBody AddMemberRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Project member added successfully", projectService.addProjectMember(id, request)));
    }

    @DeleteMapping("/{id}/members/{userId}")
    @RequireProjectAccess(paramName = "id")
    public ResponseEntity<ApiResponse<Void>> removeProjectMember(@PathVariable("id") Long id,
                                                                 @PathVariable("userId") Long userId) {
        projectService.removeProjectMember(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Project member removed successfully", null));
    }
}
