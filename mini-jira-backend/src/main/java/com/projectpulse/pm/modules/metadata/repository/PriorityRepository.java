package com.projectpulse.pm.modules.metadata.repository;

import com.projectpulse.pm.modules.metadata.entity.Priority;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PriorityRepository extends JpaRepository<Priority, Long> {

    List<Priority> findAllByActiveTrueOrderByLevelAsc();

    Optional<Priority> findByCode(String code);
}
