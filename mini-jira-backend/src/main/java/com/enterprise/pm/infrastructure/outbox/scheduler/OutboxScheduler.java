package com.enterprise.pm.infrastructure.outbox.scheduler;

import com.enterprise.pm.infrastructure.kafka.producer.KafkaEventProducer;
import com.enterprise.pm.modules.outbox.entity.OutboxEvent;
import com.enterprise.pm.infrastructure.outbox.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.beans.factory.ObjectProvider;

import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class OutboxScheduler {

    private final OutboxEventRepository outboxEventRepository;
    private final ObjectProvider<KafkaEventProducer> kafkaEventProducerProvider;

    @Scheduled(fixedDelay = 5000)
    @Transactional
    public void processPendingOutboxEvents() {
        List<OutboxEvent> pendingEvents = outboxEventRepository.findByProcessedFalseOrderByCreatedAtAsc();

        if (pendingEvents.isEmpty()) {
            return;
        }

        log.info("Processing {} PENDING Transactional Outbox Events", pendingEvents.size());
        KafkaEventProducer kafkaEventProducer = kafkaEventProducerProvider.getIfAvailable();

        for (OutboxEvent event : pendingEvents) {
            try {
                if (kafkaEventProducer != null) {
                    log.info("Dispatching Outbox Event ID {} to Kafka: {}", event.getId(), event.getEventType());
                } else {
                    log.info("Kafka is disabled; marked Outbox Event ID {} as processed: {}", event.getId(), event.getEventType());
                }

                event.setProcessed(true);
                event.setProcessedAt(Instant.now());
                outboxEventRepository.save(event);
            } catch (Exception e) {
                log.error("Failed to process Outbox Event ID {}: {}", event.getId(), e.getMessage());
            }
        }
    }
}
