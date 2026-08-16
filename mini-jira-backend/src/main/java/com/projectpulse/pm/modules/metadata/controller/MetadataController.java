package com.projectpulse.pm.modules.metadata.controller;

import com.projectpulse.pm.common.api.ApiResponse;
import com.projectpulse.pm.modules.metadata.dto.MetadataDTOs.*;
import com.projectpulse.pm.modules.metadata.service.MetadataService;
import com.projectpulse.pm.security.annotation.RequireProjectAccess;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class MetadataController {

    private final MetadataService metadataService;

    @GetMapping("/projects/{projectId}/statuses")
    @RequireProjectAccess(paramName = "projectId")
    public ResponseEntity<ApiResponse<List<TaskStatusResponse>>> getProjectStatuses(@PathVariable("projectId") Long projectId) {
        return ResponseEntity.ok(ApiResponse.success(metadataService.getStatusesForProject(projectId)));
    }

    @GetMapping("/priorities")
    public ResponseEntity<ApiResponse<List<PriorityResponse>>> getAllPriorities() {
        return ResponseEntity.ok(ApiResponse.success(metadataService.getAllPriorities()));
    }

    @GetMapping("/projects/{projectId}/labels")
    @RequireProjectAccess(paramName = "projectId")
    public ResponseEntity<ApiResponse<List<LabelResponse>>> getProjectLabels(@PathVariable("projectId") Long projectId) {
        return ResponseEntity.ok(ApiResponse.success(metadataService.getLabelsForProject(projectId)));
    }
}
