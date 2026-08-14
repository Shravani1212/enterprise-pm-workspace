import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { Task, TaskStatus } from '../../types';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';

interface KanbanBoardProps {
  statuses: TaskStatus[];
  tasks: Task[];
  onTaskMove: (taskId: number, targetStatusId: number) => void;
  onTaskClick?: (task: Task) => void;
  onAddTaskClick?: (statusId: number) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  statuses,
  tasks,
  onTaskMove,
  onTaskClick,
  onAddTaskClick,
}) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = Number(event.active.id);
    const foundTask = tasks.find((t) => t.id === taskId);
    if (foundTask) {
      setActiveTask(foundTask);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = Number(active.id);
    const overId = over.id.toString();

    // Check if dropped over a column status or over another task card
    let targetStatusId: number | null = null;

    const directStatusMatch = statuses.find((s) => s.id.toString() === overId);
    if (directStatusMatch) {
      targetStatusId = directStatusMatch.id;
    } else {
      const overTaskMatch = tasks.find((t) => t.id.toString() === overId);
      if (overTaskMatch) {
        targetStatusId = overTaskMatch.status.id;
      }
    }

    if (targetStatusId !== null) {
      const sourceTask = tasks.find((t) => t.id === taskId);
      if (sourceTask && sourceTask.status.id !== targetStatusId) {
        onTaskMove(taskId, targetStatusId);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="d-flex gap-4 overflow-auto pb-4 pt-1" style={{ height: 'calc(100vh - 13rem)', minHeight: '500px' }}>
        {statuses.map((status) => {
          const columnTasks = tasks.filter((t) => t.status.id === status.id);
          return (
            <KanbanColumn
              key={status.id}
              status={status}
              tasks={columnTasks}
              onTaskClick={onTaskClick}
              onAddTaskClick={onAddTaskClick}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
};
