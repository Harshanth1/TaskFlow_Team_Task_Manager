import { useState, useEffect } from 'react';
import Header from '../components/Layout/Header';
import taskService from '../services/taskService';
import projectService from '../services/projectService';
import { useAuth } from '../context/AuthContext';
import { ClipboardList, Loader, CheckCircle2, AlertTriangle } from 'lucide-react';
import './Pages.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, overdueRes, projectsRes] = await Promise.all([
        taskService.getStats(),
        taskService.getOverdue(),
        projectService.getAll(),
      ]);
      setStats(statsRes.data.data);
      setOverdueTasks(overdueRes.data.data);
      setRecentProjects(projectsRes.data.data.slice(0, 4));
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally { setLoading(false); }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  const statCards = [
    { label: 'Total Tasks', value: stats?.total || 0, icon: ClipboardList, color: 'var(--accent)' },
    { label: 'In Progress', value: stats?.inProgress || 0, icon: Loader, color: 'var(--color-info)' },
    { label: 'Completed', value: stats?.completed || 0, icon: CheckCircle2, color: 'var(--color-success)' },
    { label: 'Overdue', value: stats?.overdue || 0, icon: AlertTriangle, color: 'var(--color-danger)' },
  ];

  const total = stats?.total || 0;
  const completionRate = total ? Math.round((stats.completed / total) * 100) : 0;
  const todoPercent = total ? (stats.todo / total) * 100 : 0;
  const progressPercent = total ? (stats.inProgress / total) * 100 : 0;
  const reviewPercent = total ? (stats.review / total) * 100 : 0;
  const completedPercent = total ? (stats.completed / total) * 100 : 0;

  return (
    <div className="fade-in">
      <Header title="Dashboard" />

      <div className="greeting-section">
        <h2>Welcome back, {user?.name?.split(' ')[0]}</h2>
        <p>Here's what's happening with your projects today.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card surface" style={{ borderLeftColor: card.color }}>
            <div className="stat-card-icon" style={{ background: `${card.color}15`, color: card.color }}>
              <card.icon size={20} />
            </div>
            <div>
              <span className="stat-card-value">{card.value}</span>
              <span className="stat-card-label">{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Task Progress */}
        <div className="surface dashboard-section">
          <h3 className="section-title">Task Progress</h3>
          <div className="progress-percent-label">{completionRate}% complete</div>
          <div className="progress-percent-sub">{stats?.completed || 0} of {total} tasks done</div>
          <div className="progress-bar-container">
            <div className="progress-bar-track">
              {completedPercent > 0 && <div className="progress-bar-segment" style={{ width: `${completedPercent}%`, background: 'var(--color-success)' }} />}
              {reviewPercent > 0 && <div className="progress-bar-segment" style={{ width: `${reviewPercent}%`, background: 'var(--color-warning)' }} />}
              {progressPercent > 0 && <div className="progress-bar-segment" style={{ width: `${progressPercent}%`, background: 'var(--color-info)' }} />}
              {todoPercent > 0 && <div className="progress-bar-segment" style={{ width: `${todoPercent}%`, background: 'var(--bg-active)' }} />}
            </div>
          </div>
          <div className="progress-stats">
            <div className="progress-stat-item"><span className="progress-dot" style={{ background: 'var(--bg-active)' }} />Todo: {stats?.todo || 0}</div>
            <div className="progress-stat-item"><span className="progress-dot" style={{ background: 'var(--color-info)' }} />In Progress: {stats?.inProgress || 0}</div>
            <div className="progress-stat-item"><span className="progress-dot" style={{ background: 'var(--color-warning)' }} />Review: {stats?.review || 0}</div>
            <div className="progress-stat-item"><span className="progress-dot" style={{ background: 'var(--color-success)' }} />Completed: {stats?.completed || 0}</div>
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="surface dashboard-section">
          <h3 className="section-title">Overdue Tasks</h3>
          {overdueTasks.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-8) 0' }}>
              <p>No overdue tasks. Great job!</p>
            </div>
          ) : (
            <div className="overdue-list">
              {overdueTasks.slice(0, 5).map((task) => (
                <div key={task._id} className="overdue-item">
                  <div>
                    <span className="overdue-title">{task.title}</span>
                    <span className="overdue-project">{task.project?.name}</span>
                  </div>
                  <div className="overdue-meta">
                    <span className={`badge priority-${task.priority}`}>{task.priority}</span>
                    <span className="overdue-date">{new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Projects */}
      <div className="surface dashboard-section" style={{ marginTop: 'var(--space-4)' }}>
        <h3 className="section-title">Recent Projects</h3>
        {recentProjects.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-8) 0' }}>
            <p>No projects yet. {user?.role === 'admin' ? 'Create your first project!' : 'Wait for an admin to create projects.'}</p>
          </div>
        ) : (
          <div className="projects-mini-grid">
            {recentProjects.map((project) => {
              const t = project.taskCounts?.total || 0;
              const c = project.taskCounts?.completed || 0;
              const p = t ? Math.round((c / t) * 100) : 0;
              return (
                <div key={project._id} className="project-mini-card">
                  <div className="project-mini-color" style={{ background: project.color || 'var(--accent)' }} />
                  <div className="project-mini-info">
                    <h4>{project.name}</h4>
                    <span className="project-mini-tasks">{c}/{t} tasks</span>
                    <div className="progress-bar-mini">
                      <div className="progress-bar-fill" style={{ width: `${p}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
