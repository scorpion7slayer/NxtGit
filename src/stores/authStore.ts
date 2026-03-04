import { create } from 'zustand';
import { Store } from '@tauri-apps/plugin-store';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: GitHubUser | null;
  setAuth: (token: string, user: GitHubUser) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
}

interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  name: string;
  email: string;
}

// Initialize Tauri store
const store = new Store('auth.store');

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  token: null,
  user: null,
  
  setAuth: async (token, user) => {
    await store.set('token', token);
    await store.set('user', user);
    await store.save();
    set({ isAuthenticated: true, token, user });
  },
  
  logout: async () => {
    await store.delete('token');
    await store.delete('user');
    await store.save();
    set({ isAuthenticated: false, token: null, user: null });
  },
  
  loadAuth: async () => {
    const token = await store.get<string>('token');
    const user = await store.get<GitHubUser>('user');
    if (token && user) {
      set({ isAuthenticated: true, token, user });
    }
  }
}));
