package com.enterprise.pm.modules.task.mapper;

import com.enterprise.pm.modules.auth.mapper.UserMapper;
import com.enterprise.pm.modules.metadata.dto.MetadataDTOs.LabelResponse;
import com.enterprise.pm.modules.metadata.dto.MetadataDTOs.PriorityResponse;
import com.enterprise.pm.modules.metadata.dto.MetadataDTOs.TaskStatusResponse;
import com.enterprise.pm.modules.metadata.entity.Label;
import com.enterprise.pm.modules.metadata.entity.Priority;
import com.enterprise.pm.modules.metadata.entity.TaskStatus;
import com.enterprise.pm.modules.task.dto.TaskDTOs.SubtaskResponse;
import com.enterprise.pm.modules.task.dto.TaskDTOs.TaskResponse;
import com.enterprise.pm.modules.task.entity.Subtask;
import com.enterprise.pm.modules.task.entity.Task;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class TaskMapper {

    public static TaskResponse toTaskResponse(Task task) {
        if (task == null) return null;

        List<SubtaskResponse> subtaskResponses = task.getSubtasks() != null
            ? task.getSubtasks().stream().map(TaskMapper::toSubtaskResponse).toList()
            : Collections.emptyList();

        Set<LabelResponse> labelResponses = task.getLabels() != null
            ? task.getLabels().stream().map(TaskMapper::toLabelResponse).collect(Collectors.toSet())
            : Collections.emptySet();

        int totalSubtasks = subtaskResponses.size();
        int completedSubtasks = (int) subtaskResponses.stream().filter(SubtaskResponse::completed).count();
        int progress = totalSubtasks == 0 ? 0 : (completedSubtasks * 100) / totalSubtasks;

        return new TaskResponse(
            task.getId(),
            task.getProject().getId(),
            task.getTitle(),
            task.getDescription(),
            toTaskStatusResponse(task.getStatus()),
            toPriorityResponse(task.getPriority()),
            UserMapper.toUserResponse(task.getAssignee()),
            UserMapper.toUserResponse(task.getCreatedBy()),
            task.getStartDate(),
            task.getEndDate(),
            task.getDueDate(),
            task.getEstimatedHours() != null ? task.getEstimatedHours() : 8,
            task.getLoggedHours() != null ? task.getLoggedHours() : 0,
            task.getEscalationLevel() != null ? task.getEscalationLevel() : "NONE",
            task.getAttachmentPath(),
            task.getAttachmentName(),
            task.getAttachmentType(),
            subtaskResponses,
            labelResponses,
            totalSubtasks,
            completedSubtasks,
            progress,
            task.getCreatedAt(),
            task.getUpdatedAt(),
            task.getVersion()
        );
    }

    public static SubtaskResponse toSubtaskResponse(Subtask subtask) {
        if (subtask == null) return null;
        return new SubtaskResponse(
            subtask.getId(),
            subtask.getTask().getId(),
            subtask.getTitle(),
            subtask.isCompleted(),
            subtask.getAttachmentPath(),
            subtask.getAttachmentName(),
            subtask.getAttachmentType(),
            subtask.getCreatedAt(),
            subtask.getUpdatedAt()
        );
    }

    public static TaskStatusResponse toTaskStatusResponse(TaskStatus status) {
        if (status == null) return null;
        return new TaskStatusResponse(
            status.getId(),
            status.getProject() != null ? status.getProject().getId() : null,
            status.getName(),
            status.getCode(),
            status.getDisplayOrder(),
            status.getColor(),
            status.getCapacityLimit(),
            status.isActive()
        );
    }

    public static PriorityResponse toPriorityResponse(Priority priority) {
        if (priority == null) return null;
        return new PriorityResponse(
            priority.getId(),
            priority.getName(),
            priority.getCode(),
            priority.getLevel(),
            priority.getColor(),
            priority.isActive()
        );
    }

    public static LabelResponse toLabelResponse(Label label) {
        if (label == null) return null;
        return new LabelResponse(
            label.getId(),
            label.getProject() != null ? label.getProject().getId() : null,
            label.getName(),
            label.getCode(),
            label.getColor(),
            label.isActive()
        );
    }
}
