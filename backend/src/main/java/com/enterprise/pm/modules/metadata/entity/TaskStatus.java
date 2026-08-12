package com.enterprise.pm.modules.metadata.entity;

import com.enterprise.pm.modules.project.entity.Project;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "task_statuses", uniqueConstraints = {
    @UniqueConstraint(name = "uk_project_status_code", columnNames = {"project_id", "code"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @Column(name = "name", nullable = false, length = 50)
    private String name;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private int displayOrder = 0;

    @Column(name = "color", nullable = false, length = 20)
    @Builder.Default
    private String color = "#64748b";

    @Column(name = "capacity_limit", nullable = false)
    @Builder.Default
    private int capacityLimit = 0;

    @Column(name = "active", nullable = false)
    @Builder.Default
    private boolean active = true;
}
