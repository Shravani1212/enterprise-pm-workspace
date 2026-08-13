package com.enterprise.pm.modules.task.service;

import com.enterprise.pm.common.exception.ResourceNotFoundException;
import com.enterprise.pm.common.storage.FileStorageService;
import com.enterprise.pm.common.storage.FileStorageService.FileStorageResult;
import com.enterprise.pm.modules.task.dto.TaskDTOs.*;
import com.enterprise.pm.modules.task.entity.Subtask;
import com.enterprise.pm.modules.task.entity.Task;
import com.enterprise.pm.modules.task.mapper.TaskMapper;
import com.enterprise.pm.modules.task.repository.SubtaskRepository;
import com.enterprise.pm.modules.task.repository.TaskRepository;
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

    @Transactional(readOnly = true)
    public List<SubtaskResponse> getSubtasksByTaskId(Long taskId) {
        return subtaskRepository.findByTaskId(taskId).stream()
                .map(TaskMapper::toSubtaskResponse)
                .toList();
    }

    @Transactional
    public SubtaskResponse createSubtask(Long taskId, SubtaskCreateRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));

        Subtask subtask = Subtask.builder()
                .task(task)
                .title(request.title())
                .completed(false)
                .build();

        Subtask savedSubtask = subtaskRepository.save(subtask);
        return TaskMapper.toSubtaskResponse(savedSubtask);
    }

    @Transactional
    public TaskResponse toggleSubtaskCompletion(Long subtaskId) {
        Subtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new ResourceNotFoundException("Subtask not found with ID: " + subtaskId));

        subtask.setCompleted(!subtask.isCompleted());
        subtaskRepository.save(subtask);

        Task parentTask = taskRepository.findWithDetailsById(subtask.getTask().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Parent task not found"));

        return TaskMapper.toTaskResponse(parentTask);
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
