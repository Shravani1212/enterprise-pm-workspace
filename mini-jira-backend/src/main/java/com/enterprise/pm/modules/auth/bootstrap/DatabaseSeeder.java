package com.enterprise.pm.modules.auth.bootstrap;

import com.enterprise.pm.modules.auth.entity.Role;
import com.enterprise.pm.modules.auth.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        log.info("Database Seeding check started...");
        seedRoles();
        updateTodoCapacityLimit();
    }

    private void seedRoles() {
        List<RoleSeed> rolesToSeed = List.of(
            new RoleSeed("ADMIN", "Administrator", "Full system administrator access"),
            new RoleSeed("PROJECT_MANAGER", "Project Manager", "Project and sprint planning control"),
            new RoleSeed("PROJECT_LEAD", "Project Lead", "Task assignment and execution delegation"),
            new RoleSeed("DEVELOPER", "Developer", "Task completion and development execution")
        );

        for (RoleSeed seed : rolesToSeed) {
            roleRepository.findByCode(seed.code())
                .orElseGet(() -> {
                    log.info("Seeding missing system role: {}", seed.code());
                    return roleRepository.save(Role.builder()
                        .code(seed.code())
                        .name(seed.name())
                        .description(seed.description())
                        .active(true)
                        .build());
                });
        }
    }

    private void updateTodoCapacityLimit() {
        try {
            int rows = jdbcTemplate.update("UPDATE task_statuses SET capacity_limit = 3 WHERE code = 'TODO' AND capacity_limit = 0");
            if (rows > 0) {
                log.info("Successfully updated TODO capacity limit to 3 in the database. Rows affected: {}", rows);
            }
        } catch (Exception e) {
            log.error("Failed to update TODO capacity limit", e);
        }
    }

    private record RoleSeed(String code, String name, String description) {}
}
