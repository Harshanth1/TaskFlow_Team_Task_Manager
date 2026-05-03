import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Layout/Header';
import projectService from '../services/projectService';
import taskService from '../services/taskService';
import teamService from '../services/teamService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Plus, Trash2, Calendar } from 'lucide-react';
import './Pages.css';

const STATUS_COLUMNS = [
  { key: 'todo', label: 'To Do' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'review', label: 'Review' },
  { key: 'completed', label: 'Done' },
];

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', assignee: '', priority: 'medium', dueDate: '',
  });

  useEffect(() => { fetchProject(); }, [id]);

  const fetchProject = async () => {
    try {
      const res = await projectService.getById(id);
      setProject(res.data.data);
      setTasks(res.data.data.tasks || []);
      if (res.data.data.team?._id) {
        const teamRes = await teamService.getById(res.data.data.team._id);
        setTeamMembers(teamRes.data.data.members || []);
      }
    } catch (error) {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally { setLoading(false); }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...taskForm, project: id };
      if (!payload.assignee) delete payload.assignee;
      if (!payload.dueDate) delete payload.dueDate;
      await taskService.create(payload);
      toast.success('Task created!');
      setShowTaskModal(false);
      setTaskForm({ title: '', description: '', assignee: '', priority: 'medium', dueDate: '' });
      fetchProject();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create task');
    }
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

  const handleDeleteTask = async (taskId) => {
    try {
      await taskService.delete(taskId);
      toast.success('Task deleted');
      fetchProject();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!project) return null;

  return (
    <div className="fade-in">
      <Header title={project.name}>
        {user?.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>
            <Plus size={16} /> Add Task
          </button>
        )}
      </Header>

      <div className="surface project-detail-info">
        <div className="project-detail-row">
          {project.description && <p>{project.description}</p>}
          <div className="project-detail-meta">
            <span className={`badge status-${project.status}`}>{project.status}</span>
            {project.team && <span className="badge badge-info">{project.team.name}</span>}
            {project.deadline && (
              <span className="meta-item">
                <Calendar size={12} /> {new Date(project.deadline).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
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
                          <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteTask(task._id)}>
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

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Task</h2>
              <button className="modal-close" onClick={() => setShowTaskModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateTask} className="modal-form">
              <div className="input-group">
                <label>Title *</label>
                <input type="text" className="input-field" value={taskForm.title}
                  onChange={e => setTaskForm({...taskForm, title: e.target.value})}
                  placeholder="Task title" required />
              </div>
              <div className="input-group">
                <label>Description</label>
                <textarea className="input-field" value={taskForm.description}
                  onChange={e => setTaskForm({...taskForm, description: e.target.value})}
                  placeholder="Task description..." rows={3} />
              </div>
              <div className="form-row">
                <div className="input-group">
                  <label>Assignee</label>
                  <select className="select-field" value={taskForm.assignee}
                    onChange={e => setTaskForm({...taskForm, assignee: e.target.value})}>
                    <option value="">Unassigned</option>
                    {teamMembers.map(m => (
                      <option key={m.user?._id} value={m.user?._id}>{m.user?.name}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label>Priority</label>
                  <select className="select-field" value={taskForm.priority}
                    onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label>Due Date</label>
                <input type="date" className="input-field" value={taskForm.dueDate}
                  onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{width:'100%'}}>Create Task</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
