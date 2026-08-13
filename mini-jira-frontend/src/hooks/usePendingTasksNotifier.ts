import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import { ApiResponse, TaskResponse } from '../types';
import Swal from 'sweetalert2';

export const usePendingTasksNotifier = () => {
  const { user } = useAuth();
  const notifiedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || notifiedRef.current === user.username) return;

    const checkPendingTasks = async () => {
      try {
        const res = await apiClient.get<ApiResponse<TaskResponse[]>>('/tasks');
        if (!res.data.success || !res.data.data) return;

        const allTasks = res.data.data;
        const userRoles = user.roles || [];
        const isDeveloper = userRoles.includes('DEVELOPER');
        const isPM = userRoles.includes('PROJECT_MANAGER');
        const isAdmin = userRoles.includes('ADMIN');

        notifiedRef.current = user.username;

        // 1. ADMIN ESCALATION NOTIFICATION
        if (isAdmin) {
          const escalatedTasks = allTasks.filter(
            (t) => t.escalationLevel === 'ADMIN_CRITICAL_ESCALATION' || (t.priority?.code === 'CRITICAL' && t.status?.code !== 'DONE')
          );

          if (escalatedTasks.length > 0) {
            const taskItems = escalatedTasks
              .slice(0, 3)
              .map(
                (t) =>
                  `<li style="margin-bottom: 6px; text-align: left; font-size: 13px;">🚨 <strong>${t.title}</strong> (Assigned: @${t.assignee?.username || 'Unassigned'})</li>`
              )
              .join('');

            Swal.fire({
              icon: 'error',
              title: `🚨 Executive Admin Escalation Alert`,
              html: `
                <div style="font-size: 14px; color: #475569; margin-bottom: 12px;">
                  <strong style="color: #dc2626;">${escalatedTasks.length} critical task(s)</strong> have breached SLA parameters and require executive intervention:
                </div>
                <ul style="background: #fff1f2; padding: 12px 16px; border-radius: 12px; border: 1px solid #fecdd3; list-style: none;">
                  ${taskItems}
                </ul>
              `,
              confirmButtonText: 'Review System Escalations',
              confirmButtonColor: '#e11d48',
              customClass: {
                popup: 'rounded-2xl border border-rose-200 shadow-2xl',
                title: 'text-lg font-bold text-slate-900',
                confirmButton: 'px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md',
              },
            });
            return;
          }
        }

        // 2. PROJECT MANAGER ESCALATION NOTIFICATION
        if (isPM) {
          const pmOverdueTasks = allTasks.filter(
            (t) =>
              (t.escalationLevel === 'PM_ESCALATION' || t.escalationLevel === 'ADMIN_CRITICAL_ESCALATION') &&
              t.status?.code !== 'DONE'
          );

          if (pmOverdueTasks.length > 0) {
            const taskItems = pmOverdueTasks
              .slice(0, 3)
              .map(
                (t) =>
                  `<li style="margin-bottom: 6px; text-align: left; font-size: 13px;">⚠️ <strong>${t.title}</strong> — @${t.assignee?.username || 'Unassigned'} (${t.status?.name})</li>`
              )
              .join('');

            Swal.fire({
              icon: 'warning',
              title: `📋 PM Team SLA Escalation`,
              html: `
                <div style="font-size: 14px; color: #475569; margin-bottom: 12px;">
                  <strong style="color: #f59e0b;">${pmOverdueTasks.length} team task(s)</strong> have exceeded SLA thresholds and require manager review:
                </div>
                <ul style="background: #fffbeb; padding: 12px 16px; border-radius: 12px; border: 1px solid #fef3c7; list-style: none;">
                  ${taskItems}
                </ul>
              `,
              confirmButtonText: 'Manage Team Tasks',
              confirmButtonColor: '#f59e0b',
              customClass: {
                popup: 'rounded-2xl border border-amber-200 shadow-2xl',
                title: 'text-lg font-bold text-slate-900',
                confirmButton: 'px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md',
              },
            });
            return;
          }
        }

        // 3. DEVELOPER PERSONAL TASK NOTIFICATION
        if (isDeveloper) {
          const devTasks = allTasks.filter(
            (t) => t.assignee?.id === user.id && t.status?.code !== 'DONE'
          );

          if (devTasks.length > 0) {
            const taskItems = devTasks
              .slice(0, 3)
              .map(
                (t) =>
                  `<li style="margin-bottom: 6px; text-align: left; font-size: 13px;">⏱️ <strong>${t.title}</strong> (${t.loggedHours || 0}h / ${t.estimatedHours || 8}h est)</li>`
              )
              .join('');

            Swal.fire({
              icon: 'info',
              title: `💻 Developer SLA Task Timers`,
              html: `
                <div style="font-size: 14px; color: #475569; margin-bottom: 12px;">
                  You have <strong style="color: #4f46e5;">${devTasks.length} assigned task(s)</strong> currently in progress:
                </div>
                <ul style="background: #f8fafc; padding: 12px 16px; border-radius: 12px; border: 1px solid #e2e8f0; list-style: none;">
                  ${taskItems}
                </ul>
              `,
              confirmButtonText: 'Open Sprint Board',
              confirmButtonColor: '#4f46e5',
              customClass: {
                popup: 'rounded-2xl border border-slate-200 shadow-2xl',
                title: 'text-lg font-bold text-slate-900',
                confirmButton: 'px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md',
              },
            });
          }
        }
      } catch (err) {
        // Silently catch error
      }
    };

    checkPendingTasks();
  }, [user]);
};
