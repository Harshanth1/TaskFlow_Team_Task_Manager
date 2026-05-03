import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  Zap,
  Sun,
  Moon,
} from 'lucide-react';
import './Layout.css';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/projects',  icon: FolderKanban,    label: 'Projects' },
  { path: '/tasks',     icon: CheckSquare,     label: 'Tasks' },
  { path: '/team',      icon: Users,           label: 'Team' },
];

export default function Sidebar({ isOpen, onToggle }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">
            <Zap size={20} />
          </span>
          {isOpen && <span className="logo-text">TaskFlow</span>}
        </div>
        <button className="sidebar-toggle" onClick={onToggle} aria-label="Toggle sidebar">
          {isOpen ? <ChevronsLeft size={16} /> : <ChevronsRight size={16} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            <span className="sidebar-link-icon">
              <item.icon size={18} />
            </span>
            {isOpen && <span className="sidebar-link-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {/* Theme toggle */}
        <button className="sidebar-link sidebar-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          <span className="sidebar-link-icon">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </span>
          {isOpen && <span className="sidebar-link-label">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* User — always show avatar, show details only when open */}
        <div className={`sidebar-user ${isOpen ? '' : 'sidebar-user-collapsed'}`}>
          <div className="avatar avatar-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          {isOpen && (
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name}</span>
              <span className={`badge badge-${user?.role}`}>{user?.role}</span>
            </div>
          )}
        </div>

        <button className="sidebar-link sidebar-logout" onClick={handleLogout}>
          <span className="sidebar-link-icon">
            <LogOut size={18} />
          </span>
          {isOpen && <span className="sidebar-link-label">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
