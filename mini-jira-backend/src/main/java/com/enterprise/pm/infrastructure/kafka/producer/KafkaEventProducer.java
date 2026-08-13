package com.enterprise.pm.infrastructure.kafka.producer;

import com.enterprise.pm.infrastructure.kafka.dto.DomainEvents.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "spring.kafka.enabled", havingValue = "true", matchIfMissing = false)
public class KafkaEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void sendTaskCreatedEvent(TaskCreatedEvent event) {
        log.info("Publishing TaskCreatedEvent to Kafka [task-events]: {}", event);
        kafkaTemplate.send("task-events", event.taskId().toString(), event);
    }

    public void sendTaskStatusChangedEvent(TaskStatusChangedEvent event) {
        log.info("Publishing TaskStatusChangedEvent to Kafka [task-events]: {}", event);
        kafkaTemplate.send("task-events", event.taskId().toString(), event);
    }

    public void sendTaskAssignedEvent(TaskAssignedEvent event) {
        log.info("Publishing TaskAssignedEvent to Kafka [notification-events]: {}", event);
        kafkaTemplate.send("notification-events", event.taskId().toString(), event);
    }
}
