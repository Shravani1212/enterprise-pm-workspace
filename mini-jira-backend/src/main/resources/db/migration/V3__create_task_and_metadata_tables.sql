-- V3: Create Task & Dynamic Metadata Tables

CREATE TABLE IF NOT EXISTS task_statuses (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(50) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    color VARCHAR(20) NOT NULL DEFAULT '#64748b',
    capacity_limit INT NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uk_project_status_code UNIQUE (project_id, code)
);

CREATE TABLE IF NOT EXISTS priorities (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    level INT NOT NULL UNIQUE,
    color VARCHAR(20) NOT NULL DEFAULT '#64748b',
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS labels (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(50) NOT NULL,
    color VARCHAR(20) NOT NULL DEFAULT '#6366f1',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_project_label_code UNIQUE (project_id, code)
);

CREATE TABLE IF NOT EXISTS tasks (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status_id BIGINT NOT NULL REFERENCES task_statuses(id),
    priority_id BIGINT NOT NULL REFERENCES priorities(id),
    assignee_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_by BIGINT NOT NULL REFERENCES users(id),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS subtasks (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS task_labels (
    task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    label_id BIGINT NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, label_id)
);

CREATE TABLE IF NOT EXISTS task_dependencies (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type VARCHAR(20) NOT NULL DEFAULT 'FINISH_TO_START',
    CONSTRAINT uk_task_dependency UNIQUE (task_id, depends_on_task_id),
    CONSTRAINT chk_no_self_dependency CHECK (task_id <> depends_on_task_id)
);

CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_assignee ON tasks(project_id, assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_priority ON tasks(project_id, priority_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_task ON subtasks(task_id);
