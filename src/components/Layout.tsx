import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  GitBranch, 
  GitPullRequest, 
  Bot, 
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside className="w-64 glass m-4 mr-0 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #007AFF, #5856D6)' }}>
              <GitBranch className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                NxtGit
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>AI-powered</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/repos" icon={GitBranch} label="Repositories" />
          <NavItem to="/prs" icon={GitPullRequest} label="Pull Requests" />
          <NavItem to="/ai-review" icon={Bot} label="AI Review" />
        </nav>

        {/* User section */}
        <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3 mb-4 px-3">
            <img 
              src={user?.avatar_url || 'https://github.com/github.png'} 
              alt="Avatar" 
              className="w-8 h-8 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                {user?.name || user?.login || 'User'}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                @{user?.login || 'username'}
              </p>
            </div>
          </div>
          
          <NavLink 
            to="/settings" 
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </NavLink>
          
          <button 
            onClick={logout}
            className="sidebar-item w-full text-left"
            style={{ color: 'var(--error)' }}
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 m-4 ml-0 overflow-hidden">
        <div className="h-full glass-panel overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
  >
    <Icon className="w-5 h-5" />
    <span className="flex-1">{label}</span>
    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
  </NavLink>
);

export default Layout;
