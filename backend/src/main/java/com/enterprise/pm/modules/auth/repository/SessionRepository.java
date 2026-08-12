package com.enterprise.pm.modules.auth.repository;

import com.enterprise.pm.modules.auth.entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SessionRepository extends JpaRepository<Session, UUID> {

    Optional<Session> findByTokenHash(String tokenHash);

    @Query("SELECT s FROM Session s WHERE s.user.id = :userId AND s.revokedAt IS NULL ORDER BY s.lastAccessedAt DESC")
    List<Session> findActiveSessionsByUserId(@Param("userId") Long userId);
}
