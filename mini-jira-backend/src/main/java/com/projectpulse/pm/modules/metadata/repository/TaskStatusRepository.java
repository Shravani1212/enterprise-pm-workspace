package com.projectpulse.pm.modules.metadata.repository;

import com.projectpulse.pm.modules.metadata.entity.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskStatusRepository extends JpaRepository<TaskStatus, Long> {

    @Query("SELECT ts FROM TaskStatus ts WHERE (ts.project.id = :projectId OR ts.project.id IS NULL) AND ts.active = true ORDER BY ts.displayOrder ASC")
    List<TaskStatus> findActiveByProjectIdOrGlobal(@Param("projectId") Long projectId);

    Optional<TaskStatus> findFirstByCode(String code);

    Optional<TaskStatus> findFirstByProjectIdAndCode(Long projectId, String code);

    Optional<TaskStatus> findFirstByProjectIsNullAndCode(String code);
}
