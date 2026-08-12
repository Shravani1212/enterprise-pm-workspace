package com.enterprise.pm.infrastructure.kafka.dto;

import java.time.Instant;

public class DomainEvents {

    public record TaskCreatedEvent(
        Long taskId,
        Long projectId,
        String title,
        Long assigneeId,
        Long createdById,
        Instant timestamp
    ) {}

    public record TaskStatusChangedEvent(
        Long taskId,
        Long projectId,
        String title,
        Long oldStatusId,
        Long newStatusId,
        Long updatedById,
        Instant timestamp
    ) {}

    public record TaskAssignedEvent(
        Long taskId,
        Long projectId,
        String title,
        Long assigneeId,
        Long assignedById,
        Instant timestamp
    ) {}
}
