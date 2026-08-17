package com.projectpulse.pm.modules.task.controller;

import com.projectpulse.pm.common.api.ApiResponse;
import com.projectpulse.pm.modules.task.dto.TaskDTOs.*;
import com.projectpulse.pm.modules.task.entity.Subtask;
import com.projectpulse.pm.modules.task.service.SubtaskService;
import com.projectpulse.pm.modules.task.service.TaskService;
import com.projectpulse.pm.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class SubtaskController {

    private final SubtaskService subtaskService;
    private final TaskService taskService;
    private final com.projectpulse.pm.security.ProjectSecurityEvaluator projectSecurityEvaluator;

    @GetMapping("/tasks/{taskId}/subtasks")
    public ResponseEntity<ApiResponse<List<SubtaskResponse>>> getSubtasks(@PathVariable("taskId") Long taskId,
                                                                          @AuthenticationPrincipal UserPrincipal currentUser) {
        Long projectId = taskService.getProjectIdForTask(taskId);
        projectSecurityEvaluator.verifyProjectAccess(currentUser, projectId);
        return ResponseEntity.ok(ApiResponse.success(subtaskService.getSubtasksByTaskId(taskId)));
    }

    @PostMapping("/tasks/{taskId}/subtasks")
    @PreAuthorize("hasAnyRole('PROJECT_LEAD', 'ROLE_PROJECT_LEAD', 'PROJECT_MANAGER', 'ROLE_PROJECT_MANAGER', 'ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<SubtaskResponse>> createSubtask(@PathVariable("taskId") Long taskId,
                                                                       @Valid @RequestBody SubtaskCreateRequest request,
                                                                       @AuthenticationPrincipal UserPrincipal currentUser) {
        Long projectId = taskService.getProjectIdForTask(taskId);
        projectSecurityEvaluator.verifyProjectAccess(currentUser, projectId);
        return ResponseEntity.ok(ApiResponse.success("Subtask created successfully", subtaskService.createSubtask(taskId, request, currentUser)));
    }

    @PatchMapping("/subtasks/{id}/toggle")
    public ResponseEntity<ApiResponse<TaskResponse>> toggleSubtaskCompletion(@PathVariable("id") Long id,
                                                                              @AuthenticationPrincipal UserPrincipal currentUser) {
        Subtask subtask = subtaskService.getSubtaskEntity(id);
        Long projectId = subtask.getTask().getProject().getId();
        projectSecurityEvaluator.verifyProjectAccess(currentUser, projectId);
        TaskResponse updatedParentTask = subtaskService.toggleSubtaskCompletion(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Subtask toggled successfully", updatedParentTask));
    }

    @DeleteMapping("/subtasks/{id}")
    @PreAuthorize("hasAnyRole('PROJECT_LEAD', 'ROLE_PROJECT_LEAD', 'PROJECT_MANAGER', 'ROLE_PROJECT_MANAGER', 'ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<TaskResponse>> deleteSubtask(@PathVariable("id") Long id,
                                                                   @AuthenticationPrincipal UserPrincipal currentUser) {
        Subtask subtask = subtaskService.getSubtaskEntity(id);
        Long projectId = subtask.getTask().getProject().getId();
        projectSecurityEvaluator.verifyProjectAccess(currentUser, projectId);
        TaskResponse updatedParentTask = subtaskService.deleteSubtask(id);
        return ResponseEntity.ok(ApiResponse.success("Subtask deleted successfully", updatedParentTask));
    }

    @PostMapping("/subtasks/{id}/attachment")
    @PreAuthorize("hasAnyRole('PROJECT_LEAD', 'ROLE_PROJECT_LEAD', 'PROJECT_MANAGER', 'ROLE_PROJECT_MANAGER', 'ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<SubtaskResponse>> uploadSubtaskAttachment(@PathVariable("id") Long id,
                                                                                @RequestParam("file") MultipartFile file,
                                                                                @AuthenticationPrincipal UserPrincipal currentUser) {
        Subtask subtask = subtaskService.getSubtaskEntity(id);
        Long projectId = subtask.getTask().getProject().getId();
        projectSecurityEvaluator.verifyProjectAccess(currentUser, projectId);
        SubtaskResponse response = subtaskService.uploadSubtaskAttachment(id, file);
        return ResponseEntity.ok(ApiResponse.success("Subtask attachment uploaded successfully", response));
    }

    @GetMapping("/subtasks/{id}/attachment")
    public ResponseEntity<Resource> getSubtaskAttachment(@PathVariable("id") Long id,
                                                         @AuthenticationPrincipal UserPrincipal currentUser) {
        Subtask subtask = subtaskService.getSubtaskEntity(id);
        Long projectId = subtask.getTask().getProject().getId();
        projectSecurityEvaluator.verifyProjectAccess(currentUser, projectId);
        Resource resource = subtaskService.getSubtaskAttachmentResource(id);

        String contentType = subtask.getAttachmentType() != null ? subtask.getAttachmentType() : "application/octet-stream";
        String filename = subtask.getAttachmentName() != null ? subtask.getAttachmentName() : "attachment";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .body(resource);
    }

    @DeleteMapping("/subtasks/{id}/attachment")
    @PreAuthorize("hasAnyRole('PROJECT_LEAD', 'ROLE_PROJECT_LEAD', 'PROJECT_MANAGER', 'ROLE_PROJECT_MANAGER', 'ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<SubtaskResponse>> deleteSubtaskAttachment(@PathVariable("id") Long id,
                                                                                @AuthenticationPrincipal UserPrincipal currentUser) {
        Subtask subtask = subtaskService.getSubtaskEntity(id);
        Long projectId = subtask.getTask().getProject().getId();
        projectSecurityEvaluator.verifyProjectAccess(currentUser, projectId);
        SubtaskResponse response = subtaskService.deleteSubtaskAttachment(id);
        return ResponseEntity.ok(ApiResponse.success("Subtask attachment deleted successfully", response));
    }
}
