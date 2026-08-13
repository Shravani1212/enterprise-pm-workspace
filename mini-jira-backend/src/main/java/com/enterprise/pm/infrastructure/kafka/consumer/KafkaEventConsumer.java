package com.enterprise.pm.infrastructure.kafka.consumer;

import com.enterprise.pm.infrastructure.kafka.dto.DomainEvents.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

@Service
@Slf4j
@ConditionalOnProperty(name = "spring.kafka.enabled", havingValue = "true", matchIfMissing = false)
public class KafkaEventConsumer {

    @KafkaListener(topics = "task-events", groupId = "pm-workspace-group")
    public void consumeTaskEvent(Object event) {
        log.info("Received Kafka Task Event in Group [pm-workspace-group]: {}", event);
    }

    @KafkaListener(topics = "notification-events", groupId = "notification-service-group")
    public void consumeNotificationEvent(Object event) {
        log.info("Received Kafka Notification Event in Group [notification-service-group]: {}", event);
    }
}
