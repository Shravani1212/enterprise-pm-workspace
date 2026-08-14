package com.enterprise.pm.modules.task.dto;

import com.enterprise.pm.modules.auth.dto.AuthDTOs.UserResponse;
import com.enterprise.pm.modules.metadata.dto.MetadataDTOs.LabelResponse;
import com.enterprise.pm.modules.metadata.dto.MetadataDTOs.PriorityResponse;
import com.enterprise.pm.modules.metadata.dto.MetadataDTOs.TaskStatusResponse;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.List;
import java.util.Set;

public class TaskDTOs {

    public record TaskCreateRequest(
        @NotBlank(message = "Task title is required")
        String title,
        String description,
        @NotNull(message = "Status ID is required")
        Long statusId,
        @NotNull(message = "Priority ID is required")
        Long priorityId,
        Long assigneeId,
        Instant startDate,
        Instant endDate,
        Instant dueDate,
        Integer estimatedHours,
        Integer loggedHours,
        Set<Long> labelIds
    ) {}

    public record TaskUpdateRequest(
        String title,
        String description,
        Long statusId,
        Long priorityId,
        Long assigneeId,
        Instant startDate,
        Instant endDate,
        Instant dueDate,
        Integer estimatedHours,
        Integer loggedHours,
        String escalationLevel,
        String delayReason,
        Set<Long> labelIds,
        Long version
    ) {}

    public record TaskStatusUpdateRequest(
        @NotNull(message = "Status ID is required")
        Long statusId,
        String delayReason
    ) {}

    public record TaskAssigneeUpdateRequest(
        Long assigneeId
    ) {}

    public record SubtaskCreateRequest(
        @NotBlank(message = "Subtask title is required")
        String title
    ) {}

    public record SubtaskResponse(
        Long id,
        Long taskId,
        String title,
        boolean completed,
        String attachmentPath,
        String attachmentName,
        String attachmentType,
        Instant createdAt,
        Instant updatedAt
    ) {}

    public record TaskResponse(
        Long id,
        Long projectId,
        String title,
        String description,
        TaskStatusResponse status,
        PriorityResponse priority,
        UserResponse assignee,
        UserResponse createdBy,
        Instant startDate,
        Instant endDate,
        Instant dueDate,
        Integer estimatedHours,
        Integer loggedHours,
        String escalationLevel,
        String delayReason,
        String attachmentPath,
        String attachmentName,
        String attachmentType,
        List<SubtaskResponse> subtasks,
        Set<LabelResponse> labels,
        int subtaskCount,
        int completedSubtaskCount,
        int progressPercentage,
        Instant createdAt,
        Instant updatedAt,
        Long version
    ) {}
}
