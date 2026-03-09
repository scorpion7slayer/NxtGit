import { create } from "zustand";
import { LazyStore } from "@tauri-apps/plugin-store";

interface AuthState {
    authLoaded: boolean;
    isAuthenticated: boolean;
    token: string | null;
    copilotGithubToken: string | null;
    user: GitHubUser | null;
    setAuth: (token: string, user: GitHubUser) => Promise<void>;
    setCopilotToken: (token: string) => Promise<void>;
    clearCopilotToken: () => Promise<void>;
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

const store = new LazyStore("auth.json");

export const useAuthStore = create<AuthState>((set) => ({
    authLoaded: false,
    isAuthenticated: false,
    token: null,
    copilotGithubToken: null,
    user: null,

    setAuth: async (token, user) => {
        await store.set("token", token);
        await store.set("user", user);
        await store.save();
        set({ authLoaded: true, isAuthenticated: true, token, user });
    },

    setCopilotToken: async (token) => {
        await store.set("copilotGithubToken", token);
        await store.save();
        set({ copilotGithubToken: token });
    },

    clearCopilotToken: async () => {
        await store.delete("copilotGithubToken");
        await store.save();
        set({ copilotGithubToken: null });
    },

    logout: async () => {
        await store.delete("token");
        await store.delete("user");
        await store.delete("copilotGithubToken");
        await store.save();
        set({
            authLoaded: true,
            isAuthenticated: false,
            token: null,
            user: null,
            copilotGithubToken: null,
        });
    },

    loadAuth: async () => {
        try {
            const token = await store.get<string>("token");
            const user = await store.get<GitHubUser>("user");
            const copilotGithubToken =
                await store.get<string>("copilotGithubToken");
            if (token && user) {
                set({
                    authLoaded: true,
                    isAuthenticated: true,
                    token,
                    user,
                    copilotGithubToken: copilotGithubToken || null,
                });
                return;
            }
        } catch {
            // Store not yet initialized, ignore
        }

        set({ authLoaded: true });
    },
}));
