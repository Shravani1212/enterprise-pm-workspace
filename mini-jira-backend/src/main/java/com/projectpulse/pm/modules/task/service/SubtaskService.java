package com.projectpulse.pm.modules.task.service;

import com.projectpulse.pm.common.exception.ResourceNotFoundException;
import com.projectpulse.pm.common.storage.FileStorageService;
import com.projectpulse.pm.common.storage.FileStorageService.FileStorageResult;
import com.projectpulse.pm.modules.task.dto.TaskDTOs.*;
import com.projectpulse.pm.modules.task.entity.Subtask;
import com.projectpulse.pm.modules.task.entity.Task;
import com.projectpulse.pm.modules.task.mapper.TaskMapper;
import com.projectpulse.pm.modules.task.repository.SubtaskRepository;
import com.projectpulse.pm.modules.task.repository.TaskRepository;
import com.projectpulse.pm.security.UserPrincipal;
import com.projectpulse.pm.modules.project.repository.ProjectMemberRepository;
import com.projectpulse.pm.modules.auth.repository.UserRepository;
import com.projectpulse.pm.modules.auth.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SubtaskService {

    private final SubtaskRepository subtaskRepository;
    private final TaskRepository taskRepository;
    private final FileStorageService fileStorageService;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<SubtaskResponse> getSubtasksByTaskId(Long taskId) {
        return subtaskRepository.findByTaskId(taskId).stream()
                .map(TaskMapper::toSubtaskResponse)
                .toList();
    }

    @Transactional
    public SubtaskResponse createSubtask(Long taskId, SubtaskCreateRequest request, UserPrincipal currentUser) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));

        Long projectId = task.getProject().getId();

        // Verify that current user is an active member of this project (except Admin bypass)
        boolean isMember = projectMemberRepository.existsByProjectIdAndUserIdAndActiveTrue(projectId, currentUser.getId());
        boolean isAdmin = currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isMember && !isAdmin) {
            throw new org.springframework.security.access.AccessDeniedException("Forbidden: You are not a member of this project");
        }

        // Parse assignee developer from the title if present
        String assignedUsername = extractSubtaskUsername(request.title());
        if (assignedUsername != null) {
            User devUser = userRepository.findByUsername(assignedUsername)
                    .orElseThrow(() -> new IllegalArgumentException("Subtask assignee user not found: " + assignedUsername));

            boolean isDevMember = projectMemberRepository.existsByProjectIdAndUserIdAndActiveTrue(projectId, devUser.getId());
            if (!isDevMember) {
                throw new IllegalArgumentException("Invalid Subtask Assignee: User is not a member of Project " + projectId);
            }

            boolean isDev = devUser.getRoles().stream().anyMatch(r ->
                    r.getCode().equals("DEVELOPER") || r.getCode().equals("ROLE_DEVELOPER")
            );
            if (!isDev) {
                throw new IllegalArgumentException("Subtask must be assigned to Developer role only");
            }
        }

        Subtask subtask = Subtask.builder()
                .task(task)
                .title(request.title())
                .completed(false)
                .build();

        Subtask savedSubtask = subtaskRepository.save(subtask);
        return TaskMapper.toSubtaskResponse(savedSubtask);
    }

    @Transactional
    public TaskResponse toggleSubtaskCompletion(Long subtaskId, UserPrincipal currentUser) {
        Subtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new ResourceNotFoundException("Subtask not found with ID: " + subtaskId));

        // Enforce DEVELOPER assignment rule:
        boolean isDev = currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_DEVELOPER"));
        boolean isLead = currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_PROJECT_LEAD"));
        boolean isPm = currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_PROJECT_MANAGER"));
        boolean isAdmin = currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isDev && !isLead && !isPm && !isAdmin) {
            String assignedUsername = extractSubtaskUsername(subtask.getTitle());
            if (assignedUsername != null && !assignedUsername.equalsIgnoreCase(currentUser.getUsername())) {
                throw new org.springframework.security.access.AccessDeniedException("Forbidden: Developers can only toggle status of subtasks assigned to them");
            }
        }

        subtask.setCompleted(!subtask.isCompleted());
        subtaskRepository.save(subtask);

        Task parentTask = taskRepository.findWithDetailsById(subtask.getTask().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Parent task not found"));

        return TaskMapper.toTaskResponse(parentTask);
    }

    private String extractSubtaskUsername(String title) {
        if (title == null) return null;
        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("^\\[@([^\\]]+)\\]").matcher(title);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }

    @Transactional
    public TaskResponse deleteSubtask(Long subtaskId) {
        Subtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new ResourceNotFoundException("Subtask not found with ID: " + subtaskId));

        if (subtask.getAttachmentPath() != null) {
            fileStorageService.deleteFile(subtask.getAttachmentPath());
        }

        Long parentTaskId = subtask.getTask().getId();
        subtaskRepository.delete(subtask);

        Task parentTask = taskRepository.findWithDetailsById(parentTaskId)
                .orElseThrow(() -> new ResourceNotFoundException("Parent task not found"));

        return TaskMapper.toTaskResponse(parentTask);
    }

    @Transactional
    public SubtaskResponse uploadSubtaskAttachment(Long subtaskId, MultipartFile file) {
        Subtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new ResourceNotFoundException("Subtask not found with ID: " + subtaskId));

        if (subtask.getAttachmentPath() != null) {
            fileStorageService.deleteFile(subtask.getAttachmentPath());
        }

        FileStorageResult result = fileStorageService.storeFile(file);
        subtask.setAttachmentPath(result.filePath());
        subtask.setAttachmentName(result.fileName());
        subtask.setAttachmentType(result.contentType());

        Subtask updatedSubtask = subtaskRepository.save(subtask);
        return TaskMapper.toSubtaskResponse(updatedSubtask);
    }

    @Transactional(readOnly = true)
    public Resource getSubtaskAttachmentResource(Long subtaskId) {
        Subtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new ResourceNotFoundException("Subtask not found with ID: " + subtaskId));

        if (subtask.getAttachmentPath() == null || subtask.getAttachmentPath().isBlank()) {
            throw new ResourceNotFoundException("No attachment found for Subtask ID: " + subtaskId);
        }

        return fileStorageService.loadFileAsResource(subtask.getAttachmentPath());
    }

    @Transactional(readOnly = true)
    public Subtask getSubtaskEntity(Long subtaskId) {
        return subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new ResourceNotFoundException("Subtask not found with ID: " + subtaskId));
    }

    @Transactional
    public SubtaskResponse deleteSubtaskAttachment(Long subtaskId) {
        Subtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new ResourceNotFoundException("Subtask not found with ID: " + subtaskId));

        if (subtask.getAttachmentPath() != null) {
            fileStorageService.deleteFile(subtask.getAttachmentPath());
            subtask.setAttachmentPath(null);
            subtask.setAttachmentName(null);
            subtask.setAttachmentType(null);
            subtaskRepository.save(subtask);
        }

        return TaskMapper.toSubtaskResponse(subtask);
    }
}
