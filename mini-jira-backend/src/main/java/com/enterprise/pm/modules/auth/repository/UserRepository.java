package com.enterprise.pm.modules.auth.repository;

import com.enterprise.pm.modules.auth.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    @Override
    @EntityGraph(attributePaths = {"roles"})
    Optional<User> findById(Long id);

    @EntityGraph(attributePaths = {"roles"})
    Optional<User> findByUsername(String username);

    @EntityGraph(attributePaths = {"roles"})
    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);
}
