import React, { useState } from 'react';
import { Key, Github, Bot, Bell, Shield } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const Settings: React.FC = () => {
  const { user } = useAuthStore();
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [autoReview, setAutoReview] = useState(false);

  return (
    <div className="p-8 max-w-3xl">
      <header className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Settings
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Configure your NxtGit preferences
        </p>
      </header>

      <div className="space-y-6">
        {/* GitHub Section */}
        <SettingSection icon={Github} title="GitHub Integration">
          <div className="flex items-center justify-between p-4 rounded-xl"
               style={{ background: 'var(--bg-tertiary)' }}>
            <div className="flex items-center gap-3">
              <img 
                src={user?.avatar_url || 'https://github.com/github.png'} 
                alt="GitHub" 
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  Connected as {user?.login || 'unknown'}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  Token expires in 29 days
                </p>
              </div>
            </div>
            <button className="btn-secondary text-sm">
              Disconnect
            </button>
          </div>
        </SettingSection>

        {/* OpenRouter Section */}
        <SettingSection icon={Bot} title="OpenRouter AI">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                API Key
              </label>
              <div className="relative">
                <Key className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2" 
                     style={{ color: 'var(--text-tertiary)' }} />
                <input 
                  type="password"
                  value={openRouterKey}
                  onChange={(e) => setOpenRouterKey(e.target.value)}
                  placeholder="sk-or-..."
                  className="input-glass pl-10 w-full"
                />
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                Your API key is stored locally and never shared.
              </p>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl"
                 style={{ background: 'var(--bg-tertiary)' }}>
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  Auto-review PRs
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Automatically review new pull requests
                </p>
              </div>
              <Toggle checked={autoReview} onChange={setAutoReview} />
            </div>
          </div>
        </SettingSection>

        {/* Notifications Section */}
        <SettingSection icon={Bell} title="Notifications">
          <div className="flex items-center justify-between p-4 rounded-xl"
               style={{ background: 'var(--bg-tertiary)' }}>
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                Push Notifications
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Get notified about PR reviews and comments
              </p>
            </div>
            <Toggle checked={notifications} onChange={setNotifications} />
          </div>
        </SettingSection>

        {/* Security Section */}
        <SettingSection icon={Shield} title="Security">
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors"
                    style={{ background: 'var(--bg-tertiary)' }}>
              <span style={{ color: 'var(--text-primary)' }}>Clear cache</span>
              <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>2.4 MB</span>
            </button>
            <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors"
                    style={{ background: 'var(--bg-tertiary)' }}>
              <span style={{ color: 'var(--text-primary)' }}>Reset all data</span>
              <span className="text-sm" style={{ color: 'var(--error)' }}>Destructive</span>
            </button>
          </div>
        </SettingSection>
      </div>

      <div className="mt-8 pt-8 border-t" style={{ borderColor: 'var(--border)' }}>
        <p className="text-sm text-center" style={{ color: 'var(--text-tertiary)' }}>
          NxtGit v0.1.0 • Built with Tauri & React
        </p>
      </div>
    </div>
  );
};

interface SettingSectionProps {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}

const SettingSection: React.FC<SettingSectionProps> = ({ icon: Icon, title, children }) => (
  <div>
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-5 h-5" style={{ color: 'var(--accent)' }} />
      <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h2>
    </div>
    {children}
  </div>
);

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const Toggle: React.FC<ToggleProps> = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    className="w-12 h-6 rounded-full transition-colors relative"
    style={{ background: checked ? 'var(--accent)' : 'var(--bg-tertiary)' }}
  >
    <div 
      className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all"
      style={{ left: checked ? 'calc(100% - 22px)' : '2px' }}
    />
  </button>
);

export default Settings;
