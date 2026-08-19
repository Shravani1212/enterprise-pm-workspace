package com.projectpulse.pm.modules.task.specification;

import com.projectpulse.pm.modules.task.entity.Task;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public class TaskSpecification {

    public static Specification<Task> filterTasks(Long projectId, String search, Long priorityId, Long statusId,
            Long assigneeId, Long labelId) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (query != null) {
                query.distinct(true);
            }

            predicates.add(criteriaBuilder.equal(root.get("project").get("id"), projectId));

            if (StringUtils.hasText(search)) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                Predicate titleLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), searchPattern);
                Predicate descLike = criteriaBuilder.like(criteriaBuilder.lower(root.get("description")),
                        searchPattern);

                Join<Object, Object> subtasksJoin = root.join("subtasks", JoinType.LEFT);
                Predicate subtaskTitleLike = criteriaBuilder.like(criteriaBuilder.lower(subtasksJoin.get("title")),
                        searchPattern);

                predicates.add(criteriaBuilder.or(titleLike, descLike, subtaskTitleLike));
            }

            if (priorityId != null) {
                predicates.add(criteriaBuilder.equal(root.get("priority").get("id"), priorityId));
            }
            if (statusId != null) {
                predicates.add(criteriaBuilder.equal(root.get("status").get("id"), statusId));
            }

            if (assigneeId != null) {
                predicates.add(criteriaBuilder.equal(root.get("assignee").get("id"), assigneeId));
            }
            if (labelId != null) {
                Join<Object, Object> labelsJoin = root.join("labels");
                predicates.add(criteriaBuilder.equal(labelsJoin.get("id"), labelId));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
