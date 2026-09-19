import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { dashboardService } from '../services/dashboardService';
import { taskService } from '../services/taskService';
import { DashboardData, AdminDashboardData, PmDashboardData, DevDashboardData, Task, TaskStatus } from '../types';
import { StatCard } from '../components/StatCard';
import { ActivityFeed } from '../components/ActivityFeed';
import { TaskTable } from '../components/TaskTable';
import { TaskModal } from '../components/TaskModal';
import {
  FolderKanban,
  CheckSquare,
  AlertTriangle,
  Users,
  Calendar,
  Plus,
  PlayCircle,
  Building2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { activities, onlineCount } = useSocket();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [triggerMessage, setTriggerMessage] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      const data = await dashboardService.getDashboardData();
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user?.role]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await taskService.updateTaskStatus(taskId, newStatus);
      // Refresh dashboard metrics
      await fetchDashboard();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update status');
    }
  };

  const handleManualOverdueTrigger = async () => {
    try {
      const res = await taskService.triggerOverdueCheck();
      setTriggerMessage(res.message);
      await fetchDashboard();
      setTimeout(() => setTriggerMessage(null), 5000);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to trigger overdue check');
    }
  };

  if (loading || !dashboardData) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>
        <span className="pulsing-dot" style={{ display: 'inline-block', marginBottom: '1rem' }} />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div id="dashboard-page-container">
      {/* Top Welcome Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Welcome back, {user?.name}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            {user?.role === 'ADMIN' && 'System Overview & Global Project Health'}
            {user?.role === 'PROJECT_MANAGER' && 'Your Managed Client Projects & Workflows'}
            {user?.role === 'DEVELOPER' && 'Your Assigned Work Orders & Priority Queue'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Admin Overdue Job Manual Trigger Button */}
          {user?.role === 'ADMIN' && (
            <button
              id="admin-trigger-overdue-btn"
              onClick={handleManualOverdueTrigger}
              className="btn btn-secondary btn-sm"
              title="Manually trigger node-cron overdue task detector"
            >
              <PlayCircle size={15} style={{ color: '#f59e0b' }} />
              <span>Run Overdue Job</span>
            </button>
          )}

          {(user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER') && (
            <button
              id="dashboard-new-task-btn"
              onClick={() => setIsTaskModalOpen(true)}
              className="btn btn-primary btn-sm"
            >
              <Plus size={16} />
              <span>New Task</span>
            </button>
          )}
        </div>
      </div>

      {triggerMessage && (
        <div
          style={{
            padding: '0.875rem 1.25rem',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#fbbf24',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Sparkles size={16} />
          <span>{triggerMessage}</span>
        </div>
      )}

      {/* ========================================================== */}
      {/* 1. ADMIN DASHBOARD VIEW */}
      {/* ========================================================== */}
      {dashboardData.role === 'ADMIN' && (
        <div id="admin-dashboard-view">
          {/* Stat Cards */}
          <div className="dashboard-grid">
            <StatCard
              label="Total Projects"
              value={(dashboardData as AdminDashboardData).totalProjects}
              icon={<FolderKanban size={24} />}
              color="#6366f1"
              subtext="Across all clients"
            />
            <StatCard
              label="Total Tasks"
              value={(dashboardData as AdminDashboardData).totalTasks}
              icon={<CheckSquare size={24} />}
              color="#06b6d4"
              subtext={`${(dashboardData as AdminDashboardData).tasksByStatus.DONE || 0} completed`}
            />
            <StatCard
              label="Overdue Tasks"
              value={(dashboardData as AdminDashboardData).overdueTaskCount}
              icon={<AlertTriangle size={24} />}
              color="#ef4444"
              trend={
                (dashboardData as AdminDashboardData).overdueTaskCount > 0
                  ? 'Immediate action needed'
                  : 'On track'
              }
            />
            <StatCard
              label="Live Online Users"
              value={onlineCount}
              icon={<Users size={24} />}
              color="#10b981"
              subtext="Connected via WebSocket"
            />
          </div>

          {/* Tasks By Status Breakdown */}
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
              Tasks Status Distribution
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--status-todo-bg)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                }}
              >
                <div style={{ color: 'var(--status-todo)', fontSize: '0.8rem', fontWeight: 600 }}>
                  TO DO
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                  {(dashboardData as AdminDashboardData).tasksByStatus.TODO || 0}
                </div>
              </div>

              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--status-in-progress-bg)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                }}
              >
                <div style={{ color: 'var(--status-in-progress)', fontSize: '0.8rem', fontWeight: 600 }}>
                  IN PROGRESS
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                  {(dashboardData as AdminDashboardData).tasksByStatus.IN_PROGRESS || 0}
                </div>
              </div>

              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--status-in-review-bg)',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                }}
              >
                <div style={{ color: 'var(--status-in-review)', fontSize: '0.8rem', fontWeight: 600 }}>
                  IN REVIEW
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                  {(dashboardData as AdminDashboardData).tasksByStatus.IN_REVIEW || 0}
                </div>
              </div>

              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--status-done-bg)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}
              >
                <div style={{ color: 'var(--status-done)', fontSize: '0.8rem', fontWeight: 600 }}>
                  DONE
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                  {(dashboardData as AdminDashboardData).tasksByStatus.DONE || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Global Activity Feed */}
          <ActivityFeed
            activities={activities.length > 0 ? activities : (dashboardData as AdminDashboardData).recentActivity}
            title="Global Real-Time Activity Feed"
            maxItems={15}
          />
        </div>
      )}

      {/* ========================================================== */}
      {/* 2. PROJECT MANAGER DASHBOARD VIEW */}
      {/* ========================================================== */}
      {dashboardData.role === 'PROJECT_MANAGER' && (
        <div id="pm-dashboard-view">
          <div className="dashboard-grid">
            <StatCard
              label="My Managed Projects"
              value={(dashboardData as PmDashboardData).totalProjects}
              icon={<FolderKanban size={24} />}
              color="#a855f7"
              subtext="Created by you"
            />
            <StatCard
              label="Overdue Tasks"
              value={(dashboardData as PmDashboardData).overdueTaskCount}
              icon={<AlertTriangle size={24} />}
              color="#ef4444"
              trend={
                (dashboardData as PmDashboardData).overdueTaskCount > 0
                  ? 'Action required'
                  : 'All on time'
              }
            />
            <StatCard
              label="Critical Priority"
              value={(dashboardData as PmDashboardData).tasksByPriority.CRITICAL || 0}
              icon={<AlertTriangle size={24} />}
              color="#ef4444"
              subtext="Requires immediate focus"
            />
            <StatCard
              label="High Priority"
              value={(dashboardData as PmDashboardData).tasksByPriority.HIGH || 0}
              icon={<CheckSquare size={24} />}
              color="#f59e0b"
              subtext="In active sprints"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* My Projects Summary */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem' }}>
                My Projects Overview
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(dashboardData as PmDashboardData).projects.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-glass)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <Link
                        to={`/tasks?projectId=${p.id}`}
                        style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 600 }}
                      >
                        {p.name}
                      </Link>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
                        Client: {p.client?.name} ({p.client?.company})
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: 'rgba(99, 102, 241, 0.1)',
                        color: 'var(--primary)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-full)',
                      }}
                    >
                      {p._count?.tasks || 0} tasks
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem' }}>
                Upcoming Task Deadlines
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {(dashboardData as PmDashboardData).upcomingDueDates.length === 0 ? (
                  <p style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>No upcoming deadlines</p>
                ) : (
                  (dashboardData as PmDashboardData).upcomingDueDates.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 255, 255, 0.02)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ maxWidth: '240px' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t.title}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                          Assignee: {t.assignedTo?.name || 'Unassigned'}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 600 }}>
                        {new Date(t.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* PM Project Real-Time Activity Feed */}
          <ActivityFeed
            activities={activities.length > 0 ? activities : (dashboardData as PmDashboardData).recentActivity}
            title="My Projects Live Activity Feed"
            maxItems={15}
          />
        </div>
      )}

      {/* ========================================================== */}
      {/* 3. DEVELOPER DASHBOARD VIEW */}
      {/* ========================================================== */}
      {dashboardData.role === 'DEVELOPER' && (
        <div id="developer-dashboard-view">
          <div className="dashboard-grid">
            <StatCard
              label="Assigned Tasks"
              value={(dashboardData as DevDashboardData).totalAssigned}
              icon={<CheckSquare size={24} />}
              color="#38bdf8"
              subtext="Tasks in your backlog"
            />
            <StatCard
              label="In Progress"
              value={(dashboardData as DevDashboardData).tasksByStatus.IN_PROGRESS || 0}
              icon={<Clock size={24} />}
              color="#38bdf8"
              subtext="Active development"
            />
            <StatCard
              label="In Review"
              value={(dashboardData as DevDashboardData).tasksByStatus.IN_REVIEW || 0}
              icon={<Sparkles size={24} />}
              color="#a855f7"
              subtext="Awaiting PM sign-off"
            />
            <StatCard
              label="Overdue Tasks"
              value={(dashboardData as DevDashboardData).overdueTaskCount}
              icon={<AlertTriangle size={24} />}
              color="#ef4444"
              trend={
                (dashboardData as DevDashboardData).overdueTaskCount > 0
                  ? 'Past deadline'
                  : 'On schedule'
              }
            />
          </div>

          {/* Assigned Tasks Table */}
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>My Assigned Tasks</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Sorted by Priority & Due Date. Update status to move tasks through the pipeline.
                </p>
              </div>
            </div>

            <TaskTable
              tasks={(dashboardData as DevDashboardData).assignedTasks}
              onStatusChange={handleStatusChange}
            />
          </div>

          {/* Developer Real-Time Activity Feed */}
          <ActivityFeed
            activities={activities.length > 0 ? activities : (dashboardData as DevDashboardData).recentActivity}
            title="My Assigned Tasks Live Stream"
            maxItems={15}
          />
        </div>
      )}

      {/* Task Creation Modal */}
      {isTaskModalOpen && (
        <TaskModal
          onClose={() => setIsTaskModalOpen(false)}
          onSuccess={() => {
            setIsTaskModalOpen(false);
            fetchDashboard();
          }}
        />
      )}
    </div>
  );
};
