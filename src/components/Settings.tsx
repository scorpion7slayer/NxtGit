import React, { useState, useEffect } from 'react';
import { Key } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { AI_PROVIDERS } from '../lib/ai';
import { LazyStore } from '@tauri-apps/plugin-store';

const settingsStore = new LazyStore('settings.json');

const Settings: React.FC = () => {
  const { user } = useAuthStore();
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [notifications, setNotifications] = useState(true);
  const [autoReview, setAutoReview] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    settingsStore.get<Record<string, string>>('apiKeys').then(keys => {
      if (keys) setApiKeys(keys);
    }).catch(() => {});
  }, []);

  const updateKey = (providerId: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [providerId]: value }));
  };

  const saveKeys = async () => {
    await settingsStore.set('apiKeys', apiKeys);
    await settingsStore.save();
    setSavedMsg('Saved');
    setTimeout(() => setSavedMsg(''), 2000);
  };

  return (
    <div className="p-6 max-w-3xl">
      <header className="mb-6">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Configure NxtGit
        </p>
      </header>

      <div className="space-y-6">
        {/* GitHub */}
        <Section title="GitHub">
          <div className="flex items-center justify-between p-3 rounded-lg"
               style={{ background: 'var(--bg-tertiary)' }}>
            <div className="flex items-center gap-3">
              <img
                src={user?.avatar_url || 'https://github.com/github.png'}
                alt=""
                className="w-8 h-8 rounded-full"
              />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {user?.login || 'unknown'}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Connected</p>
              </div>
            </div>
            <button className="btn-secondary text-xs px-3 py-1.5">Disconnect</button>
          </div>
        </Section>

        {/* AI Providers */}
        <Section title="AI Providers">
          <div className="space-y-3">
            {AI_PROVIDERS.map(provider => (
              <div key={provider.id} className="p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {provider.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {provider.description}
                    </p>
                  </div>
                  {apiKeys[provider.id] && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ background: 'rgba(52, 199, 89, 0.15)', color: 'var(--success)' }}>
                      configured
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Key className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2"
                       style={{ color: 'var(--text-tertiary)' }} />
                  <input
                    type="password"
                    value={apiKeys[provider.id] || ''}
                    onChange={e => updateKey(provider.id, e.target.value)}
                    placeholder={provider.placeholder}
                    className="input-glass pl-9 w-full text-sm py-2"
                  />
                </div>
              </div>
            ))}

            <div className="flex items-center gap-3">
              <button onClick={saveKeys} className="btn-primary text-sm px-4 py-2">
                Save API Keys
              </button>
              {savedMsg && (
                <span className="text-xs" style={{ color: 'var(--success)' }}>{savedMsg}</span>
              )}
            </div>

            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              API keys are stored locally and never shared.
            </p>
          </div>
        </Section>

        {/* Preferences */}
        <Section title="Preferences">
          <div className="space-y-2">
            <ToggleRow
              label="Push Notifications"
              description="Get notified about PR reviews and comments"
              checked={notifications}
              onChange={setNotifications}
            />
            <ToggleRow
              label="Auto-review PRs"
              description="Automatically review new pull requests with AI"
              checked={autoReview}
              onChange={setAutoReview}
            />
          </div>
        </Section>

        {/* Data */}
        <Section title="Data">
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between p-3 rounded-lg text-sm hover:bg-[var(--bg-tertiary)] transition-colors"
                    style={{ background: 'var(--bg-tertiary)' }}>
              <span style={{ color: 'var(--text-primary)' }}>Clear cache</span>
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-lg text-sm hover:bg-[var(--bg-tertiary)] transition-colors"
                    style={{ background: 'var(--bg-tertiary)' }}>
              <span style={{ color: 'var(--error)' }}>Reset all data</span>
            </button>
          </div>
        </Section>
      </div>

      <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
          NxtGit v0.1.0
        </p>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>{title}</h2>
    {children}
  </div>
);

const ToggleRow: React.FC<{
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
    <div>
      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{label}</p>
      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{description}</p>
    </div>
    <button
      onClick={() => onChange(!checked)}
      className="w-10 h-5 rounded-full transition-colors relative flex-shrink-0"
      style={{ background: checked ? 'var(--accent)' : 'var(--bg-secondary)' }}
    >
      <div
        className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all"
        style={{ left: checked ? 'calc(100% - 18px)' : '2px' }}
      />
    </button>
  </div>
);

export default Settings;
