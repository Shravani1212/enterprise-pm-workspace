package com.projectpulse.pm.modules.task.service;

import com.projectpulse.pm.modules.auth.entity.User;
import com.projectpulse.pm.modules.auth.repository.UserRepository;
import com.projectpulse.pm.modules.metadata.entity.Priority;
import com.projectpulse.pm.modules.metadata.entity.TaskStatus;
import com.projectpulse.pm.modules.metadata.repository.PriorityRepository;
import com.projectpulse.pm.modules.metadata.repository.TaskStatusRepository;
import com.projectpulse.pm.modules.project.entity.Project;
import com.projectpulse.pm.modules.project.repository.ProjectMemberRepository;
import com.projectpulse.pm.modules.project.repository.ProjectRepository;
import com.projectpulse.pm.modules.task.dto.TaskDTOs.TaskCreateRequest;
import com.projectpulse.pm.modules.task.dto.TaskDTOs.TaskResponse;
import com.projectpulse.pm.modules.task.entity.Task;
import com.projectpulse.pm.modules.task.repository.TaskRepository;
import com.projectpulse.pm.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private TaskStatusRepository taskStatusRepository;

    @Mock
    private PriorityRepository priorityRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TaskService taskService;

    private Project testProject;
    private User testUser;
    private UserPrincipal testPrincipal;
    private TaskStatus testStatus;
    private Priority testPriority;

    @BeforeEach
    void setUp() {
        testUser = User.builder().id(1L).username("shravani").email("shravani@enterprise.com").build();
        testPrincipal = new UserPrincipal(1L, "shravani", "shravani@enterprise.com", "pass", Collections.emptyList());
        testProject = Project.builder().id(100L).name("Core PM Engine").code("CPM").createdBy(testUser).build();
        testStatus = TaskStatus.builder().id(1L).name("TODO").code("TODO").build();
        testPriority = Priority.builder().id(2L).name("HIGH").code("HIGH").build();
    }

    @Test
    @DisplayName("Rule 8 Test: Should throw IllegalArgumentException when assignee is NOT a member of Project")
    void createTask_rule8AssigneeCheck_shouldFailWhenAssigneeNotMember() {
        Long nonMemberUserId = 99L;
        TaskCreateRequest request = new TaskCreateRequest(
                "Implement Security Filter",
                "Description",
                1L,
                2L,
                nonMemberUserId,
                null,
                null,
                null,
                null,
                null,
                Collections.emptySet()
        );

        when(projectRepository.findById(100L)).thenReturn(Optional.of(testProject));
        when(taskStatusRepository.findById(1L)).thenReturn(Optional.of(testStatus));
        when(priorityRepository.findById(2L)).thenReturn(Optional.of(testPriority));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(projectMemberRepository.existsByProjectIdAndUserIdAndActiveTrue(100L, nonMemberUserId)).thenReturn(false);

        assertThatThrownBy(() -> taskService.createTask(100L, request, testPrincipal))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Selected user ID 99 is not an active member of Project 100");

        verify(taskRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should successfully create task when assignee IS a valid active member of Project")
    void createTask_rule8AssigneeCheck_shouldSucceedWhenAssigneeIsMember() {
        Long memberUserId = 5L;
        User assigneeUser = User.builder().id(5L).username("ravi").build();
        TaskCreateRequest request = new TaskCreateRequest(
                "Implement Security Filter",
                "Description",
                1L,
                2L,
                memberUserId,
                null,
                null,
                null,
                null,
                null,
                Collections.emptySet()
        );

        when(projectRepository.findById(100L)).thenReturn(Optional.of(testProject));
        when(taskStatusRepository.findById(1L)).thenReturn(Optional.of(testStatus));
        when(priorityRepository.findById(2L)).thenReturn(Optional.of(testPriority));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.findById(5L)).thenReturn(Optional.of(assigneeUser));
        when(projectMemberRepository.existsByProjectIdAndUserIdAndActiveTrue(100L, memberUserId)).thenReturn(true);

        Task savedTask = Task.builder()
                .id(42L)
                .project(testProject)
                .title("Implement Security Filter")
                .status(testStatus)
                .priority(testPriority)
                .assignee(assigneeUser)
                .createdBy(testUser)
                .build();

        when(taskRepository.save(any(Task.class))).thenReturn(savedTask);

        TaskResponse response = taskService.createTask(100L, request, testPrincipal);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(42L);
        assertThat(response.title()).isEqualTo("Implement Security Filter");
        verify(taskRepository, times(1)).save(any(Task.class));
    }
}
