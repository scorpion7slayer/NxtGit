import { fetch } from '@tauri-apps/plugin-http';
import { useAuthStore } from '../stores/authStore';

const API = 'https://api.github.com';

async function ghFetch<T>(path: string, accept?: string): Promise<T> {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API}${path}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': accept || 'application/vnd.github+json',
      'User-Agent': 'NxtGit/0.1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return response.json();
}

async function ghFetchRaw(path: string): Promise<string> {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API}${path}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.raw+json',
      'User-Agent': 'NxtGit/0.1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return response.text();
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  updated_at: string;
  default_branch: string;
  owner: { login: string; avatar_url: string };
}

export interface GitHubPR {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  comments: number;
  user: { login: string; avatar_url: string };
  updated_at: string;
  created_at: string;
  repository_url: string;
  pull_request?: { merged_at: string | null };
  body: string | null;
}

export interface GitHubEvent {
  id: string;
  type: string;
  repo: { name: string };
  created_at: string;
  payload: {
    action?: string;
    pull_request?: { title: string };
    commits?: { message: string }[];
    ref?: string;
  };
}

export interface GitHubContent {
  name: string;
  path: string;
  type: 'file' | 'dir' | 'symlink' | 'submodule';
  size: number;
  sha: string;
  download_url: string | null;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  comments: number;
  user: { login: string; avatar_url: string };
  labels: { name: string; color: string }[];
  created_at: string;
  updated_at: string;
  body: string | null;
  repository_url: string;
  pull_request?: { url: string };
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: { name: string; date: string };
  };
  author: { login: string; avatar_url: string } | null;
}

export interface GitHubRepoPR {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  user: { login: string; avatar_url: string };
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  comments: number;
  body: string | null;
}

// --- Fetchers ---

export async function fetchRepos(): Promise<GitHubRepo[]> {
  return ghFetch<GitHubRepo[]>('/user/repos?sort=updated&per_page=50&affiliation=owner,collaborator');
}

export async function fetchUserPRs(): Promise<GitHubPR[]> {
  const login = useAuthStore.getState().user?.login;
  if (!login) return [];
  const result = await ghFetch<{ items: GitHubPR[] }>(
    `/search/issues?q=is:pr+author:${login}+sort:updated&per_page=30`
  );
  return result.items || [];
}

export async function fetchEvents(): Promise<GitHubEvent[]> {
  const login = useAuthStore.getState().user?.login;
  if (!login) return [];
  return ghFetch<GitHubEvent[]>(`/users/${login}/events?per_page=30`);
}

export async function fetchStarCount(): Promise<number> {
  const repos = await ghFetch<GitHubRepo[]>('/user/repos?per_page=100&affiliation=owner');
  return repos.reduce((sum, r) => sum + r.stargazers_count, 0);
}

export async function fetchUserIssues(): Promise<GitHubIssue[]> {
  return ghFetch<GitHubIssue[]>('/user/issues?filter=all&state=all&per_page=50&sort=updated');
}

export async function fetchRepoDetail(owner: string, name: string): Promise<GitHubRepo> {
  return ghFetch<GitHubRepo>(`/repos/${owner}/${name}`);
}

export async function fetchRepoContents(owner: string, name: string, path: string = ''): Promise<GitHubContent[]> {
  return ghFetch<GitHubContent[]>(`/repos/${owner}/${name}/contents/${path}`);
}

export async function fetchFileContent(owner: string, name: string, path: string): Promise<string> {
  return ghFetchRaw(`/repos/${owner}/${name}/contents/${path}`);
}

export async function fetchRepoIssues(owner: string, name: string): Promise<GitHubIssue[]> {
  return ghFetch<GitHubIssue[]>(`/repos/${owner}/${name}/issues?state=all&per_page=50&sort=updated`);
}

export async function fetchRepoPRs(owner: string, name: string): Promise<GitHubRepoPR[]> {
  return ghFetch<GitHubRepoPR[]>(`/repos/${owner}/${name}/pulls?state=all&per_page=50&sort=updated`);
}

export async function fetchRepoCommits(owner: string, name: string, sha?: string): Promise<GitHubCommit[]> {
  const branch = sha ? `&sha=${sha}` : '';
  return ghFetch<GitHubCommit[]>(`/repos/${owner}/${name}/commits?per_page=30${branch}`);
}

// --- Utilities ---

export function repoNameFromUrl(url: string): string {
  return url.replace('https://api.github.com/repos/', '');
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178C6', JavaScript: '#F1E05A', Python: '#3572A5',
  Rust: '#DEA584', Go: '#00ADD8', Java: '#B07219', PHP: '#4F5D95',
  'C++': '#F34B7D', C: '#555555', 'C#': '#178600', Ruby: '#701516',
  Swift: '#F05138', Kotlin: '#A97BFF', Shell: '#89E051', HTML: '#E34C26',
  CSS: '#563D7C', Dart: '#00B4AB', Vue: '#41B883', Svelte: '#FF3E00',
};

export function langColor(lang: string | null): string {
  return lang ? (LANG_COLORS[lang] || '#8B8B8B') : '#8B8B8B';
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
