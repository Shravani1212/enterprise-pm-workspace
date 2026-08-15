package com.enterprise.pm.modules.metadata.service;

import com.enterprise.pm.modules.metadata.dto.MetadataDTOs.*;
import com.enterprise.pm.modules.metadata.repository.LabelRepository;
import com.enterprise.pm.modules.metadata.repository.PriorityRepository;
import com.enterprise.pm.modules.metadata.repository.TaskStatusRepository;
import com.enterprise.pm.modules.task.mapper.TaskMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MetadataService {

    private final TaskStatusRepository taskStatusRepository;
    private final PriorityRepository priorityRepository;
    private final LabelRepository labelRepository;

    @Transactional(readOnly = true)
    @Cacheable(value = "project_statuses", key = "#projectId")
    public List<TaskStatusResponse> getStatusesForProject(Long projectId) {
        List<com.enterprise.pm.modules.metadata.entity.TaskStatus> statuses = taskStatusRepository.findActiveByProjectIdOrGlobal(projectId);
        
        boolean hasProjectSpecific = statuses.stream().anyMatch(ts -> ts.getProject() != null);
        if (hasProjectSpecific) {
            statuses = statuses.stream()
                    .filter(ts -> ts.getProject() != null)
                    .toList();
        }

        return statuses.stream()
                .map(TaskMapper::toTaskStatusResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "priorities", key = "'all'")
    public List<PriorityResponse> getAllPriorities() {
        return priorityRepository.findAllByActiveTrueOrderByLevelAsc().stream()
                .map(TaskMapper::toPriorityResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "project_labels", key = "#projectId")
    public List<LabelResponse> getLabelsForProject(Long projectId) {
        return labelRepository.findActiveByProjectIdOrGlobal(projectId).stream()
                .map(TaskMapper::toLabelResponse)
                .toList();
    }
}
