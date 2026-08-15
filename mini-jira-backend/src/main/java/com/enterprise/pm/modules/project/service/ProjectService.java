package com.enterprise.pm.modules.project.service;

import com.enterprise.pm.common.exception.ResourceNotFoundException;
import com.enterprise.pm.modules.auth.entity.Role;
import com.enterprise.pm.modules.auth.entity.User;
import com.enterprise.pm.modules.auth.repository.RoleRepository;
import com.enterprise.pm.modules.auth.repository.UserRepository;
import com.enterprise.pm.modules.metadata.entity.TaskStatus;
import com.enterprise.pm.modules.metadata.repository.TaskStatusRepository;
import com.enterprise.pm.modules.project.dto.ProjectDTOs.*;
import com.enterprise.pm.modules.project.entity.Project;
import com.enterprise.pm.modules.project.entity.ProjectMember;
import com.enterprise.pm.modules.project.entity.ProjectSetting;
import com.enterprise.pm.modules.project.mapper.ProjectMapper;
import com.enterprise.pm.modules.project.repository.ProjectMemberRepository;
import com.enterprise.pm.modules.project.repository.ProjectRepository;
import com.enterprise.pm.modules.project.repository.ProjectSettingsRepository;
import com.enterprise.pm.modules.task.entity.Task;
import com.enterprise.pm.modules.task.repository.TaskRepository;
import com.enterprise.pm.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectSettingsRepository projectSettingsRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final TaskStatusRepository taskStatusRepository;
    private final TaskRepository taskRepository;

    @Transactional(readOnly = true)
    public List<ProjectResponse> getUserProjects(UserPrincipal currentUser) {
        boolean showAll = currentUser == null || currentUser.getId() == null ||
                currentUser.getAuthorities().stream().anyMatch(a ->
                        a.getAuthority().equals("ROLE_ADMIN")
                );

        List<Project> projects = showAll
                ? projectRepository.findAll()
                : projectRepository.findProjectsByUserId(currentUser.getId());

        return projects.stream().map(p -> {
            List<ProjectMemberResponse> members = getProjectMembers(p.getId());
            long taskCount = taskRepository.countByProjectId(p.getId());
            long completedCount = taskRepository.countByProjectIdAndStatusCode(p.getId(), "DONE");
            return ProjectMapper.toProjectResponse(p, members, taskCount, completedCount);
        }).toList();
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "projects", key = "#id")
    public ProjectResponse getProjectById(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + id));
        List<ProjectMemberResponse> members = getProjectMembers(id);
        long taskCount = taskRepository.countByProjectId(id);
        long completedCount = taskRepository.countByProjectIdAndStatusCode(id, "DONE");
        return ProjectMapper.toProjectResponse(project, members, taskCount, completedCount);
    }

    @Transactional
    @CacheEvict(value = "projects", key = "#id")
    public ProjectResponse updateProject(Long id, ProjectUpdateRequest request) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + id));

        LocalDate today = LocalDate.now();
        if (request.startDate() != null && request.startDate().isBefore(today.minusDays(1))) {
            throw new IllegalArgumentException("Project start date cannot be in the past. Select today or a future date.");
        }
        if (request.endDate() != null && request.startDate() != null && request.endDate().isBefore(request.startDate())) {
            throw new IllegalArgumentException("Project end date must be on or after start date.");
        }

        if (request.name() != null && !request.name().isBlank()) {
            project.setName(request.name());
        }
        if (request.description() != null) {
            project.setDescription(request.description());
        }
        if (request.status() != null && !request.status().isBlank()) {
            project.setStatus(request.status());
        }
        if (request.startDate() != null) {
            project.setStartDate(request.startDate());
        }
        if (request.endDate() != null) {
            project.setEndDate(request.endDate());
        }

        Project updatedProject = projectRepository.save(project);
        return ProjectMapper.toProjectResponse(updatedProject);
    }

    @Transactional
    public ProjectResponse createProject(ProjectCreateRequest request, UserPrincipal currentUser) {
        if (projectRepository.existsByCode(request.code())) {
            throw new IllegalArgumentException("Project code already exists: " + request.code());
        }

        LocalDate today = LocalDate.now();
        if (request.startDate() != null && request.startDate().isBefore(today.minusDays(1))) {
            throw new IllegalArgumentException("Project start date cannot be in the past. Select today or a future date.");
        }
        if (request.endDate() != null && request.startDate() != null && request.endDate().isBefore(request.startDate())) {
            throw new IllegalArgumentException("Project end date must be on or after start date.");
        }

        User creator = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Project project = Project.builder()
                .name(request.name())
                .code(request.code())
                .description(request.description())
                .status("ACTIVE")
                .startDate(request.startDate())
                .endDate(request.endDate())
                .createdBy(creator)
                .build();

        Project savedProject = projectRepository.save(project);

        // 1. Create Project Settings
        ProjectSetting settings = ProjectSetting.builder()
                .project(savedProject)
                .allowGuestComments(false)
                .wipLimitEnabled(true)
                .build();
        projectSettingsRepository.save(settings);

        // 2. Add creator as PROJECT_MANAGER member
        Role managerRole = roleRepository.findByCode("PROJECT_MANAGER")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .code("PROJECT_MANAGER")
                        .name("Project Manager")
                        .description("Project and team management access")
                        .build()));

        ProjectMember member = ProjectMember.builder()
                .project(savedProject)
                .user(creator)
                .projectRole(managerRole)
                .active(true)
                .build();
        projectMemberRepository.save(member);

        // 3. Seed initial default project task statuses
        seedProjectStatuses(savedProject);

        return ProjectMapper.toProjectResponse(savedProject);
    }

    @Transactional(readOnly = true)
    public List<ProjectMemberResponse> getProjectMembers(Long projectId) {
        return projectMemberRepository.findActiveMembersByProjectId(projectId).stream()
                .map(ProjectMapper::toProjectMemberResponse)
                .toList();
    }

    @CacheEvict(value = "project_memberships", key = "#request.userId() + '_' + #projectId")
    @Transactional
    public ProjectMemberResponse addProjectMember(Long projectId, AddMemberRequest request) {
        String rCode = request.roleCode() != null ? request.roleCode().toUpperCase() : "";
        if (rCode.contains("PROJECT_MANAGER") || rCode.contains("ADMIN")) {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || auth.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
                throw new org.springframework.security.access.AccessDeniedException("Only Administrators can assign Project Manager or Administrator roles");
            }
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + projectId));

        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + request.userId()));

        Role role = roleRepository.findByCode(request.roleCode())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with code: " + request.roleCode()));

        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, request.userId())
                .orElse(ProjectMember.builder()
                        .project(project)
                        .user(user)
                        .build());

        member.setProjectRole(role);
        member.setActive(true);

        if (request.leadId() != null) {
            User leadUser = userRepository.findById(request.leadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Lead user not found with ID: " + request.leadId()));
            member.setLead(leadUser);
        } else {
            member.setLead(null);
        }

        ProjectMember savedMember = projectMemberRepository.save(member);
        return ProjectMapper.toProjectMemberResponse(savedMember);
    }

    @CacheEvict(value = "project_memberships", key = "#userId + '_' + #projectId")
    @Transactional
    public void removeProjectMember(Long projectId, Long userId) {
        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in project"));

        member.setActive(false);
        projectMemberRepository.save(member);

        // Synchronously unassign any tasks assigned to this user in this project
        List<Task> assignedTasks = taskRepository.findByProjectIdAndAssigneeId(projectId, userId);
        for (Task task : assignedTasks) {
            task.setAssignee(null);
            taskRepository.save(task);
        }
    }

    @Transactional
    @CacheEvict(value = "projects", key = "#id")
    public void deleteProject(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + id));
        projectRepository.delete(project);
    }

    private void seedProjectStatuses(Project project) {
        List<TaskStatus> initialStatuses = List.of(
                TaskStatus.builder().project(project).name("Backlog").code("BACKLOG").displayOrder(1).color("#94a3b8").capacityLimit(0).active(true).build(),
                TaskStatus.builder().project(project).name("To Do").code("TODO").displayOrder(2).color("#3b82f6").capacityLimit(3).active(true).build(),
                TaskStatus.builder().project(project).name("In Progress").code("IN_PROGRESS").displayOrder(3).color("#f59e0b").capacityLimit(3).active(true).build(),
                TaskStatus.builder().project(project).name("Done").code("DONE").displayOrder(4).color("#10b981").capacityLimit(0).active(true).build()
        );
        taskStatusRepository.saveAll(initialStatuses);
    }
}
