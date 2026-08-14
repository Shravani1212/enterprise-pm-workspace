package com.enterprise.pm.config;

import com.enterprise.pm.modules.auth.entity.Role;
import com.enterprise.pm.modules.auth.entity.User;
import com.enterprise.pm.modules.auth.repository.RoleRepository;
import com.enterprise.pm.modules.auth.repository.UserRepository;
import com.enterprise.pm.modules.metadata.entity.Label;
import com.enterprise.pm.modules.metadata.entity.Priority;
import com.enterprise.pm.modules.metadata.entity.TaskStatus;
import com.enterprise.pm.modules.metadata.repository.LabelRepository;
import com.enterprise.pm.modules.metadata.repository.PriorityRepository;
import com.enterprise.pm.modules.metadata.repository.TaskStatusRepository;
import com.enterprise.pm.modules.project.entity.Project;
import com.enterprise.pm.modules.project.entity.ProjectMember;
import com.enterprise.pm.modules.project.repository.ProjectMemberRepository;
import com.enterprise.pm.modules.project.repository.ProjectRepository;
import com.enterprise.pm.modules.task.entity.EscalationRule;
import com.enterprise.pm.modules.task.entity.Subtask;
import com.enterprise.pm.modules.task.entity.Task;
import com.enterprise.pm.modules.task.repository.EscalationRuleRepository;
import com.enterprise.pm.modules.task.repository.SubtaskRepository;
import com.enterprise.pm.modules.task.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final TaskRepository taskRepository;
    private final SubtaskRepository subtaskRepository;
    private final TaskStatusRepository taskStatusRepository;
    private final PriorityRepository priorityRepository;
    private final LabelRepository labelRepository;
    private final EscalationRuleRepository escalationRuleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Checking enterprise workspace reference data initialization...");

        // 1. Ensure Roles
        Role adminRole = getOrCreateRole("ADMIN", "Administrator", "Full system administration access");
        Role pmRole = getOrCreateRole("PROJECT_MANAGER", "Project Manager", "Project and team management access");
        Role leadRole = getOrCreateRole("PROJECT_LEAD", "Project Lead", "Project leadership, task creation and assignment access");
        Role devRole = getOrCreateRole("DEVELOPER", "Developer", "Engineering task execution access");

        // 2. Ensure Task Statuses (Backlog, To Do, In Progress, Done as specified in document)
        TaskStatus backlogStatus = getOrCreateStatus("BACKLOG", "Backlog", 1);
        TaskStatus todoStatus = getOrCreateStatus("TODO", "To Do", 2);
        TaskStatus inProgressStatus = getOrCreateStatus("IN_PROGRESS", "In Progress", 3);
        TaskStatus doneStatus = getOrCreateStatus("DONE", "Done", 4);

        // 3. Ensure Priorities
        Priority lowPriority = getOrCreatePriority("LOW", "Low Priority", 1);
        Priority mediumPriority = getOrCreatePriority("MEDIUM", "Medium Priority", 2);
        Priority highPriority = getOrCreatePriority("HIGH", "High Priority", 3);
        Priority criticalPriority = getOrCreatePriority("CRITICAL", "Critical Priority", 4);

        // 4. Ensure Labels
        Label backendLabel = getOrCreateLabel("BACKEND", "#4f46e5");
        Label frontendLabel = getOrCreateLabel("FRONTEND", "#06b6d4");
        Label securityLabel = getOrCreateLabel("SECURITY", "#e11d48");
        Label devopsLabel = getOrCreateLabel("DEVOPS", "#f59e0b");
        Label aiLabel = getOrCreateLabel("AI", "#8b5cf6");
        Label bugLabel = getOrCreateLabel("BUG", "#dc2626");

        // 5. Seed Users if count == 0 or missing
        User admin = createUserIfAbsent("admin", "admin@enterprise.com", "admin123", "System", "Admin", adminRole);
        User pmUser = createUserIfAbsent("pm_user", "pm@enterprise.com", "pm123", "Project", "Manager", pmRole);
        User leadUser = createUserIfAbsent("lead_user", "lead@enterprise.com", "lead123", "Project", "Lead", leadRole);
        User devUser = createUserIfAbsent("dev_user", "dev@enterprise.com", "dev123", "Lead", "Developer", devRole);
        User sarahPm = createUserIfAbsent("sarah_pm", "sarah@enterprise.com", "sarah123", "Sarah", "Jenkins", pmRole);
        User alexDev = createUserIfAbsent("alex_dev", "alex@enterprise.com", "alex123", "Alex", "Rivera", devRole);
        User emilyQa = createUserIfAbsent("emily_qa", "emily@enterprise.com", "emily123", "Emily", "Watson", devRole);

        // 6. Seed Projects if missing
        if (projectRepository.count() == 0) {
            log.info("Seeding enterprise demo projects, members, tasks, and subtasks...");

            Project p1 = projectRepository.save(Project.builder()
                    .name("ProjectPulse Platform v1.0")
                    .code("PULSE")
                    .description("Core ProjectPulse Management platform with real-time Kanban and AI capabilities.")
                    .status("ACTIVE")
                    .startDate(LocalDate.now().minusDays(45))
                    .endDate(LocalDate.now().plusDays(60))
                    .createdBy(admin)
                    .build());

            Project p2 = projectRepository.save(Project.builder()
                    .name("Enterprise Cloud Migration")
                    .code("ECM")
                    .description("Migrating legacy microservices to Kubernetes cluster with automated CI/CD pipelines.")
                    .status("ACTIVE")
                    .startDate(LocalDate.now().minusDays(30))
                    .endDate(LocalDate.now().plusDays(90))
                    .createdBy(pmUser)
                    .build());

            Project p3 = projectRepository.save(Project.builder()
                    .name("Mobile Banking App v2.0")
                    .code("MBA")
                    .description("Next-gen biometric mobile banking application with instant transfer support.")
                    .status("ACTIVE")
                    .startDate(LocalDate.now().minusDays(20))
                    .endDate(LocalDate.now().plusDays(120))
                    .createdBy(sarahPm)
                    .build());

            Project p4 = projectRepository.save(Project.builder()
                    .name("AI Analytics & Intelligence Engine")
                    .code("AIK")
                    .description("Machine learning pipeline for predictive project delivery and risk assessment.")
                    .status("ACTIVE")
                    .startDate(LocalDate.now().minusDays(15))
                    .endDate(LocalDate.now().plusDays(150))
                    .createdBy(admin)
                    .build());

            // Add Project Members
            addMember(p1, admin, adminRole);
            addMember(p1, pmUser, pmRole);
            addMember(p1, devUser, devRole);
            addMember(p1, alexDev, devRole);

            addMember(p2, pmUser, pmRole);
            addMember(p2, devUser, devRole);
            addMember(p2, emilyQa, devRole);

            addMember(p3, sarahPm, pmRole);
            addMember(p3, alexDev, devRole);
            addMember(p3, devUser, devRole);

            addMember(p4, admin, adminRole);
            addMember(p4, devUser, devRole);

            // Seed Escalation Rules
            seedEscalationRules();

            // Seed Tasks with varied creation dates and SLA timers (including OVERDUE & ESCALATED tasks!)
            Instant threeWeeksAgo = Instant.now().minus(Duration.ofDays(21));
            Instant fourWeeksAgo = Instant.now().minus(Duration.ofDays(28));
            Instant twoWeeksAgo = Instant.now().minus(Duration.ofDays(14));
            Instant fiveDaysAgo = Instant.now().minus(Duration.ofDays(5));

            // Overdue Task 1 - ADMIN CRITICAL ESCALATION for dev_user
            Task t1 = createTaskWithTime(p1, "Fix Critical Memory Leak in Auth Token Refresh Service",
                    "Spring Security JWT token refresh filter leaks memory under heavy concurrent user authentication load.",
                    todoStatus, criticalPriority, devUser, admin, fourWeeksAgo, 24, 18, "ADMIN_CRITICAL_ESCALATION", Set.of(backendLabel, securityLabel, bugLabel));

            addSubtask(t1, "Profile heap dump with JProfiler", true);
            addSubtask(t1, "Refactor JwtAuthenticationFilter token cache TTL", false);
            addSubtask(t1, "Run load test with 5,000 requests/sec", false);

            // Overdue Task 2 - PM ESCALATION for dev_user
            Task t2 = createTaskWithTime(p1, "Refactor Outbox Scheduler Event Retry Queue",
                    "Outbox events fail silently when Kafka broker disconnects without auto-ack.",
                    inProgressStatus, highPriority, devUser, pmUser, threeWeeksAgo, 16, 12, "PM_ESCALATION", Set.of(backendLabel, devopsLabel));

            addSubtask(t2, "Add Exponential Backoff Policy", true);
            addSubtask(t2, "Add Dead Letter Queue fallback table", false);

            // Overdue Task 3 - DEVELOPER WARNING for alex_dev
            Task t3 = createTaskWithTime(p2, "Upgrade Kubernetes Cluster Helm Chart Secrets",
                    "Vault integration for production cluster DB credentials expired.",
                    todoStatus, highPriority, alexDev, pmUser, twoWeeksAgo, 12, 4, "DEVELOPER_WARNING", Set.of(devopsLabel, securityLabel));

            // Demo Tasks matching exact specification mock (Backlog, To Do, In Progress, Done)
            Task tb1 = createTaskWithTime(p1, "Gantt dependency arrows",
                    "Draw finish-to-start links between dependent tasks across board and timeline.",
                    backlogStatus, lowPriority, alexDev, admin, fiveDaysAgo, 16, 0, "NONE", Set.of(frontendLabel));
            addSubtask(tb1, "Calculate arrow SVG coordinates", false);
            addSubtask(tb1, "Render bezier curves on canvas", false);

            Task tb2 = createTaskWithTime(p1, "Optimistic drag rollback",
                    "Roll a card back to its origin column when the API rejects the status change move.",
                    backlogStatus, mediumPriority, devUser, pmUser, fiveDaysAgo, 12, 12, "NONE", Set.of(frontendLabel, backendLabel));
            addSubtask(tb2, "Capture snapshot state before drop", true);
            addSubtask(tb2, "Trigger automatic rollback on error response", true);

            Task tb3 = createTaskWithTime(p1, "Onboarding empty states",
                    "Friendly copy and call-to-action when a Kanban column has no active tasks.",
                    backlogStatus, lowPriority, devUser, admin, fiveDaysAgo, 8, 0, "NONE", Set.of(frontendLabel));
            addSubtask(tb3, "Design illustrations for empty columns", false);

            Task t4 = createTaskWithTime(p1, "Board virtualisation",
                    "Render only visible cards to keep 1k+ tasks scrolling fast and smooth.",
                    todoStatus, mediumPriority, alexDev, admin, fiveDaysAgo, 20, 20, "NONE", Set.of(frontendLabel));
            addSubtask(t4, "Benchmark current board rendering speed", true);
            addSubtask(t4, "Windowing spike implementation", true);

            Task t5 = createTaskWithTime(p1, "Integrate SweetAlert2 Popups Across Workspace",
                    "Replace native browser alerts with custom animated SweetAlert2 popups.",
                    doneStatus, mediumPriority, devUser, admin, fiveDaysAgo, 8, 8, "NONE", Set.of(frontendLabel));

            Task t6 = createTaskWithTime(p3, "Biometric Auth Fingerprint & FaceID Integration",
                    "Native SDK wrapper for iOS TouchID and Android BiometricPrompt API.",
                    inProgressStatus, criticalPriority, alexDev, sarahPm, twoWeeksAgo, 32, 20, "PM_ESCALATION", Set.of(securityLabel, frontendLabel));

            Task t7 = createTaskWithTime(p4, "Train Predictive Delivery SLA Model",
                    "Build ML model using historical velocity data to predict milestone delays.",
                    inProgressStatus, highPriority, devUser, admin, fiveDaysAgo, 40, 15, "NONE", Set.of(aiLabel, backendLabel));

            log.info("Enterprise demo projects, SLA rules, and tasks seeded successfully!");
        }

        // Ensure key workspace users (dev_user, pm_user, admin) have active memberships in all workspace projects
        List<Project> allProjects = projectRepository.findAll();
        for (Project p : allProjects) {
            addMember(p, admin, adminRole);
            addMember(p, pmUser, pmRole);
            addMember(p, devUser, devRole);
        }

        log.info("Data initialization finished cleanly.");
    }

    private void seedEscalationRules() {
        if (escalationRuleRepository.count() == 0) {
            escalationRuleRepository.save(EscalationRule.builder()
                    .roleCode("DEVELOPER")
                    .warningDaysThreshold(3)
                    .escalationDaysThreshold(5)
                    .escalationLevel("DEVELOPER_WARNING")
                    .description("Warning notification for Developer when task reaches 3 days before SLA due date")
                    .build());

            escalationRuleRepository.save(EscalationRule.builder()
                    .roleCode("PROJECT_MANAGER")
                    .warningDaysThreshold(5)
                    .escalationDaysThreshold(7)
                    .escalationLevel("PM_ESCALATION")
                    .description("PM escalation notification when task exceeds SLA by 7 days")
                    .build());

            escalationRuleRepository.save(EscalationRule.builder()
                    .roleCode("ADMIN")
                    .warningDaysThreshold(10)
                    .escalationDaysThreshold(14)
                    .escalationLevel("ADMIN_CRITICAL_ESCALATION")
                    .description("Executive Admin Critical Escalation when task exceeds SLA by 14+ days")
                    .build());
            log.info("Task SLA Escalation rules seeded.");
        }
    }

    private Role getOrCreateRole(String code, String name, String description) {
        return roleRepository.findByCode(code).orElseGet(() ->
                roleRepository.save(Role.builder()
                        .code(code)
                        .name(name)
                        .description(description)
                        .build())
        );
    }

    private TaskStatus getOrCreateStatus(String code, String name, Integer position) {
        return taskStatusRepository.findFirstByProjectIsNullAndCode(code)
                .orElseGet(() -> taskStatusRepository.findFirstByCode(code)
                        .orElseGet(() -> taskStatusRepository.save(TaskStatus.builder()
                                .code(code)
                                .name(name)
                                .displayOrder(position)
                                .active(true)
                                .build())));
    }

    private Priority getOrCreatePriority(String code, String name, Integer level) {
        return priorityRepository.findByCode(code).orElseGet(() ->
                priorityRepository.save(Priority.builder()
                        .code(code)
                        .name(name)
                        .level(level)
                        .color(code.equals("CRITICAL") ? "#dc2626" : "#4f46e5")
                        .build())
        );
    }

    private Label getOrCreateLabel(String name, String color) {
        return labelRepository.findByName(name).orElseGet(() ->
                labelRepository.save(Label.builder()
                        .name(name)
                        .code(name)
                        .color(color)
                        .build())
        );
    }

    private User createUserIfAbsent(String username, String email, String password, String firstName, String lastName, Role role) {
        return userRepository.findByUsername(username).orElseGet(() ->
                userRepository.save(User.builder()
                        .username(username)
                        .email(email)
                        .passwordHash(passwordEncoder.encode(password))
                        .firstName(firstName)
                        .lastName(lastName)
                        .status("ACTIVE")
                        .roles(Set.of(role))
                        .build())
        );
    }

    private void addMember(Project project, User user, Role role) {
        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(project.getId(), user.getId())
                .orElseGet(() -> ProjectMember.builder()
                        .project(project)
                        .user(user)
                        .build());
        member.setProjectRole(role);
        member.setActive(true);
        projectMemberRepository.save(member);
    }

    private Task createTaskWithTime(Project project, String title, String description, TaskStatus status,
                                Priority priority, User assignee, User createdBy, Instant createdAt,
                                Integer estimatedHours, Integer loggedHours, String escalationLevel, Set<Label> labels) {
        Task task = Task.builder()
                .project(project)
                .title(title)
                .description(description)
                .status(status)
                .priority(priority)
                .assignee(assignee)
                .createdBy(createdBy)
                .startDate(createdAt)
                .endDate(createdAt.plus(Duration.ofDays(14)))
                .dueDate(createdAt.plus(Duration.ofDays(7)))
                .estimatedHours(estimatedHours)
                .loggedHours(loggedHours)
                .escalationLevel(escalationLevel)
                .labels(labels)
                .build();
        task.setCreatedAt(createdAt);
        return taskRepository.save(task);
    }

    private void addSubtask(Task task, String title, boolean completed) {
        Subtask subtask = Subtask.builder()
                .task(task)
                .title(title)
                .completed(completed)
                .build();
        subtaskRepository.save(subtask);
    }
}
