package com.projectpulse.pm.modules.project.repository;

import com.projectpulse.pm.modules.project.entity.ProjectSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProjectSettingsRepository extends JpaRepository<ProjectSetting, Long> {

    Optional<ProjectSetting> findByProjectId(Long projectId);
}
