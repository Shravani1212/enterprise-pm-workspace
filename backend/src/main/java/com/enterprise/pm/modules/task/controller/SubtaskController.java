package com.enterprise.pm.modules.task.controller;

import com.enterprise.pm.common.api.ApiResponse;
import com.enterprise.pm.modules.task.dto.TaskDTOs.*;
import com.enterprise.pm.modules.task.service.SubtaskService;
import com.enterprise.pm.modules.task.service.TaskService;
import com.enterprise.pm.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class SubtaskController {

    private final SubtaskService subtaskService;
    private final TaskService taskService;

    @GetMapping("/tasks/{taskId}/subtasks")
    public ResponseEntity<ApiResponse<List<SubtaskResponse>>> getSubtasks(@PathVariable("taskId") Long taskId) {
        return ResponseEntity.ok(ApiResponse.success(subtaskService.getSubtasksByTaskId(taskId)));
    }

    @PostMapping("/tasks/{taskId}/subtasks")
    public ResponseEntity<ApiResponse<SubtaskResponse>> createSubtask(@PathVariable("taskId") Long taskId,
                                                                       @Valid @RequestBody SubtaskCreateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Subtask created successfully", subtaskService.createSubtask(taskId, request)));
    }

    @PatchMapping("/subtasks/{id}/toggle")
    public ResponseEntity<ApiResponse<TaskResponse>> toggleSubtaskCompletion(@PathVariable("id") Long id) {
        TaskResponse updatedParentTask = subtaskService.toggleSubtaskCompletion(id);
        return ResponseEntity.ok(ApiResponse.success("Subtask toggled successfully", updatedParentTask));
    }

    @DeleteMapping("/subtasks/{id}")
    public ResponseEntity<ApiResponse<TaskResponse>> deleteSubtask(@PathVariable("id") Long id) {
        TaskResponse updatedParentTask = subtaskService.deleteSubtask(id);
        return ResponseEntity.ok(ApiResponse.success("Subtask deleted successfully", updatedParentTask));
    }
}
