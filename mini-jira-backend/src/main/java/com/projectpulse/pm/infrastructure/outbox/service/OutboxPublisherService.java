package com.projectpulse.pm.infrastructure.outbox.service;

import com.projectpulse.pm.modules.outbox.entity.OutboxEvent;
import com.projectpulse.pm.infrastructure.outbox.repository.OutboxEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OutboxPublisherService {

    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    @SneakyThrows
    public void publishEvent(String aggregateType, Long aggregateId, String eventType, Object payload) {
        String jsonPayload = objectMapper.writeValueAsString(payload);

        OutboxEvent outboxEvent = OutboxEvent.builder()
                .aggregateType(aggregateType)
                .aggregateId(aggregateId.toString())
                .eventType(eventType)
                .payload(jsonPayload)
                .processed(false)
                .build();

        outboxEventRepository.save(outboxEvent);
        log.info("Saved Transactional Outbox Event [{} ID={}] into DB", eventType, aggregateId);
    }
}
