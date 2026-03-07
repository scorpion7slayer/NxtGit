import { fetch } from "@tauri-apps/plugin-http";
import { useAuthStore } from "../stores/authStore";

const API = "https://api.github.com";

async function ghFetch<T>(path: string): Promise<T> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API}${path}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "NxtGit/0.1.0",
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
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.raw+json",
            "User-Agent": "NxtGit/0.1.0",
        },
    });

    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
    }

    return response.text();
}

// --- Types ---

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
    state: "open" | "closed";
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
        ref_type?: string;
        issue?: { title: string };
        release?: { tag_name: string };
    };
}

export interface GitHubContent {
    name: string;
    path: string;
    type: "file" | "dir" | "symlink" | "submodule";
    size: number;
    sha: string;
    download_url: string | null;
}

export interface GitHubIssue {
    id: number;
    number: number;
    title: string;
    state: "open" | "closed";
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
    state: "open" | "closed";
    user: { login: string; avatar_url: string };
    created_at: string;
    updated_at: string;
    merged_at: string | null;
    comments: number;
    body: string | null;
}

export interface GitHubPRDetail {
    id: number;
    number: number;
    title: string;
    state: "open" | "closed";
    merged: boolean;
    user: { login: string; avatar_url: string };
    created_at: string;
    updated_at: string;
    body: string | null;
    additions: number;
    deletions: number;
    changed_files: number;
    comments: number;
    head: { ref: string; label: string };
    base: { ref: string; label: string };
}

export interface GitHubPRFile {
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    patch?: string;
}

export interface GitHubComment {
    id: number;
    user: { login: string; avatar_url: string };
    body: string;
    created_at: string;
    updated_at: string;
}

export interface GitHubSubscription {
    plan: string;
    copilotAccess: boolean;
    copilotPlan: string | null;
}

// --- Fetchers ---

export async function fetchRepos(): Promise<GitHubRepo[]> {
    return ghFetch<GitHubRepo[]>(
        "/user/repos?sort=updated&per_page=50&affiliation=owner,collaborator",
    );
}

export async function fetchUserPRs(): Promise<GitHubPR[]> {
    const login = useAuthStore.getState().user?.login;
    if (!login) return [];
    const result = await ghFetch<{ items: GitHubPR[] }>(
        `/search/issues?q=is:pr+author:${login}+sort:updated&per_page=30`,
    );
    return result.items || [];
}

export async function fetchEvents(): Promise<GitHubEvent[]> {
    const login = useAuthStore.getState().user?.login;
    if (!login) return [];
    return ghFetch<GitHubEvent[]>(`/users/${login}/events?per_page=30`);
}

export async function fetchStarCount(): Promise<number> {
    const repos = await ghFetch<GitHubRepo[]>(
        "/user/repos?per_page=100&affiliation=owner",
    );
    return repos.reduce((sum, r) => sum + r.stargazers_count, 0);
}

export async function fetchSubscription(): Promise<GitHubSubscription> {
    const user = await ghFetch<{ plan?: { name: string } }>("/user");
    let copilotAccess = false;
    let copilotPlan: string | null = null;

    try {
        const copilotData = await ghFetch<{
            seat_management_setting?: string;
            seat_breakdown?: { total: number };
        }>("/user/copilot");
        if (copilotData) {
            copilotAccess = true;
            copilotPlan = copilotData.seat_management_setting || "active";
        }
    } catch {
        // User doesn't have Copilot or endpoint not available
        // Try checking via the copilot billing endpoint as fallback
        try {
            const token = useAuthStore.getState().token;
            const response = await fetch(
                "https://api.github.com/copilot_internal/v2/token",
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                        "User-Agent": "NxtGit/0.1.0",
                    },
                },
            );
            if (response.ok) {
                copilotAccess = true;
                copilotPlan = "individual";
            }
        } catch {
            // No Copilot access
        }
    }

    return {
        plan: user.plan?.name || "free",
        copilotAccess,
        copilotPlan,
    };
}

export async function fetchUserIssues(): Promise<GitHubIssue[]> {
    return ghFetch<GitHubIssue[]>(
        "/user/issues?filter=all&state=all&per_page=50&sort=updated",
    );
}

export async function fetchRepoDetail(
    owner: string,
    name: string,
): Promise<GitHubRepo> {
    return ghFetch<GitHubRepo>(`/repos/${owner}/${name}`);
}

export async function fetchRepoContents(
    owner: string,
    name: string,
    path: string = "",
): Promise<GitHubContent[]> {
    return ghFetch<GitHubContent[]>(`/repos/${owner}/${name}/contents/${path}`);
}

export async function fetchFileContent(
    owner: string,
    name: string,
    path: string,
): Promise<string> {
    return ghFetchRaw(`/repos/${owner}/${name}/contents/${path}`);
}

export interface TreeEntry {
    path: string;
    type: "blob" | "tree";
    size?: number;
}

export async function fetchRepoTree(
    owner: string,
    name: string,
    branch: string = "HEAD",
): Promise<TreeEntry[]> {
    const data = await ghFetch<{ tree: TreeEntry[]; truncated: boolean }>(
        `/repos/${owner}/${name}/git/trees/${branch}?recursive=1`,
    );
    return data.tree;
}

export async function fetchRepoIssues(
    owner: string,
    name: string,
): Promise<GitHubIssue[]> {
    return ghFetch<GitHubIssue[]>(
        `/repos/${owner}/${name}/issues?state=all&per_page=50&sort=updated`,
    );
}

export async function fetchRepoPRs(
    owner: string,
    name: string,
): Promise<GitHubRepoPR[]> {
    return ghFetch<GitHubRepoPR[]>(
        `/repos/${owner}/${name}/pulls?state=all&per_page=50&sort=updated`,
    );
}

export async function fetchRepoCommits(
    owner: string,
    name: string,
    sha?: string,
): Promise<GitHubCommit[]> {
    const branch = sha ? `&sha=${sha}` : "";
    return ghFetch<GitHubCommit[]>(
        `/repos/${owner}/${name}/commits?per_page=30${branch}`,
    );
}

export async function fetchIssueDetail(
    owner: string,
    name: string,
    number: number,
): Promise<GitHubIssue> {
    return ghFetch<GitHubIssue>(`/repos/${owner}/${name}/issues/${number}`);
}

export async function fetchIssueComments(
    owner: string,
    name: string,
    number: number,
): Promise<GitHubComment[]> {
    return ghFetch<GitHubComment[]>(
        `/repos/${owner}/${name}/issues/${number}/comments?per_page=50`,
    );
}

export async function fetchPRDetail(
    owner: string,
    name: string,
    number: number,
): Promise<GitHubPRDetail> {
    return ghFetch<GitHubPRDetail>(`/repos/${owner}/${name}/pulls/${number}`);
}

export async function fetchPRFiles(
    owner: string,
    name: string,
    number: number,
): Promise<GitHubPRFile[]> {
    return ghFetch<GitHubPRFile[]>(
        `/repos/${owner}/${name}/pulls/${number}/files`,
    );
}

// --- Write Operations ---

async function ghPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API}${path}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "NxtGit/0.1.0",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`GitHub API error ${response.status}: ${text}`);
    }
    return response.json();
}

async function ghPatch<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API}${path}`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "NxtGit/0.1.0",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`GitHub API error ${response.status}: ${text}`);
    }
    return response.json();
}

async function ghPut<T>(path: string, body: Record<string, unknown> = {}): Promise<T> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API}${path}`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "NxtGit/0.1.0",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`GitHub API error ${response.status}: ${text}`);
    }
    return response.json();
}

export async function createIssue(
    owner: string,
    name: string,
    title: string,
    body: string,
    labels?: string[],
): Promise<GitHubIssue> {
    return ghPost<GitHubIssue>(`/repos/${owner}/${name}/issues`, {
        title,
        body,
        ...(labels?.length ? { labels } : {}),
    });
}

export async function createComment(
    owner: string,
    name: string,
    number: number,
    body: string,
): Promise<GitHubComment> {
    return ghPost<GitHubComment>(
        `/repos/${owner}/${name}/issues/${number}/comments`,
        { body },
    );
}

export async function updateIssueState(
    owner: string,
    name: string,
    number: number,
    state: "open" | "closed",
): Promise<GitHubIssue> {
    return ghPatch<GitHubIssue>(`/repos/${owner}/${name}/issues/${number}`, { state });
}

export async function mergePR(
    owner: string,
    name: string,
    number: number,
    method: "merge" | "squash" | "rebase" = "merge",
): Promise<{ merged: boolean; message: string }> {
    return ghPut<{ merged: boolean; message: string }>(
        `/repos/${owner}/${name}/pulls/${number}/merge`,
        { merge_method: method },
    );
}

export async function createPR(
    owner: string,
    name: string,
    title: string,
    body: string,
    head: string,
    base: string,
): Promise<GitHubRepoPR> {
    return ghPost<GitHubRepoPR>(`/repos/${owner}/${name}/pulls`, {
        title,
        body,
        head,
        base,
    });
}

export async function addLabels(
    owner: string,
    name: string,
    number: number,
    labels: string[],
): Promise<{ name: string; color: string }[]> {
    return ghPost<{ name: string; color: string }[]>(
        `/repos/${owner}/${name}/issues/${number}/labels`,
        { labels },
    );
}

export async function fetchRepoBranches(
    owner: string,
    name: string,
): Promise<{ name: string; protected: boolean }[]> {
    return ghFetch<{ name: string; protected: boolean }[]>(
        `/repos/${owner}/${name}/branches?per_page=100`,
    );
}

// --- Utilities ---

export function repoNameFromUrl(url: string): string {
    return url.replace("https://api.github.com/repos/", "");
}

export function parseRepoFromUrl(url: string): { owner: string; name: string } {
    const parts = url.replace("https://api.github.com/repos/", "").split("/");
    return { owner: parts[0], name: parts[1] };
}

const LANG_COLORS: Record<string, string> = {
    TypeScript: "#3178C6",
    JavaScript: "#F1E05A",
    Python: "#3572A5",
    Rust: "#DEA584",
    Go: "#00ADD8",
    Java: "#B07219",
    PHP: "#4F5D95",
    "C++": "#F34B7D",
    C: "#555555",
    "C#": "#178600",
    Ruby: "#701516",
    Swift: "#F05138",
    Kotlin: "#A97BFF",
    Shell: "#89E051",
    HTML: "#E34C26",
    CSS: "#563D7C",
    Dart: "#00B4AB",
    Vue: "#41B883",
    Svelte: "#FF3E00",
};

export function langColor(lang: string | null): string {
    return lang ? LANG_COLORS[lang] || "#8B8B8B" : "#8B8B8B";
}

export function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
}

const EXT_TO_LANG: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    rs: "rust",
    go: "go",
    java: "java",
    php: "php",
    rb: "ruby",
    swift: "swift",
    kt: "kotlin",
    sh: "bash",
    bash: "bash",
    html: "html",
    css: "css",
    scss: "scss",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    md: "markdown",
    sql: "sql",
    c: "c",
    cpp: "cpp",
    h: "c",
    xml: "xml",
    toml: "toml",
    dart: "dart",
    vue: "xml",
    svelte: "xml",
};

export function detectLanguage(filename: string): string | undefined {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    return EXT_TO_LANG[ext];
}
