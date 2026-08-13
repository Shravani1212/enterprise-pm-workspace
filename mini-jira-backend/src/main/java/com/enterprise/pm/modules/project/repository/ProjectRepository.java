package com.enterprise.pm.modules.project.repository;

import com.enterprise.pm.modules.project.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    Optional<Project> findByCode(String code);

    boolean existsByCode(String code);

    @Query("SELECT DISTINCT p FROM Project p LEFT JOIN ProjectMember pm ON pm.project = p WHERE (pm.user.id = :userId AND pm.active = true) OR p.createdBy.id = :userId")
    List<Project> findProjectsByUserId(@Param("userId") Long userId);
}
