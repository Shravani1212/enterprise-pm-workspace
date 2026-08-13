package com.enterprise.pm.modules.metadata.repository;

import com.enterprise.pm.modules.metadata.entity.Label;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LabelRepository extends JpaRepository<Label, Long> {

    @Query("SELECT l FROM Label l WHERE (l.project.id = :projectId OR l.project.id IS NULL) AND l.active = true")
    List<Label> findActiveByProjectIdOrGlobal(@Param("projectId") Long projectId);

    java.util.Optional<Label> findByName(String name);
}
