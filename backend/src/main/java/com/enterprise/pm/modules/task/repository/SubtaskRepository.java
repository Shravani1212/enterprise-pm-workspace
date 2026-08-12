package com.enterprise.pm.modules.task.repository;

import com.enterprise.pm.modules.task.entity.Subtask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubtaskRepository extends JpaRepository<Subtask, Long> {

    List<Subtask> findByTaskId(Long taskId);
}
