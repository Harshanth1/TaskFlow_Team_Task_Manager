import { useAuth } from '../../context/AuthContext';
import { Search } from 'lucide-react';
import './Layout.css';

export default function Header({ title, children }) {
  const { user } = useAuth();

  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="header-title">{title}</h1>
      </div>
      <div className="header-right">
        {children}
        <div className="header-user">
          <div className="avatar">{user?.name?.charAt(0).toUpperCase()}</div>
        </div>
      </div>
    </header>
  );
}
