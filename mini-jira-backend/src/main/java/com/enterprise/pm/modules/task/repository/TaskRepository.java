package com.enterprise.pm.modules.task.repository;

import com.enterprise.pm.modules.task.entity.Task;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long>, JpaSpecificationExecutor<Task> {

    @Query("SELECT DISTINCT t FROM Task t " +
           "JOIN FETCH t.status " +
           "JOIN FETCH t.priority " +
           "LEFT JOIN FETCH t.assignee " +
           "LEFT JOIN FETCH t.subtasks " +
           "WHERE t.project.id = :projectId")
    List<Task> findAllByProjectIdWithDetails(@Param("projectId") Long projectId);

    @EntityGraph(attributePaths = {"status", "priority", "assignee", "subtasks", "labels"})
    Optional<Task> findWithDetailsById(Long id);
}
