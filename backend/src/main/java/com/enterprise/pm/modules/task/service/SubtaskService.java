package com.enterprise.pm.modules.task.service;

import com.enterprise.pm.common.exception.ResourceNotFoundException;
import com.enterprise.pm.modules.task.dto.TaskDTOs.*;
import com.enterprise.pm.modules.task.entity.Subtask;
import com.enterprise.pm.modules.task.entity.Task;
import com.enterprise.pm.modules.task.mapper.TaskMapper;
import com.enterprise.pm.modules.task.repository.SubtaskRepository;
import com.enterprise.pm.modules.task.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SubtaskService {

    private final SubtaskRepository subtaskRepository;
    private final TaskRepository taskRepository;

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

        // Fetch refreshed parent task to return updated progress percentage
        Task parentTask = taskRepository.findWithDetailsById(subtask.getTask().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Parent task not found"));

        return TaskMapper.toTaskResponse(parentTask);
    }

    @Transactional
    public TaskResponse deleteSubtask(Long subtaskId) {
        Subtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new ResourceNotFoundException("Subtask not found with ID: " + subtaskId));

        Long parentTaskId = subtask.getTask().getId();
        subtaskRepository.delete(subtask);

        Task parentTask = taskRepository.findWithDetailsById(parentTaskId)
                .orElseThrow(() -> new ResourceNotFoundException("Parent task not found"));

        return TaskMapper.toTaskResponse(parentTask);
    }
}
