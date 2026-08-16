package com.projectpulse.pm.modules.task.controller;

import com.projectpulse.pm.common.api.ApiResponse;
import com.projectpulse.pm.common.exception.ResourceNotFoundException;
import com.projectpulse.pm.modules.task.dto.TaskDTOs.*;
import com.projectpulse.pm.modules.task.entity.Task;
import com.projectpulse.pm.modules.task.service.TaskService;
import com.projectpulse.pm.security.UserPrincipal;
import com.projectpulse.pm.security.annotation.RequireProjectAccess;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;
    private final com.projectpulse.pm.security.ProjectSecurityEvaluator projectSecurityEvaluator;

    @GetMapping("/tasks")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getAllTasks(@AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getAllTasksForUser(currentUser)));
    }

    @GetMapping("/projects/{projectId}/tasks")
    @RequireProjectAccess(paramName = "projectId")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getProjectTasks(@PathVariable("projectId") Long projectId) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getTasksByProjectId(projectId)));
    }

    @GetMapping("/projects/{projectId}/tasks/search")
    @RequireProjectAccess(paramName = "projectId")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> searchTasks(@PathVariable("projectId") Long projectId,
                                                                       @RequestParam(value = "search", required = false) String search,
                                                                       @RequestParam(value = "priorityId", required = false) Long priorityId,
                                                                       @RequestParam(value = "statusId", required = false) Long statusId,
                                                                       @RequestParam(value = "assigneeId", required = false) Long assigneeId,
                                                                       @RequestParam(value = "labelId", required = false) Long labelId) {
        return ResponseEntity.ok(ApiResponse.success(taskService.searchTasks(projectId, search, priorityId, statusId, assigneeId, labelId)));
    }

    @PostMapping("/projects/{projectId}/tasks")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'ROLE_PROJECT_MANAGER')")
    @RequireProjectAccess(paramName = "projectId")
    public ResponseEntity<ApiResponse<TaskResponse>> createTask(@PathVariable("projectId") Long projectId,
                                                                 @Valid @RequestBody TaskCreateRequest request,
                                                                 @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success("Task created successfully", taskService.createTask(projectId, request, currentUser)));
    }

    @GetMapping("/tasks/{id}")
    public ResponseEntity<ApiResponse<TaskResponse>> getTaskById(@PathVariable("id") Long id,
                                                                 @AuthenticationPrincipal UserPrincipal currentUser) {
        Long projectId = taskService.getProjectIdForTask(id);
        verifyProjectAccess(currentUser, projectId);
        return ResponseEntity.ok(ApiResponse.success(taskService.getTaskById(id)));
    }

    @PatchMapping("/tasks/{id}")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'ROLE_PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTask(@PathVariable("id") Long id,
                                                                 @Valid @RequestBody TaskUpdateRequest request,
                                                                 @AuthenticationPrincipal UserPrincipal currentUser) {
        Long projectId = taskService.getProjectIdForTask(id);
        verifyProjectAccess(currentUser, projectId);
        return ResponseEntity.ok(ApiResponse.success("Task updated successfully", taskService.updateTask(id, request)));
    }

    @PatchMapping("/tasks/{id}/status")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTaskStatus(@PathVariable("id") Long id,
                                                                       @Valid @RequestBody TaskStatusUpdateRequest request,
                                                                       @AuthenticationPrincipal UserPrincipal currentUser) {
        Long projectId = taskService.getProjectIdForTask(id);
        verifyProjectAccess(currentUser, projectId);
        return ResponseEntity.ok(ApiResponse.success("Task status updated", taskService.patchTaskStatus(id, request.statusId(), request.delayReason(), currentUser)));
    }

    @PatchMapping("/tasks/{id}/assignee")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'ROLE_PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTaskAssignee(@PathVariable("id") Long id,
                                                                         @RequestBody TaskAssigneeUpdateRequest request,
                                                                         @AuthenticationPrincipal UserPrincipal currentUser) {
        Long projectId = taskService.getProjectIdForTask(id);
        verifyProjectAccess(currentUser, projectId);
        return ResponseEntity.ok(ApiResponse.success("Task assignee updated", taskService.patchTaskAssignee(id, request.assigneeId())));
    }

    @DeleteMapping("/tasks/{id}")
    @PreAuthorize("hasAnyRole('PROJECT_MANAGER', 'ROLE_PROJECT_MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteTask(@PathVariable("id") Long id,
                                                         @AuthenticationPrincipal UserPrincipal currentUser) {
        Long projectId = taskService.getProjectIdForTask(id);
        verifyProjectAccess(currentUser, projectId);
        taskService.deleteTask(id);
        return ResponseEntity.ok(ApiResponse.success("Task deleted successfully", null));
    }

    @PostMapping("/tasks/{id}/attachment")
    public ResponseEntity<ApiResponse<TaskResponse>> uploadTaskAttachment(@PathVariable("id") Long id,
                                                                          @RequestParam("file") MultipartFile file,
                                                                          @AuthenticationPrincipal UserPrincipal currentUser) {
        Long projectId = taskService.getProjectIdForTask(id);
        verifyProjectAccess(currentUser, projectId);
        TaskResponse response = taskService.uploadTaskAttachment(id, file);
        return ResponseEntity.ok(ApiResponse.success("Attachment uploaded successfully", response));
    }

    @GetMapping("/tasks/{id}/attachment")
    public ResponseEntity<Resource> getTaskAttachment(@PathVariable("id") Long id,
                                                       @AuthenticationPrincipal UserPrincipal currentUser) {
        Long projectId = taskService.getProjectIdForTask(id);
        verifyProjectAccess(currentUser, projectId);
        Task task = taskService.getTaskEntity(id);
        Resource resource = taskService.getTaskAttachmentResource(id);

        String contentType = task.getAttachmentType() != null ? task.getAttachmentType() : "application/octet-stream";
        String filename = task.getAttachmentName() != null ? task.getAttachmentName() : "attachment";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .body(resource);
    }

    @DeleteMapping("/tasks/{id}/attachment")
    public ResponseEntity<ApiResponse<TaskResponse>> deleteTaskAttachment(@PathVariable("id") Long id,
                                                                           @AuthenticationPrincipal UserPrincipal currentUser) {
        Long projectId = taskService.getProjectIdForTask(id);
        verifyProjectAccess(currentUser, projectId);
        TaskResponse response = taskService.deleteTaskAttachment(id);
        return ResponseEntity.ok(ApiResponse.success("Attachment deleted successfully", response));
    }

    private void verifyProjectAccess(UserPrincipal currentUser, Long projectId) {
        if (projectId == null) {
            throw new ResourceNotFoundException("Task not found");
        }
        boolean isAuthorized = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") ||
                               a.getAuthority().equals("ROLE_PROJECT_MANAGER") ||
                               a.getAuthority().equals("ROLE_DEVELOPER"));
        if (!isAuthorized && !projectSecurityEvaluator.isMember(currentUser.getId(), projectId)) {
            throw new AccessDeniedException("Forbidden: You are not an active member of Project " + projectId);
        }
    }
}
