-- V5: Seed Initial Reference Data (Roles, Permissions, Services, Priorities, Global Task Statuses)

-- Seed Services
INSERT INTO services (name, code, description) VALUES
('User Management', 'USER_MANAGEMENT', 'Manage system users and access'),
('Project Management', 'PROJECT_MANAGEMENT', 'Manage workspace projects and settings'),
('Task Management', 'TASK_MANAGEMENT', 'Manage tasks, subtasks, and Kanban boards'),
('Reporting', 'REPORTING', 'Access analytics and reporting metrics'),
('AI Assistant', 'AI_ASSISTANT', 'Natural language query and action assistance'),
('Notifications', 'NOTIFICATIONS', 'User alert and notification delivery'),
('Audit', 'AUDIT', 'View application change logs');

-- Seed Permissions
INSERT INTO permissions (name, code, description) VALUES
('User Read', 'USER_READ', 'View user profiles'),
('User Create', 'USER_CREATE', 'Register new users'),
('User Update', 'USER_UPDATE', 'Modify user details'),
('User Delete', 'USER_DELETE', 'Deactivate or delete users'),

('Project Read', 'PROJECT_READ', 'View project details'),
('Project Create', 'PROJECT_CREATE', 'Create new projects'),
('Project Update', 'PROJECT_UPDATE', 'Modify project settings'),
('Project Delete', 'PROJECT_DELETE', 'Delete or archive projects'),

('Task Read', 'TASK_READ', 'View project tasks'),
('Task Create', 'TASK_CREATE', 'Create tasks'),
('Task Update', 'TASK_UPDATE', 'Modify task properties'),
('Task Delete', 'TASK_DELETE', 'Delete tasks'),

('Comment Create', 'COMMENT_CREATE', 'Add comments'),
('Comment Update', 'COMMENT_UPDATE', 'Edit owned comments'),
('Comment Delete', 'COMMENT_DELETE', 'Delete owned comments'),

('AI Query', 'AI_QUERY', 'Ask questions to AI assistant'),
('AI Action', 'AI_ACTION', 'Trigger AI workspace modifications');

-- Seed Roles
INSERT INTO roles (name, code, description) VALUES
('Administrator', 'ADMIN', 'Full system control across all domains'),
('Project Manager', 'PROJECT_MANAGER', 'Project leadership and member management'),
('Developer', 'DEVELOPER', 'Standard task execution and collaboration'),
('Viewer', 'VIEWER', 'Read-only visibility across assigned projects');

-- Seed Priorities
INSERT INTO priorities (name, code, level, color) VALUES
('Low', 'LOW', 10, '#64748b'),
('Medium', 'MEDIUM', 20, '#3b82f6'),
('High', 'HIGH', 30, '#f59e0b'),
('Critical', 'CRITICAL', 40, '#ef4444');

-- Seed Global Task Statuses (project_id IS NULL)
INSERT INTO task_statuses (project_id, name, code, display_order, color, capacity_limit) VALUES
(NULL, 'Backlog', 'BACKLOG', 1, '#94a3b8', 0),
(NULL, 'To Do', 'TODO', 2, '#3b82f6', 0),
(NULL, 'In Progress', 'IN_PROGRESS', 3, '#f59e0b', 3),
(NULL, 'Done', 'DONE', 4, '#10b981', 0);
