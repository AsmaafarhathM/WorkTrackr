import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X, Search, Calendar, AlertTriangle, ArrowUpDown, ChevronDown } from 'lucide-react';

interface TaskFilterBarProps {
  projects?: Array<{ id: string; name: string }>;
  assignees?: Array<{ id: string; name: string }>;
  hasUnassigned?: boolean;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onToggleExpandAll?: () => void;
  isAllExpanded?: boolean;
}

export const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
  projects = [],
  assignees = [],
  hasUnassigned = false,
  sortBy,
  onSortChange,
  onToggleExpandAll,
  isAllExpanded = true,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get('status') || '';
  const priority = searchParams.get('priority') || '';
  const dueFrom = searchParams.get('dueFrom') || '';
  const dueTo = searchParams.get('dueTo') || '';
  const projectId = searchParams.get('projectId') || '';
  const assigneeId = searchParams.get('assignedToId') || '';
  const isOverdue = searchParams.get('isOverdue') || '';
  const search = searchParams.get('search') || '';

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters =
    Boolean(status) ||
    Boolean(priority) ||
    Boolean(dueFrom) ||
    Boolean(dueTo) ||
    Boolean(projectId) ||
    Boolean(assigneeId) ||
    Boolean(isOverdue) ||
    Boolean(search);

  return (
    <div className="filter-bar" id="task-filter-bar" style={{ marginBottom: '1.5rem' }}>
      {/* Top Section: Search Bar + Clear */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '0.75rem',
        }}
      >
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '0.9rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-subtle)',
            }}
          />
          <input
            id="filter-search-input"
            type="text"
            className="form-input"
            placeholder="Search tasks by title, ID (#1), description, project, or assignee..."
            style={{
              width: '100%',
              paddingLeft: '2.5rem',
              paddingRight: search ? '2.5rem' : '1rem',
              fontSize: '0.88rem',
              height: '42px',
            }}
            value={search}
            onChange={(e) => updateParam('search', e.target.value)}
          />
          {search && (
            <button
              type="button"
              id="clear-search-btn"
              onClick={() => updateParam('search', '')}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-subtle)',
                cursor: 'pointer',
                padding: '4px',
              }}
              title="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {onToggleExpandAll && (
          <button
            type="button"
            id="toggle-expand-all-btn"
            onClick={onToggleExpandAll}
            className="btn btn-secondary btn-sm"
            style={{ whiteSpace: 'nowrap', height: '42px' }}
          >
            <ChevronDown
              size={15}
              style={{
                transform: isAllExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s ease',
              }}
            />
            <span>{isAllExpanded ? 'Collapse All' : 'Expand All'}</span>
          </button>
        )}
      </div>

      {/* Bottom Section: Dynamic Dropdowns and Toggles */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div className="filter-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
            <Filter size={15} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Filter:</span>
          </div>

          {/* Project Filter */}
          {projects.length > 0 && (
            <select
              id="filter-project-select"
              className="form-select"
              value={projectId}
              onChange={(e) => updateParam('projectId', e.target.value)}
              title="Filter by Project"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          <select
            id="filter-status-select"
            className="form-select"
            value={status}
            onChange={(e) => updateParam('status', e.target.value)}
            title="Filter by Status"
          >
            <option value="">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DONE">Done</option>
          </select>

          {/* Priority Filter */}
          <select
            id="filter-priority-select"
            className="form-select"
            value={priority}
            onChange={(e) => updateParam('priority', e.target.value)}
            title="Filter by Priority"
          >
            <option value="">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Assignee Filter (Dynamic from real backend data) */}
          <select
            id="filter-assignee-select"
            className="form-select"
            value={assigneeId}
            onChange={(e) => updateParam('assignedToId', e.target.value)}
            title="Filter by Assignee"
          >
            <option value="">All Assignees</option>
            {assignees.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
            {hasUnassigned && <option value="unassigned">Unassigned</option>}
          </select>

          {/* Overdue Only Filter */}
          <button
            id="filter-overdue-toggle"
            type="button"
            onClick={() => updateParam('isOverdue', isOverdue === 'true' ? '' : 'true')}
            className={`btn btn-sm ${isOverdue === 'true' ? 'btn-danger' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <AlertTriangle size={13} />
            <span>Overdue Only</span>
          </button>

          {/* Date Range Inputs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Calendar size={13} style={{ color: 'var(--text-subtle)' }} />
            <input
              id="filter-due-from"
              type="date"
              className="form-input"
              style={{ padding: '0.35rem 0.55rem', fontSize: '0.78rem' }}
              value={dueFrom ? dueFrom.split('T')[0] : ''}
              onChange={(e) => updateParam('dueFrom', e.target.value ? `${e.target.value}T00:00:00Z` : '')}
              title="Due From"
            />
            <span style={{ color: 'var(--text-subtle)', fontSize: '0.78rem' }}>to</span>
            <input
              id="filter-due-to"
              type="date"
              className="form-input"
              style={{ padding: '0.35rem 0.55rem', fontSize: '0.78rem' }}
              value={dueTo ? dueTo.split('T')[0] : ''}
              onChange={(e) => updateParam('dueTo', e.target.value ? `${e.target.value}T23:59:59Z` : '')}
              title="Due To"
            />
          </div>
        </div>

        {/* Right Group: Sorting & Reset */}
        <div className="filter-group">
          {/* Sorting */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ArrowUpDown size={14} style={{ color: 'var(--text-subtle)' }} />
            <select
              id="sort-tasks-select"
              className="form-select"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              title="Sort Tasks"
            >
              <option value="dueDate">Sort: Due Date (Earliest)</option>
              <option value="priority">Sort: Priority (Highest)</option>
              <option value="taskNumber">Sort: Task ID (#)</option>
              <option value="title">Sort: Title (A-Z)</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              id="clear-filters-btn"
              type="button"
              onClick={clearFilters}
              className="btn btn-secondary btn-sm"
              style={{ color: '#f87171' }}
            >
              <X size={14} />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
