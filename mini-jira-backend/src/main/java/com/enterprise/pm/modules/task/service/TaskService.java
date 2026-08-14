package com.enterprise.pm.modules.task.service;

import com.enterprise.pm.common.exception.ResourceNotFoundException;
import com.enterprise.pm.common.storage.FileStorageService;
import com.enterprise.pm.common.storage.FileStorageService.FileStorageResult;
import com.enterprise.pm.modules.auth.entity.User;
import com.enterprise.pm.modules.auth.repository.UserRepository;
import com.enterprise.pm.modules.metadata.entity.Label;
import com.enterprise.pm.modules.metadata.entity.Priority;
import com.enterprise.pm.modules.metadata.entity.TaskStatus;
import com.enterprise.pm.modules.metadata.repository.LabelRepository;
import com.enterprise.pm.modules.metadata.repository.PriorityRepository;
import com.enterprise.pm.modules.metadata.repository.TaskStatusRepository;
import com.enterprise.pm.modules.project.entity.Project;
import com.enterprise.pm.modules.project.repository.ProjectMemberRepository;
import com.enterprise.pm.modules.project.repository.ProjectRepository;
import com.enterprise.pm.modules.task.dto.TaskDTOs.*;
import com.enterprise.pm.modules.task.entity.Task;
import com.enterprise.pm.modules.task.mapper.TaskMapper;
import com.enterprise.pm.modules.task.repository.TaskRepository;
import com.enterprise.pm.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final TaskStatusRepository taskStatusRepository;
    private final PriorityRepository priorityRepository;
    private final LabelRepository labelRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByProjectId(Long projectId) {
        return taskRepository.findAllByProjectIdWithDetails(projectId).stream()
                .map(TaskMapper::toTaskResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> searchTasks(Long projectId, String search, Long priorityId, Long statusId, Long assigneeId, Long labelId) {
        org.springframework.data.jpa.domain.Specification<Task> spec = 
                com.enterprise.pm.modules.task.specification.TaskSpecification.filterTasks(projectId, search, priorityId, statusId, assigneeId, labelId);
        return taskRepository.findAll(spec).stream()
                .map(TaskMapper::toTaskResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TaskResponse getTaskById(Long taskId) {
        Task task = taskRepository.findWithDetailsById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));
        return TaskMapper.toTaskResponse(task);
    }

    @Transactional
    public TaskResponse createTask(Long projectId, TaskCreateRequest request, UserPrincipal currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + projectId));

        TaskStatus status = taskStatusRepository.findById(request.statusId())
                .orElseThrow(() -> new ResourceNotFoundException("Task status not found"));

        Priority priority = priorityRepository.findById(request.priorityId())
                .orElseThrow(() -> new ResourceNotFoundException("Priority not found"));

        User creator = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        User assignee = null;
        if (request.assigneeId() != null) {
            // RULE 8 VERIFICATION: Validate assignee belongs to Project A
            boolean isAssigneeMember = projectMemberRepository.existsByProjectIdAndUserIdAndActiveTrue(projectId, request.assigneeId());
            if (!isAssigneeMember) {
                throw new IllegalArgumentException("Invalid Assignee: Selected user ID " + request.assigneeId() + " is not an active member of Project " + projectId);
            }
            assignee = userRepository.findById(request.assigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee user not found"));
        }

        Set<Label> labels = new HashSet<>();
        if (request.labelIds() != null && !request.labelIds().isEmpty()) {
            labels = new HashSet<>(labelRepository.findAllById(request.labelIds()));
        }

        Task task = Task.builder()
                .project(project)
                .title(request.title())
                .description(request.description())
                .status(status)
                .priority(priority)
                .assignee(assignee)
                .createdBy(creator)
                .startDate(request.startDate())
                .endDate(request.endDate())
                .dueDate(request.dueDate())
                .estimatedHours(request.estimatedHours() != null ? request.estimatedHours() : 8)
                .loggedHours(request.loggedHours() != null ? request.loggedHours() : 0)
                .escalationLevel("NONE")
                .labels(labels)
                .build();

        Task savedTask = taskRepository.save(task);
        return TaskMapper.toTaskResponse(savedTask);
    }

    @Transactional
    public TaskResponse updateTask(Long taskId, TaskUpdateRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));

        // Optimistic locking check
        if (request.version() != null && !request.version().equals(task.getVersion())) {
            throw new ObjectOptimisticLockingFailureException(Task.class, taskId);
        }

        if (request.title() != null) task.setTitle(request.title());
        if (request.description() != null) task.setDescription(request.description());

        if (request.statusId() != null) {
            TaskStatus status = taskStatusRepository.findById(request.statusId())
                    .orElseThrow(() -> new ResourceNotFoundException("Status not found"));
            task.setStatus(status);
        }

        if (request.priorityId() != null) {
            Priority priority = priorityRepository.findById(request.priorityId())
                    .orElseThrow(() -> new ResourceNotFoundException("Priority not found"));
            task.setPriority(priority);
        }

        if (request.assigneeId() != null) {
            boolean isAssigneeMember = projectMemberRepository.existsByProjectIdAndUserIdAndActiveTrue(task.getProject().getId(), request.assigneeId());
            if (!isAssigneeMember) {
                throw new IllegalArgumentException("Invalid Assignee: User is not an active member of this project");
            }
            User assignee = userRepository.findById(request.assigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee user not found"));
            task.setAssignee(assignee);
        }

        if (request.startDate() != null) task.setStartDate(request.startDate());
        if (request.endDate() != null) task.setEndDate(request.endDate());
        if (request.dueDate() != null) task.setDueDate(request.dueDate());
        if (request.estimatedHours() != null) task.setEstimatedHours(request.estimatedHours());
        if (request.loggedHours() != null) task.setLoggedHours(request.loggedHours());
        if (request.escalationLevel() != null) task.setEscalationLevel(request.escalationLevel());
        if (request.delayReason() != null) task.setDelayReason(request.delayReason());

        if (request.labelIds() != null) {
            Set<Label> labels = new HashSet<>(labelRepository.findAllById(request.labelIds()));
            task.setLabels(labels);
        }

        Task updatedTask = taskRepository.save(task);
        return TaskMapper.toTaskResponse(updatedTask);
    }

    @Transactional
    public TaskResponse patchTaskStatus(Long taskId, Long statusId, String delayReason) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));

        TaskStatus status = taskStatusRepository.findById(statusId)
                .orElseThrow(() -> new ResourceNotFoundException("Task status not found"));

        task.setStatus(status);
        if (delayReason != null && !delayReason.isBlank()) {
            task.setDelayReason(delayReason);
        }
        Task updatedTask = taskRepository.save(task);
        return TaskMapper.toTaskResponse(updatedTask);
    }

    @Transactional
    public TaskResponse patchTaskAssignee(Long taskId, Long assigneeId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));

        if (assigneeId != null) {
            boolean isMember = projectMemberRepository.existsByProjectIdAndUserIdAndActiveTrue(task.getProject().getId(), assigneeId);
            if (!isMember) {
                throw new IllegalArgumentException("Invalid Assignee: User is not a member of Project " + task.getProject().getId());
            }
            User assignee = userRepository.findById(assigneeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee user not found"));
            task.setAssignee(assignee);
        } else {
            task.setAssignee(null);
        }

        Task updatedTask = taskRepository.save(task);
        return TaskMapper.toTaskResponse(updatedTask);
    }

    @Transactional
    public void deleteTask(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));
        taskRepository.delete(task);
    }

    public Long getProjectIdForTask(Long taskId) {
        return taskRepository.findById(taskId)
                .map(t -> t.getProject().getId())
                .orElse(null);
    }

    @Transactional
    public TaskResponse uploadTaskAttachment(Long taskId, MultipartFile file) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));

        if (task.getAttachmentPath() != null) {
            fileStorageService.deleteFile(task.getAttachmentPath());
        }

        FileStorageResult result = fileStorageService.storeFile(file);
        task.setAttachmentPath(result.filePath());
        task.setAttachmentName(result.fileName());
        task.setAttachmentType(result.contentType());

        Task updatedTask = taskRepository.save(task);
        return TaskMapper.toTaskResponse(updatedTask);
    }

    @Transactional(readOnly = true)
    public Resource getTaskAttachmentResource(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));

        if (task.getAttachmentPath() == null || task.getAttachmentPath().isBlank()) {
            throw new ResourceNotFoundException("No attachment found for Task ID: " + taskId);
        }

        return fileStorageService.loadFileAsResource(task.getAttachmentPath());
    }

    @Transactional(readOnly = true)
    public Task getTaskEntity(Long taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));
    }

    @Transactional
    public TaskResponse deleteTaskAttachment(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));

        if (task.getAttachmentPath() != null) {
            fileStorageService.deleteFile(task.getAttachmentPath());
            task.setAttachmentPath(null);
            task.setAttachmentName(null);
            task.setAttachmentType(null);
            taskRepository.save(task);
        }

        return TaskMapper.toTaskResponse(task);
    }
}
