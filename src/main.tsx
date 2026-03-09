import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import App from './App';
import './index.css';

type PlatformInfo = {
  is_macos: boolean;
  is_macos_tahoe_or_newer: boolean;
};

async function applyPlatformClasses() {
  const fallbackIsMac = navigator.userAgent.includes('Macintosh');

  try {
    const platformInfo = await invoke<PlatformInfo>('get_platform_info');

    if (platformInfo.is_macos) {
      document.documentElement.classList.add('platform-macos');
    }

    if (platformInfo.is_macos_tahoe_or_newer) {
      document.documentElement.classList.add('platform-macos-tahoe');
    }

    return;
  } catch {
    if (fallbackIsMac) {
      document.documentElement.classList.add('platform-macos');
    }
  }
}

void applyPlatformClasses().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  );
});
