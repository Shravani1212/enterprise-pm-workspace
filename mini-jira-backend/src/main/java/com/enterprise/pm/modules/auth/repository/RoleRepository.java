package com.enterprise.pm.modules.auth.repository;

import com.enterprise.pm.modules.auth.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Set;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByCode(String code);

    @Query("SELECT r.permissions FROM Role r WHERE r.code = :roleCode")
    Set<Object> findPermissionsByRoleCode(@Param("roleCode") String roleCode);
}
