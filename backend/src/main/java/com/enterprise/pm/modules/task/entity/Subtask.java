package com.enterprise.pm.modules.task.entity;

import com.enterprise.pm.common.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "subtasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subtask extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "completed", nullable = false)
    @Builder.Default
    private boolean completed = false;
}
