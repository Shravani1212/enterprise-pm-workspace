package com.enterprise.pm.modules.task.specification;

import com.enterprise.pm.modules.task.entity.Task;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public class TaskSpecification {

    public static Specification<Task> filterTasks(Long projectId, String search, Long priorityId, Long statusId, Long assigneeId, Long labelId) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Avoid duplicate rows from JOINs
            if (query != null) {
                query.distinct(true);
            }

            // 1. Mandatory Project ID Filter (Row-Level Security Multi-Tenancy)
            predicates.add(criteriaBuilder.equal(root.get("project").get("id"), projectId));

            // 2. Case-Insensitive Search across Title, Description, AND Subtask Titles
            if (StringUtils.hasText(search)) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                Predicate titleLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), searchPattern);
                Predicate descLike  = criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), searchPattern);

                // LEFT JOIN subtasks so tasks without subtasks are still returned
                Join<Object, Object> subtasksJoin = root.join("subtasks", JoinType.LEFT);
                Predicate subtaskTitleLike = criteriaBuilder.like(criteriaBuilder.lower(subtasksJoin.get("title")), searchPattern);

                predicates.add(criteriaBuilder.or(titleLike, descLike, subtaskTitleLike));
            }

            // 3. Priority Equal Filter
            if (priorityId != null) {
                predicates.add(criteriaBuilder.equal(root.get("priority").get("id"), priorityId));
            }

            // 4. Status Equal Filter
            if (statusId != null) {
                predicates.add(criteriaBuilder.equal(root.get("status").get("id"), statusId));
            }

            // 5. Assignee Equal Filter
            if (assigneeId != null) {
                predicates.add(criteriaBuilder.equal(root.get("assignee").get("id"), assigneeId));
            }

            // 6. Label Join Filter
            if (labelId != null) {
                Join<Object, Object> labelsJoin = root.join("labels");
                predicates.add(criteriaBuilder.equal(labelsJoin.get("id"), labelId));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
