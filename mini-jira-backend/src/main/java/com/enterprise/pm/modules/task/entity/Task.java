package com.enterprise.pm.modules.task.entity;

import com.enterprise.pm.common.model.BaseEntity;
import com.enterprise.pm.modules.auth.entity.User;
import com.enterprise.pm.modules.metadata.entity.Label;
import com.enterprise.pm.modules.metadata.entity.Priority;
import com.enterprise.pm.modules.metadata.entity.TaskStatus;
import com.enterprise.pm.modules.project.entity.Project;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_id", nullable = false)
    private TaskStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "priority_id", nullable = false)
    private Priority priority;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    private User assignee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "start_date")
    private Instant startDate;

    @Column(name = "end_date")
    private Instant endDate;

    @Column(name = "due_date")
    private Instant dueDate;

    @Column(name = "estimated_hours")
    @Builder.Default
    private Integer estimatedHours = 8;

    @Column(name = "logged_hours")
    @Builder.Default
    private Integer loggedHours = 0;

    @Column(name = "escalation_level", length = 50)
    @Builder.Default
    private String escalationLevel = "NONE";

    @Column(name = "attachment_path", length = 500)
    private String attachmentPath;

    @Column(name = "attachment_name", length = 255)
    private String attachmentName;

    @Column(name = "attachment_type", length = 100)
    private String attachmentType;

    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Subtask> subtasks = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "task_labels",
        joinColumns = @JoinColumn(name = "task_id"),
        inverseJoinColumns = @JoinColumn(name = "label_id")
    )
    @Builder.Default
    private Set<Label> labels = new HashSet<>();

    public void addSubtask(Subtask subtask) {
        subtasks.add(subtask);
        subtask.setTask(this);
    }

    public void removeSubtask(Subtask subtask) {
        subtasks.remove(subtask);
        subtask.setTask(null);
    }
}
