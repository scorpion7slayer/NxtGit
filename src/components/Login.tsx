import React, { useState, useRef } from 'react';
import { Github, AlertCircle, Copy, CheckCircle } from 'lucide-react';
import { open } from '@tauri-apps/plugin-shell';
import { fetch } from '@tauri-apps/plugin-http';
import { useAuthStore } from '../stores/authStore';
import logo from '../assets/logo.svg';

const CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || '';

interface DeviceCodeData {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [deviceData, setDeviceData] = useState<DeviceCodeData | null>(null);
  const [copied, setCopied] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { setAuth } = useAuthStore();

  const stopPolling = () => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const pollForToken = async (deviceCode: string, interval: number, expiresAt: number) => {
    if (Date.now() > expiresAt) {
      setError('Authorization expired. Please try again.');
      setIsLoading(false);
      setDeviceData(null);
      return;
    }

    try {
      setStatus('Polling GitHub...');
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          device_code: deviceCode,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        }),
      });

      const text = await tokenResponse.text();
      let tokenData: Record<string, string>;
      try {
        tokenData = JSON.parse(text);
      } catch {
        pollingRef.current = setTimeout(() => pollForToken(deviceCode, interval, expiresAt), interval);
        return;
      }

      if (tokenData.error === 'authorization_pending' || tokenData.error === 'slow_down') {
        const nextInterval = tokenData.error === 'slow_down' ? interval + 5000 : interval;
        setStatus('Waiting for you to authorize on GitHub...');
        pollingRef.current = setTimeout(() => pollForToken(deviceCode, nextInterval, expiresAt), nextInterval);
        return;
      }

      if (tokenData.error) {
        stopPolling();
        setError(tokenData.error_description || tokenData.error);
        setIsLoading(false);
        setDeviceData(null);
        return;
      }

      if (tokenData.access_token) {
        setStatus('Fetching your profile...');
        const userResponse = await fetch('https://api.github.com/user', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'NxtGit/0.1.0',
          },
        });

        if (!userResponse.ok) {
          setError(`Failed to fetch profile: ${userResponse.status}`);
          setIsLoading(false);
          setDeviceData(null);
          return;
        }

        const user = await userResponse.json();
        await setAuth(tokenData.access_token, {
          id: user.id,
          login: user.login,
          avatar_url: user.avatar_url,
          name: user.name || user.login,
          email: user.email || '',
        });
        return;
      }

      pollingRef.current = setTimeout(() => pollForToken(deviceCode, interval, expiresAt), interval);
    } catch (e) {
      pollingRef.current = setTimeout(() => pollForToken(deviceCode, interval, expiresAt), interval);
    }
  };

  const handleGitHubLogin = async () => {
    if (!CLIENT_ID) {
      setError('GitHub Client ID not configured. Add VITE_GITHUB_CLIENT_ID to .env');
      return;
    }

    setIsLoading(true);
    setError('');
    setStatus('');
    setDeviceData(null);

    try {
      const response = await fetch('https://github.com/login/device/code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          scope: 'repo read:user read:org',
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        setError(`GitHub error ${response.status}: ${body}. Make sure Device Flow is enabled.`);
        setIsLoading(false);
        return;
      }

      const data: DeviceCodeData = await response.json();
      setDeviceData(data);

      try {
        await navigator.clipboard.writeText(data.user_code);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch { /* clipboard may not be available */ }

      await open(data.verification_uri);

      const interval = (data.interval || 5) * 1000;
      const expiresAt = Date.now() + data.expires_in * 1000;
      pollingRef.current = setTimeout(() => pollForToken(data.device_code, interval, expiresAt), interval);
    } catch (e) {
      setError(`Connection failed: ${e instanceof Error ? e.message : String(e)}`);
      setIsLoading(false);
    }
  };

  const copyCode = async () => {
    if (deviceData) {
      await navigator.clipboard.writeText(deviceData.user_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <img src={logo} alt="NxtGit" className="w-16 h-16 mx-auto mb-5 rounded-xl" />
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            NxtGit
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Sign in to access your repositories
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 px-3 py-2.5 mb-4 rounded-lg text-sm"
               style={{ background: 'rgba(255, 59, 48, 0.08)', color: 'var(--error)' }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {deviceData ? (
          <div className="space-y-5">
            <div className="text-center">
              <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                Enter this code on GitHub:
              </p>
              <button
                onClick={copyCode}
                className="inline-flex items-center gap-3 px-5 py-3 rounded-lg font-mono text-xl font-bold tracking-widest"
                style={{
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}
              >
                {deviceData.user_code}
                {copied ? (
                  <CheckCircle className="w-4 h-4" style={{ color: 'var(--success)' }} />
                ) : (
                  <Copy className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                )}
              </button>
              <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                {copied ? 'Copied!' : 'Click to copy'}
              </p>
            </div>

            <div className="flex items-center gap-2.5 justify-center" style={{ color: 'var(--text-secondary)' }}>
              <div className="w-4 h-4 border-2 rounded-full animate-spin"
                   style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
              <span className="text-sm">Waiting for authorization...</span>
            </div>

            {status && (
              <p className="text-xs font-mono text-center break-all" style={{ color: 'var(--text-tertiary)' }}>
                {status}
              </p>
            )}

            <button
              onClick={() => open(deviceData.verification_uri)}
              className="btn-secondary w-full flex items-center justify-center gap-2 py-2.5"
            >
              <Github className="w-4 h-4" />
              Open GitHub
            </button>

            <button
              onClick={() => { stopPolling(); setDeviceData(null); setIsLoading(false); setStatus(''); }}
              className="w-full text-sm py-2"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={handleGitHubLogin}
            disabled={isLoading}
            className="btn-primary w-full flex items-center justify-center gap-2.5 py-3"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Github className="w-4 h-4" />
                Sign in with GitHub
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default Login;
