package com.enterprise.pm.modules.project.repository;

import com.enterprise.pm.modules.project.entity.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {

    Optional<ProjectMember> findByProjectIdAndUserId(Long projectId, Long userId);

    boolean existsByProjectIdAndUserIdAndActiveTrue(Long projectId, Long userId);

    @Query("SELECT DISTINCT pm FROM ProjectMember pm JOIN FETCH pm.user u LEFT JOIN FETCH u.roles JOIN FETCH pm.projectRole WHERE pm.project.id = :projectId AND pm.active = true")
    List<ProjectMember> findActiveMembersByProjectId(@Param("projectId") Long projectId);
}
