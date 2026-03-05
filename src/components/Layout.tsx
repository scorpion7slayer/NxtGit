import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  GitBranch,
  GitPullRequest,
  CircleDot,
  MessageSquare,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import logo from '../assets/logo.svg';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <aside className="w-56 flex flex-col border-r" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
        {/* App header */}
        <div className="px-4 pt-5 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="NxtGit" className="w-7 h-7 rounded-md" />
            <span className="font-semibold text-[15px]" style={{ color: 'var(--text-primary)' }}>
              NxtGit
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" end />
          <NavItem to="/repos" icon={GitBranch} label="Repositories" />
          <NavItem to="/issues" icon={CircleDot} label="Issues" />
          <NavItem to="/prs" icon={GitPullRequest} label="Pull Requests" />
          <NavItem to="/ai-review" icon={MessageSquare} label="AI Review" />
        </nav>

        {/* User section */}
        <div className="px-2 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2.5 px-2.5 mb-3">
            <img
              src={user?.avatar_url || 'https://github.com/github.png'}
              alt="Avatar"
              className="w-6 h-6 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {user?.login || 'User'}
              </p>
            </div>
          </div>

          <NavItem to="/settings" icon={Settings} label="Settings" />
          <button
            onClick={logout}
            className="nav-item w-full text-left"
            style={{ color: 'var(--text-secondary)' }}
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto" style={{ background: 'var(--bg-primary)' }}>
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
  end?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
  >
    <Icon className="w-4 h-4" />
    <span>{label}</span>
  </NavLink>
);

export default Layout;
