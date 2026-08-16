package com.projectpulse.pm.modules.project.mapper;

import java.util.List;

import com.projectpulse.pm.modules.auth.mapper.UserMapper;
import com.projectpulse.pm.modules.project.dto.ProjectDTOs.ProjectMemberResponse;
import com.projectpulse.pm.modules.project.dto.ProjectDTOs.ProjectResponse;
import com.projectpulse.pm.modules.project.entity.Project;
import com.projectpulse.pm.modules.project.entity.ProjectMember;

public class ProjectMapper {

    public static ProjectResponse toProjectResponse(Project project, List<ProjectMemberResponse> members) {
        return toProjectResponse(project, members, 0L, 0L);
    }

    public static ProjectResponse toProjectResponse(Project project, List<ProjectMemberResponse> members, Long taskCount, Long completedTaskCount) {
        if (project == null)
            return null;
        return new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getCode(),
                project.getDescription(),
                project.getStatus(),
                project.getStartDate(),
                project.getEndDate(),
                UserMapper.toUserResponse(project.getCreatedBy()),
                members,
                taskCount,
                completedTaskCount,
                project.getCreatedAt(),
                project.getUpdatedAt(),
                project.getVersion());
    }

    public static ProjectResponse toProjectResponse(Project project) {
        return toProjectResponse(project, null);
    }

    public static ProjectMemberResponse toProjectMemberResponse(ProjectMember member) {
        if (member == null)
            return null;
        return new ProjectMemberResponse(
                member.getId(),
                member.getProject().getId(),
                UserMapper.toUserResponse(member.getUser()),
                member.getProjectRole().getCode(),
                member.isActive(),
                member.getLead() != null ? UserMapper.toUserResponse(member.getLead()) : null,
                member.getJoinedAt());
    }
}
