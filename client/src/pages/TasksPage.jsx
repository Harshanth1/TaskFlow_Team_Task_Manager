import { useState, useEffect } from 'react';
import Header from '../components/Layout/Header';
import taskService from '../services/taskService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { List, LayoutGrid, Trash2, Calendar } from 'lucide-react';
import './Pages.css';

const STATUS_COLUMNS = [
  { key: 'todo', label: 'To Do' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'review', label: 'Review' },
  { key: 'completed', label: 'Done' },
];

export default function TasksPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });

  useEffect(() => { fetchTasks(); }, [filters]);

  const fetchTasks = async () => {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.search) params.search = filters.search;
      const res = await taskService.getAll(params);
      setTasks(res.data.data);
    } catch (error) { console.error('Error fetching tasks:', error); }
    finally { setLoading(false); }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskService.update(taskId, { status: newStatus });
      setTasks(tasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
      toast.success('Status updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update');
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await taskService.delete(taskId);
      toast.success('Task deleted');
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      <Header title="Tasks">
        <div className="view-toggle">
          <button className={`view-toggle-btn ${view === 'list' ? 'active' : ''}`}
            onClick={() => setView('list')}><List size={14} /> List</button>
          <button className={`view-toggle-btn ${view === 'kanban' ? 'active' : ''}`}
            onClick={() => setView('kanban')}><LayoutGrid size={14} /> Board</button>
        </div>
      </Header>

      <div className="filter-bar">
        <input type="text" className="input-field" placeholder="Search tasks..."
          value={filters.search}
          onChange={e => setFilters({...filters, search: e.target.value})} />
        <select className="select-field" value={filters.status}
          onChange={e => setFilters({...filters, status: e.target.value})}>
          <option value="">All Status</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="review">Review</option>
          <option value="completed">Completed</option>
        </select>
        <select className="select-field" value={filters.priority}
          onChange={e => setFilters({...filters, priority: e.target.value})}>
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        {(filters.status || filters.priority || filters.search) && (
          <button className="btn btn-ghost btn-sm"
            onClick={() => setFilters({ status: '', priority: '', search: '' })}>
            Clear
          </button>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✓</div>
          <h3>No tasks found</h3>
          <p>{filters.status || filters.priority || filters.search
            ? 'Try adjusting your filters.'
            : 'Tasks will appear here once created in a project.'}</p>
        </div>
      ) : view === 'list' ? (
        <div className="surface">
          <div className="task-table">
            <div className="task-table-header">
              <span>Task</span>
              <span>Project</span>
              <span>Assignee</span>
              <span>Priority</span>
              <span>Status</span>
              <span>Due Date</span>
              <span></span>
            </div>
            <div className="task-table-body">
              {tasks.map(task => (
                <div key={task._id} className="task-table-row">
                  <div className="task-title-cell">
                    <span className="task-color-bar"
                      style={{ background: task.project?.color || 'var(--accent)' }} />
                    <span className="task-title-text">{task.title}</span>
                  </div>
                  <div className="cell-text">{task.project?.name || '—'}</div>
                  <div className="cell-text">
                    {task.assignee ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="avatar avatar-sm">{task.assignee.name?.charAt(0)}</span>
                        {task.assignee.name}
                      </span>
                    ) : '—'}
                  </div>
                  <div><span className={`badge priority-${task.priority}`}>{task.priority}</span></div>
                  <div>
                    <select className="select-field task-status-select" value={task.status}
                      onChange={e => handleStatusChange(task._id, e.target.value)}>
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div className={`cell-text ${task.isOverdue ? 'text-danger' : ''}`}>
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                  </div>
                  <div className="cell-actions">
                    {user?.role === 'admin' && (
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(task._id)}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="kanban-board">
          {STATUS_COLUMNS.map((col) => {
            const colTasks = tasks.filter(t => t.status === col.key);
            return (
              <div key={col.key} className="kanban-column">
                <div className="kanban-column-header">
                  <span>{col.label}</span>
                  <span className="kanban-count">{colTasks.length}</span>
                </div>
                <div className="kanban-cards">
                  {colTasks.map((task) => (
                    <div key={task._id} className="kanban-card">
                      <div className="kanban-card-header">
                        <h4>{task.title}</h4>
                        <span className={`badge priority-${task.priority}`}>{task.priority}</span>
                      </div>
                      {task.description && <p className="kanban-card-desc">{task.description}</p>}
                      <div className="kanban-card-footer">
                        <div className="kanban-card-meta">
                          {task.assignee && (
                            <div className="avatar avatar-sm">{task.assignee.name?.charAt(0)}</div>
                          )}
                          {task.dueDate && (
                            <span className={`meta-item ${task.isOverdue ? 'text-danger' : ''}`}>
                              <Calendar size={12} /> {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="kanban-card-actions">
                          <select className="select-field task-status-select" value={task.status}
                            onChange={(e) => handleStatusChange(task._id, e.target.value)}>
                            {STATUS_COLUMNS.map(s => (
                              <option key={s.key} value={s.key}>{s.label}</option>
                            ))}
                          </select>
                          {user?.role === 'admin' && (
                            <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(task._id)}>
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {colTasks.length === 0 && <div className="kanban-empty">No tasks</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
