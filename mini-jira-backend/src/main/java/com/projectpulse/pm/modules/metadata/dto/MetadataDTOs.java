package com.projectpulse.pm.modules.metadata.dto;

public class MetadataDTOs {

    public record TaskStatusResponse(
        Long id,
        Long projectId,
        String name,
        String code,
        int displayOrder,
        String color,
        int capacityLimit,
        boolean active
    ) {}

    public record PriorityResponse(
        Long id,
        String name,
        String code,
        int level,
        String color,
        boolean active
    ) {}

    public record LabelResponse(
        Long id,
        Long projectId,
        String name,
        String code,
        String color,
        boolean active
    ) {}
}
