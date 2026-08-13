package com.enterprise.pm.modules.task.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "task_escalation_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EscalationRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "role_code", nullable = false, length = 50)
    private String roleCode; // DEVELOPER, PROJECT_MANAGER, ADMIN

    @Column(name = "warning_days_threshold", nullable = false)
    private Integer warningDaysThreshold;

    @Column(name = "escalation_days_threshold", nullable = false)
    private Integer escalationDaysThreshold;

    @Column(name = "escalation_level", nullable = false, length = 50)
    private String escalationLevel; // DEVELOPER_WARNING, PM_ESCALATION, ADMIN_CRITICAL_ESCALATION

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
}
