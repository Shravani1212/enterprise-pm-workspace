package com.enterprise.pm.modules.collaboration.service;

import com.enterprise.pm.modules.collaboration.entity.Comment;
import com.enterprise.pm.modules.collaboration.repository.CommentRepository;
import com.enterprise.pm.modules.project.entity.Project;
import com.enterprise.pm.modules.project.repository.ProjectRepository;
import com.enterprise.pm.modules.task.entity.Task;
import com.enterprise.pm.modules.task.repository.TaskRepository;
import com.enterprise.pm.modules.auth.entity.User;
import com.enterprise.pm.modules.auth.repository.UserRepository;
import com.enterprise.pm.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityLogService {

    private final CommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<Comment> getTaskComments(Long taskId) {
        return commentRepository.findActiveByTaskIdWithUser(taskId);
    }

    @Transactional
    public Comment addComment(Long taskId, String content, Long userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + taskId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        Comment comment = Comment.builder()
                .task(task)
                .user(user)
                .content(content)
                .build();

        return commentRepository.save(comment);
    }
}
