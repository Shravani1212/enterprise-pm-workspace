import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { useAuth } from '../../context/AuthContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  const { user } = useAuth();
  const isAdmin = user?.roles?.some((r) => r === 'ADMIN' || r === 'ROLE_ADMIN') ?? false;
  // PM can add tasks; Leads and Developers cannot
  const canAddTask = user?.roles?.some((r) =>
    r === 'PROJECT_MANAGER' || r === 'ROLE_PROJECT_MANAGER'
  ) ?? false;

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = useCallback(() => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    const t1 = setTimeout(checkScroll, 100);
    const t2 = setTimeout(checkScroll, 500);
    const t3 = setTimeout(checkScroll, 1000);
    
    window.addEventListener('resize', checkScroll);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', checkScroll);
    };
  }, [tasks, statuses, checkScroll]);

  const scrollLeftByColumn = () => {
    containerRef.current?.scrollBy({ left: -340, behavior: 'smooth' });
  };

  const scrollRightByColumn = () => {
    containerRef.current?.scrollBy({ left: 340, behavior: 'smooth' });
  };

  // Admins get no-op sensors (distance 99999 = effectively disabled)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: isAdmin ? 99999 : 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (isAdmin) return;
    const taskId = Number(event.active.id);
    const foundTask = tasks.find((t) => t.id === taskId);
    if (foundTask) {
      setActiveTask(foundTask);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    if (isAdmin) return; // Admins cannot move tasks

    const { active, over } = event;
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
    <div className="position-relative w-100 overflow-hidden" style={{ maxWidth: '100%' }}>
      {/* Slide Navigation Overlay Buttons */}
      {showLeftArrow && (
        <button
          type="button"
          onClick={scrollLeftByColumn}
          className="btn btn-light rounded-circle shadow-lg d-flex align-items-center justify-content-center hover-scale transition-all"
          style={{
            position: 'absolute',
            left: '10px',
            top: '40%',
            zIndex: 10,
            width: '42px',
            height: '42px',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
          }}
          title="Scroll Left"
        >
          <ChevronLeft style={{ width: '22px', height: '22px', color: '#4f46e5' }} />
        </button>
      )}

      {showRightArrow && (
        <button
          type="button"
          onClick={scrollRightByColumn}
          className="btn btn-light rounded-circle shadow-lg d-flex align-items-center justify-content-center hover-scale transition-all"
          style={{
            position: 'absolute',
            right: '10px',
            top: '40%',
            zIndex: 10,
            width: '42px',
            height: '42px',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
          }}
          title="Scroll Right"
        >
          <ChevronRight style={{ width: '22px', height: '22px', color: '#4f46e5' }} />
        </button>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          ref={containerRef}
          onScroll={checkScroll}
          className="d-flex gap-4 pb-4 pt-1 w-100 kanban-board-scroll-container"
          style={{ height: 'calc(100vh - 17rem)', maxWidth: '100%' }}
        >
          {statuses.map((status) => {
            const columnTasks = tasks.filter((t) => t.status.id === status.id);
            return (
              <KanbanColumn
                key={status.id}
                status={status}
                tasks={columnTasks}
                onTaskClick={onTaskClick}
                onAddTaskClick={canAddTask ? onAddTaskClick : undefined}
              />
            );
          })}
        </div>

        {!isAdmin && (
          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} /> : null}
          </DragOverlay>
        )}
      </DndContext>
    </div>
  );
};
