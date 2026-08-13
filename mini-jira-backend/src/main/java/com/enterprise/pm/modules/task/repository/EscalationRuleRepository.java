package com.enterprise.pm.modules.task.repository;

import com.enterprise.pm.modules.task.entity.EscalationRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EscalationRuleRepository extends JpaRepository<EscalationRule, Long> {
    List<EscalationRule> findByRoleCode(String roleCode);
}
