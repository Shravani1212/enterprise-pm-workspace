package com.enterprise.pm.modules.auth.repository;

import com.enterprise.pm.modules.auth.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
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

    @EntityGraph(attributePaths = {"roles"})
    @Query("SELECT DISTINCT u FROM User u JOIN u.roles r WHERE UPPER(r.code) IN :roleCodes OR UPPER(r.name) IN :roleCodes")
    java.util.List<User> findByRoleCodesIn(@org.springframework.data.repository.query.Param("roleCodes") java.util.Collection<String> roleCodes);
}
