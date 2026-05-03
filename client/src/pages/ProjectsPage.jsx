import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Layout/Header';
import projectService from '../services/projectService';
import teamService from '../services/teamService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Plus, Trash2 } from 'lucide-react';
import './Pages.css';

export default function ProjectsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', description: '', deadline: '', team: '', color: '#6366f1',
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [projRes, teamRes] = await Promise.all([
        projectService.getAll(), teamService.getAll(),
      ]);
      setProjects(projRes.data.data);
      setTeams(teamRes.data.data);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.team) delete payload.team;
      if (!payload.deadline) delete payload.deadline;
      await projectService.create(payload);
      toast.success('Project created!');
      setShowModal(false);
      setFormData({ name: '', description: '', deadline: '', team: '', color: '#6366f1' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create project');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete project and all its tasks?')) return;
    try {
      await projectService.delete(id);
      toast.success('Project deleted');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      <Header title="Projects">
        {user?.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> New Project
          </button>
        )}
      </Header>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <h3>No projects yet</h3>
          <p>{user?.role === 'admin' ? 'Create your first project.' : 'No projects available.'}</p>
          {user?.role === 'admin' && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Project</button>
          )}
        </div>
      ) : (
        <div className="surface">
          <div className="projects-table">
            <div className="projects-table-header">
              <span>Project</span>
              <span>Status</span>
              <span>Team</span>
              <span>Deadline</span>
              <span>Progress</span>
              <span></span>
            </div>
            <div className="projects-table-body">
              {projects.map((project) => {
                const total = project.taskCounts?.total || 0;
                const completed = project.taskCounts?.completed || 0;
                const progress = total ? Math.round((completed / total) * 100) : 0;
                return (
                  <div key={project._id} className="project-table-row"
                    onClick={() => navigate(`/projects/${project._id}`)}>
                    <div className="project-name-cell">
                      <span className="project-color-dot" style={{ background: project.color || 'var(--accent)' }} />
                      <div>
                        <div className="project-name-text">{project.name}</div>
                        {project.description && <div className="project-desc-text">{project.description}</div>}
                      </div>
                    </div>
                    <div><span className={`badge status-${project.status}`}>{project.status}</span></div>
                    <div className="cell-text">{project.team?.name || '—'}</div>
                    <div className="cell-text">
                      {project.deadline ? new Date(project.deadline).toLocaleDateString() : '—'}
                    </div>
                    <div className="project-progress-cell">
                      <div className="project-progress-bar">
                        <div className="project-progress-fill"
                          style={{ width: `${progress}%`, background: project.color || 'var(--accent)' }} />
                      </div>
                      <span className="project-progress-text">{progress}%</span>
                    </div>
                    <div className="cell-actions">
                      {user?.role === 'admin' && (
                        <button className="btn btn-ghost btn-sm"
                          onClick={(e) => { e.stopPropagation(); handleDelete(project._id); }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Project</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} className="modal-form">
              <div className="input-group">
                <label>Project Name *</label>
                <input type="text" className="input-field" value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="My Awesome Project" required />
              </div>
              <div className="input-group">
                <label>Description</label>
                <textarea className="input-field" value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Description..." rows={3} />
              </div>
              <div className="form-row">
                <div className="input-group">
                  <label>Team</label>
                  <select className="select-field" value={formData.team}
                    onChange={e => setFormData({...formData, team: e.target.value})}>
                    <option value="">No team</option>
                    {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Deadline</label>
                  <input type="date" className="input-field" value={formData.deadline}
                    onChange={e => setFormData({...formData, deadline: e.target.value})} />
                </div>
              </div>
              <div className="input-group">
                <label>Color</label>
                <div className="color-picker">
                  {['#6366f1','#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899'].map(c => (
                    <button key={c} type="button"
                      className={`color-swatch ${formData.color === c ? 'active' : ''}`}
                      style={{ background: c }}
                      onClick={() => setFormData({...formData, color: c})} />
                  ))}
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{width:'100%'}}>
                Create Project
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
