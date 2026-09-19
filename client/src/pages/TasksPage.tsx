import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { taskService } from '../services/taskService';
import { projectService } from '../services/projectService';
import { Task, Project, TaskStatus, TaskPriority, TaskFilters } from '../types';
import { TaskFilterBar } from '../components/TaskFilterBar';
import { AssigneeGroup } from '../components/AssigneeGroup';
import { TaskModal } from '../components/TaskModal';
import { Plus, AlertCircle, RotateCcw, CheckSquare, SearchX } from 'lucide-react';

export const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskToEdit, setSelectedTaskToEdit] = useState<Task | null>(null);

  // Sorting state (default to due date)
  const [sortBy, setSortBy] = useState<string>('dueDate');

  // Collapsible groups state: mapping assigneeKey -> boolean (true = expanded)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Parse URL query filters
  const statusFilter = searchParams.get('status') || '';
  const priorityFilter = searchParams.get('priority') || '';
  const dueFromFilter = searchParams.get('dueFrom') || '';
  const dueToFilter = searchParams.get('dueTo') || '';
  const projectFilter = searchParams.get('projectId') || '';
  const assigneeFilter = searchParams.get('assignedToId') || '';
  const overdueFilter = searchParams.get('isOverdue') === 'true';
  const searchFilter = (searchParams.get('search') || '').trim().toLowerCase();

  // 1. Fetch metadata and tasks
  const fetchAllData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      // Fetch all tasks scoped to current user role from backend
      const [tasksData, projectsData] = await Promise.all([
        taskService.getTasks(),
        projectService.getProjects(),
      ]);
      setTasks(tasksData);
      setProjects(projectsData);
    } catch (err: any) {
      console.error('Failed to fetch tasks:', err);
      setErrorMessage(err.response?.data?.error?.message || 'Unable to load tasks from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // 2. Extract unique assignees dynamically from actual task data
  const { assigneesList, hasUnassignedTasks } = useMemo(() => {
    const uniqueMap = new Map<string, { id: string; name: string }>();
    let unassigned = false;

    tasks.forEach((t) => {
      if (t.assignedTo) {
        uniqueMap.set(t.assignedTo.id, {
          id: t.assignedTo.id,
          name: t.assignedTo.name,
        });
      } else {
        unassigned = true;
      }
    });

    return {
      assigneesList: Array.from(uniqueMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
      hasUnassignedTasks: unassigned,
    };
  }, [tasks]);

  // 3. Filter tasks with combined multi-attribute criteria
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Status filter
      if (statusFilter && t.status !== statusFilter) return false;

      // Priority filter
      if (priorityFilter && t.priority !== priorityFilter) return false;

      // Project filter
      if (projectFilter && t.projectId !== projectFilter) return false;

      // Assignee filter
      if (assigneeFilter) {
        if (assigneeFilter === 'unassigned') {
          if (t.assignedToId) return false;
        } else if (t.assignedToId !== assigneeFilter) {
          return false;
        }
      }

      // Overdue filter
      if (overdueFilter) {
        const isPastDue = new Date(t.dueDate) < new Date() && t.status !== 'DONE';
        if (!t.isOverdue && !isPastDue) return false;
      }

      // Date range filter
      if (dueFromFilter) {
        if (new Date(t.dueDate) < new Date(dueFromFilter)) return false;
      }
      if (dueToFilter) {
        if (new Date(t.dueDate) > new Date(dueToFilter)) return false;
      }

      // Search keyword filter (title, ID, description, project, assignee)
      if (searchFilter) {
        const taskNumberStr = `#${t.taskNumber}`.toLowerCase();
        const rawNumberStr = String(t.taskNumber);
        const titleMatches = t.title.toLowerCase().includes(searchFilter);
        const idMatches = taskNumberStr.includes(searchFilter) || rawNumberStr === searchFilter;
        const descMatches = (t.description || '').toLowerCase().includes(searchFilter);
        const projectMatches = (t.project?.name || '').toLowerCase().includes(searchFilter);
        const assigneeMatches = (t.assignedTo?.name || 'unassigned').toLowerCase().includes(searchFilter);

        if (!titleMatches && !idMatches && !descMatches && !projectMatches && !assigneeMatches) {
          return false;
        }
      }

      return true;
    });
  }, [
    tasks,
    statusFilter,
    priorityFilter,
    projectFilter,
    assigneeFilter,
    overdueFilter,
    dueFromFilter,
    dueToFilter,
    searchFilter,
  ]);

  // 4. Sort tasks according to selected sorting option
  const sortedTasks = useMemo(() => {
    const list = [...filteredTasks];

    const priorityWeight: Record<TaskPriority, number> = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    list.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        case 'taskNumber':
          return a.taskNumber - b.taskNumber;
        case 'title':
          return a.title.localeCompare(b.title);
        case 'dueDate':
        default:
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
    });

    return list;
  }, [filteredTasks, sortBy]);

  // 5. Dynamically group sorted tasks by Assignee
  const groupedAssignees = useMemo(() => {
    const groupsMap = new Map<
      string,
      {
        assigneeKey: string;
        assignee: { id: string; name: string; email?: string } | null;
        tasks: Task[];
      }
    >();

    sortedTasks.forEach((task) => {
      const key = task.assignedTo ? task.assignedTo.id : 'unassigned';
      const existing = groupsMap.get(key);

      if (existing) {
        existing.tasks.push(task);
      } else {
        groupsMap.set(key, {
          assigneeKey: key,
          assignee: task.assignedTo
            ? {
                id: task.assignedTo.id,
                name: task.assignedTo.name,
                email: task.assignedTo.email,
              }
            : null,
          tasks: [task],
        });
      }
    });

    // Return list with assigned users first (sorted alphabetically by name), unassigned last
    const result = Array.from(groupsMap.values());
    result.sort((a, b) => {
      if (a.assigneeKey === 'unassigned') return 1;
      if (b.assigneeKey === 'unassigned') return -1;
      return (a.assignee?.name || '').localeCompare(b.assignee?.name || '');
    });

    return result;
  }, [sortedTasks]);

  // Toggle single group expand/collapse
  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      // Default to expanded if not set
      [key]: prev[key] !== undefined ? !prev[key] : false,
    }));
  };

  // Toggle Expand All / Collapse All
  const isAllExpanded = useMemo(() => {
    if (groupedAssignees.length === 0) return true;
    return groupedAssignees.every((g) => expandedGroups[g.assigneeKey] !== false);
  }, [groupedAssignees, expandedGroups]);

  const toggleExpandAll = () => {
    const nextState = !isAllExpanded;
    const newExpanded: Record<string, boolean> = {};
    groupedAssignees.forEach((g) => {
      newExpanded[g.assigneeKey] = nextState;
    });
    setExpandedGroups(newExpanded);
  };

  // Handle task status transition with immediate UI update & rollback on error
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const previousTasks = [...tasks];

    // Optimistic UI update: change status immediately and clear overdue flag if DONE
    setTasks((current) =>
      current.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: newStatus,
              isOverdue: newStatus === 'DONE' ? false : t.isOverdue,
            }
          : t
      )
    );

    try {
      await taskService.updateTaskStatus(taskId, newStatus);
    } catch (err: any) {
      // Rollback on failure
      setTasks(previousTasks);
      alert(err.response?.data?.error?.message || 'Unable to update task status.');
    }
  };

  const handleEditTask = (task: Task) => {
    if (user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER') {
      setSelectedTaskToEdit(task);
      setIsModalOpen(true);
    }
  };

  const canCreateTask = user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER';

  return (
    <div id="tasks-page-container">
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Tasks
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Jira-inspired task board grouped by assignee with live status management.
          </p>
        </div>

        {canCreateTask && (
          <button
            id="create-task-btn"
            onClick={() => {
              setSelectedTaskToEdit(null);
              setIsModalOpen(true);
            }}
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>Create Task</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <TaskFilterBar
        projects={projects}
        assignees={assigneesList}
        hasUnassigned={hasUnassignedTasks}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onToggleExpandAll={toggleExpandAll}
        isAllExpanded={isAllExpanded}
      />

      {/* Main Content Area */}
      {loading ? (
        /* Loading Skeleton State */
        <div id="tasks-loading-skeleton" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="glass-card"
              style={{
                height: '110px',
                animation: 'pulse 1.5s infinite ease-in-out',
                opacity: 0.6,
                borderRadius: 'var(--radius-lg)',
              }}
            />
          ))}
        </div>
      ) : errorMessage ? (
        /* Error State with Retry Button */
        <div
          id="tasks-error-state"
          className="glass-card"
          style={{
            textAlign: 'center',
            padding: '3.5rem 1.5rem',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <AlertCircle size={36} style={{ margin: '0 auto 0.75rem', color: '#f87171' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f87171' }}>
            Unable to load tasks
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {errorMessage}
          </p>
          <button
            onClick={fetchAllData}
            className="btn btn-secondary btn-sm"
            style={{ marginTop: '1.25rem' }}
          >
            <RotateCcw size={14} />
            <span>Retry</span>
          </button>
        </div>
      ) : groupedAssignees.length === 0 ? (
        /* Empty States */
        tasks.length === 0 ? (
          /* Zero tasks exist overall */
          <div
            id="tasks-zero-state"
            className="glass-card"
            style={{ textAlign: 'center', padding: '4rem 1.5rem', color: 'var(--text-subtle)' }}
          >
            <CheckSquare size={38} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              No tasks found
            </h3>
            <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
              {canCreateTask
                ? 'Create your first task to start organizing client deliverables.'
                : 'You currently have no tasks assigned.'}
            </p>
            {canCreateTask && (
              <button
                onClick={() => {
                  setSelectedTaskToEdit(null);
                  setIsModalOpen(true);
                }}
                className="btn btn-primary btn-sm"
                style={{ marginTop: '1.25rem' }}
              >
                <Plus size={15} />
                <span>Create your first task</span>
              </button>
            )}
          </div>
        ) : (
          /* Filtered down to 0 */
          <div
            id="tasks-no-match-state"
            className="glass-card"
            style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-subtle)' }}
          >
            <SearchX size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
              No tasks match your search or filters
            </h3>
            <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Try adjusting your filter options or clearing search keywords.
            </p>
            <button
              onClick={() => setSearchParams(new URLSearchParams())}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '1.25rem' }}
            >
              <span>Clear All Filters</span>
            </button>
          </div>
        )
      ) : (
        /* Assignee-Grouped Jira Task Sections */
        <div id="assignee-grouped-tasks-list">
          {groupedAssignees.map((group) => {
            const isExpanded = expandedGroups[group.assigneeKey] !== false; // Default expanded

            return (
              <AssigneeGroup
                key={group.assigneeKey}
                assigneeKey={group.assigneeKey}
                assignee={group.assignee}
                tasks={group.tasks}
                isExpanded={isExpanded}
                onToggle={() => toggleGroup(group.assigneeKey)}
                onStatusChange={handleStatusChange}
                onEditTask={handleEditTask}
              />
            );
          })}
        </div>
      )}

      {/* Task Creation & Editing Modal */}
      {isModalOpen && (
        <TaskModal
          taskToEdit={selectedTaskToEdit}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTaskToEdit(null);
          }}
          onSuccess={(savedTask) => {
            setIsModalOpen(false);
            setSelectedTaskToEdit(null);
            // Seamlessly update tasks list without full reload
            setTasks((prev) => {
              const idx = prev.findIndex((t) => t.id === savedTask.id);
              if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = savedTask;
                return updated;
              }
              return [savedTask, ...prev];
            });
          }}
        />
      )}
    </div>
  );
};
