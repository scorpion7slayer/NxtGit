import { fetch } from "@tauri-apps/plugin-http";
import { useAuthStore } from "../stores/authStore";
import { APP_USER_AGENT } from "./appMeta";
import {
    clearCachedValuesByPrefix,
    getCachedValue,
    getStaleCachedValue,
    setCachedValue,
} from "./cache";

const API = "https://api.github.com";
const GITHUB_CACHE_PREFIX = "github:";
const CACHE_TTL_SHORT = 60_000;
const CACHE_TTL_MEDIUM = 5 * 60_000;
const CACHE_TTL_LONG = 15 * 60_000;

async function ghFetch<T>(path: string): Promise<T> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API}${path}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": APP_USER_AGENT,
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
            "User-Agent": APP_USER_AGENT,
        },
    });

    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
    }

    return response.text();
}

function buildGitHubCacheKey(key: string): string {
    const login = useAuthStore.getState().user?.login || "anonymous";
    return `${GITHUB_CACHE_PREFIX}${login}:${key}`;
}

async function fetchWithCache<T>(
    key: string,
    ttlMs: number,
    loader: () => Promise<T>,
): Promise<T> {
    const cacheKey = buildGitHubCacheKey(key);
    const cached = await getCachedValue<T>(cacheKey, ttlMs);
    if (cached !== null) {
        return cached;
    }

    try {
        const value = await loader();
        await setCachedValue(cacheKey, value);
        return value;
    } catch (error) {
        const stale = await getStaleCachedValue<T>(cacheKey);
        if (stale !== null) {
            return stale;
        }
        throw error;
    }
}

export async function clearGitHubCache(): Promise<void> {
    await clearCachedValuesByPrefix(GITHUB_CACHE_PREFIX);
}

// --- Types ---

export interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    description: string | null;
    private: boolean;
    fork: boolean;
    language: string | null;
    stargazers_count: number;
    forks_count: number;
    open_issues_count: number;
    watchers_count: number;
    updated_at: string;
    created_at: string;
    default_branch: string;
    owner: { login: string; avatar_url: string };
    parent?: { full_name: string; owner: { login: string } };
    topics?: string[];
    license?: { spdx_id: string; name: string } | null;
    homepage?: string | null;
    has_issues: boolean;
    has_wiki: boolean;
    has_projects: boolean;
    is_template: boolean;
    allow_squash_merge: boolean;
    allow_merge_commit: boolean;
    allow_rebase_merge: boolean;
    allow_auto_merge: boolean;
    delete_branch_on_merge: boolean;
    allow_forking: boolean;
    web_commit_signoff_required: boolean;
    archived: boolean;
    disabled: boolean;
    size: number;
    html_url: string;
    security_and_analysis?: {
        advanced_security?: { status: string };
        secret_scanning?: { status: string };
        secret_scanning_push_protection?: { status: string };
    };
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
        pull_request?: { title: string; number: number };
        commits?: { message: string }[];
        ref?: string;
        ref_type?: string;
        issue?: { title: string; number: number };
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
    return fetchWithCache(
        "repos:list",
        CACHE_TTL_MEDIUM,
        () =>
            ghFetch<GitHubRepo[]>(
                "/user/repos?sort=updated&per_page=50&affiliation=owner,collaborator",
            ),
    );
}

export async function fetchUserPRs(): Promise<GitHubPR[]> {
    const login = useAuthStore.getState().user?.login;
    if (!login) return [];
    const result = await fetchWithCache(
        `prs:user:${login}`,
        CACHE_TTL_SHORT,
        () =>
            ghFetch<{ items: GitHubPR[] }>(
                `/search/issues?q=is:pr+author:${login}+sort:updated&per_page=30`,
            ),
    );
    return result.items || [];
}

export async function fetchEvents(): Promise<GitHubEvent[]> {
    const login = useAuthStore.getState().user?.login;
    if (!login) return [];
    return fetchWithCache(
        `events:${login}`,
        CACHE_TTL_SHORT,
        () => ghFetch<GitHubEvent[]>(`/users/${login}/events?per_page=30`),
    );
}

export async function fetchStarCount(): Promise<number> {
    const repos = await fetchWithCache(
        "repos:stars",
        CACHE_TTL_MEDIUM,
        () =>
            ghFetch<GitHubRepo[]>(
                "/user/repos?per_page=100&affiliation=owner",
            ),
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
                        "User-Agent": APP_USER_AGENT,
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
    return fetchWithCache(
        "issues:user",
        CACHE_TTL_SHORT,
        () =>
            ghFetch<GitHubIssue[]>(
                "/user/issues?filter=all&state=all&per_page=50&sort=updated",
            ),
    );
}

export async function fetchRepoDetail(
    owner: string,
    name: string,
): Promise<GitHubRepo> {
    return fetchWithCache(
        `repo:${owner}/${name}:detail`,
        CACHE_TTL_MEDIUM,
        () => ghFetch<GitHubRepo>(`/repos/${owner}/${name}`),
    );
}

export async function fetchRepoContents(
    owner: string,
    name: string,
    path: string = "",
    ref?: string,
): Promise<GitHubContent[]> {
    const q = ref ? `?ref=${encodeURIComponent(ref)}` : "";
    return fetchWithCache(
        `repo:${owner}/${name}:contents:${ref ?? "default"}:${path || "."}`,
        CACHE_TTL_SHORT,
        () =>
            ghFetch<GitHubContent[]>(
                `/repos/${owner}/${name}/contents/${path}${q}`,
            ),
    );
}

export async function fetchFileContent(
    owner: string,
    name: string,
    path: string,
    ref?: string,
): Promise<string> {
    const q = ref ? `?ref=${encodeURIComponent(ref)}` : "";
    return fetchWithCache(
        `repo:${owner}/${name}:file:${ref ?? "default"}:${path}`,
        CACHE_TTL_SHORT,
        () => ghFetchRaw(`/repos/${owner}/${name}/contents/${path}${q}`),
    );
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
    const data = await fetchWithCache(
        `repo:${owner}/${name}:tree:${branch}`,
        CACHE_TTL_MEDIUM,
        () =>
            ghFetch<{ tree: TreeEntry[]; truncated: boolean }>(
                `/repos/${owner}/${name}/git/trees/${branch}?recursive=1`,
            ),
    );
    return data.tree;
}

export async function fetchRepoIssues(
    owner: string,
    name: string,
): Promise<GitHubIssue[]> {
    return fetchWithCache(
        `repo:${owner}/${name}:issues`,
        CACHE_TTL_SHORT,
        () =>
            ghFetch<GitHubIssue[]>(
                `/repos/${owner}/${name}/issues?state=all&per_page=50&sort=updated`,
            ),
    );
}

export async function fetchRepoPRs(
    owner: string,
    name: string,
): Promise<GitHubRepoPR[]> {
    return fetchWithCache(
        `repo:${owner}/${name}:prs`,
        CACHE_TTL_SHORT,
        () =>
            ghFetch<GitHubRepoPR[]>(
                `/repos/${owner}/${name}/pulls?state=all&per_page=50&sort=updated`,
            ),
    );
}

export async function fetchRepoCommits(
    owner: string,
    name: string,
    sha?: string,
): Promise<GitHubCommit[]> {
    const branch = sha ? `&sha=${sha}` : "";
    return fetchWithCache(
        `repo:${owner}/${name}:commits:${sha ?? "default"}`,
        CACHE_TTL_SHORT,
        () =>
            ghFetch<GitHubCommit[]>(
                `/repos/${owner}/${name}/commits?per_page=30${branch}`,
            ),
    );
}

export async function fetchIssueDetail(
    owner: string,
    name: string,
    number: number,
): Promise<GitHubIssue> {
    return fetchWithCache(
        `repo:${owner}/${name}:issue:${number}`,
        CACHE_TTL_SHORT,
        () => ghFetch<GitHubIssue>(`/repos/${owner}/${name}/issues/${number}`),
    );
}

export async function fetchIssueComments(
    owner: string,
    name: string,
    number: number,
): Promise<GitHubComment[]> {
    return fetchWithCache(
        `repo:${owner}/${name}:issue:${number}:comments`,
        CACHE_TTL_SHORT,
        () =>
            ghFetch<GitHubComment[]>(
                `/repos/${owner}/${name}/issues/${number}/comments?per_page=50`,
            ),
    );
}

export async function fetchPRDetail(
    owner: string,
    name: string,
    number: number,
): Promise<GitHubPRDetail> {
    return fetchWithCache(
        `repo:${owner}/${name}:pr:${number}`,
        CACHE_TTL_SHORT,
        () => ghFetch<GitHubPRDetail>(`/repos/${owner}/${name}/pulls/${number}`),
    );
}

export async function fetchPRFiles(
    owner: string,
    name: string,
    number: number,
): Promise<GitHubPRFile[]> {
    return fetchWithCache(
        `repo:${owner}/${name}:pr:${number}:files`,
        CACHE_TTL_SHORT,
        () =>
            ghFetch<GitHubPRFile[]>(
                `/repos/${owner}/${name}/pulls/${number}/files`,
            ),
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
            "User-Agent": APP_USER_AGENT,
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
            "User-Agent": APP_USER_AGENT,
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
            "User-Agent": APP_USER_AGENT,
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

async function ghDelete<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API}${path}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": APP_USER_AGENT,
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

export async function fetchFileInfo(
    owner: string,
    name: string,
    path: string,
    ref?: string,
): Promise<{ sha: string; size: number }> {
    const q = ref ? `?ref=${encodeURIComponent(ref)}` : "";
    return ghFetch(`/repos/${owner}/${name}/contents/${path}${q}`);
}

export async function createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    sha?: string,
    branch?: string,
): Promise<{ content: { sha: string }; commit: { sha: string; message: string } }> {
    const bytes = new TextEncoder().encode(content);
    const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
    const body: Record<string, unknown> = { message, content: btoa(binary) };
    if (sha) body.sha = sha;
    if (branch) body.branch = branch;
    return ghPut(`/repos/${owner}/${repo}/contents/${path}`, body);
}

export async function deleteFile(
    owner: string,
    repo: string,
    path: string,
    sha: string,
    message: string,
    branch?: string,
): Promise<{ commit: { sha: string } }> {
    const body: Record<string, unknown> = { message, sha };
    if (branch) body.branch = branch;
    return ghDelete(`/repos/${owner}/${repo}/contents/${path}`, body);
}

export async function createBranch(
    owner: string,
    repo: string,
    branchName: string,
    fromSha: string,
): Promise<{ ref: string }> {
    return ghPost(`/repos/${owner}/${repo}/git/refs`, {
        ref: `refs/heads/${branchName}`,
        sha: fromSha,
    });
}

export async function fetchRepoBranches(
    owner: string,
    name: string,
): Promise<GitHubBranch[]> {
    return fetchWithCache(
        `repo:${owner}/${name}:branches`,
        CACHE_TTL_SHORT,
        () =>
            ghFetch<GitHubBranch[]>(
                `/repos/${owner}/${name}/branches?per_page=100`,
            ),
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

// --- New Types ---

export interface GitHubWorkflowRun {
    id: number;
    name: string;
    head_branch: string;
    status: string;
    conclusion: string | null;
    run_number: number;
    event: string;
    created_at: string;
    updated_at: string;
    html_url: string;
    actor: { login: string; avatar_url: string } | null;
}

export interface GitHubUserProfile {
    id: number;
    login: string;
    avatar_url: string;
    name: string | null;
    bio: string | null;
    company: string | null;
    location: string | null;
    blog: string | null;
    twitter_username: string | null;
    public_repos: number;
    public_gists: number;
    followers: number;
    following: number;
    created_at: string;
    html_url: string;
    type: string;
}

export interface GitHubChangelogEntry {
    title: string;
    link: string;
    pubDate: string;
    description: string;
    contentHtml: string;
}

// --- New Fetchers ---

export async function fetchWorkflowRuns(
    owner: string,
    name: string,
): Promise<GitHubWorkflowRun[]> {
    const data = await fetchWithCache(
        `repo:${owner}/${name}:workflow-runs`,
        CACHE_TTL_SHORT,
        () =>
            ghFetch<{ workflow_runs: GitHubWorkflowRun[] }>(
                `/repos/${owner}/${name}/actions/runs?per_page=20`,
            ),
    );
    return data.workflow_runs || [];
}

export async function searchRepos(query: string): Promise<GitHubRepo[]> {
    const data = await ghFetch<{ items: GitHubRepo[] }>(
        `/search/repositories?q=${encodeURIComponent(query)}&per_page=20&sort=stars`,
    );
    return data.items || [];
}

export async function searchUsers(
    query: string,
): Promise<GitHubUserProfile[]> {
    const data = await ghFetch<{ items: GitHubUserProfile[] }>(
        `/search/users?q=${encodeURIComponent(query)}&per_page=20`,
    );
    return data.items || [];
}

export async function fetchUserProfile(
    username: string,
): Promise<GitHubUserProfile> {
    return fetchWithCache(
        `user:${username}:profile`,
        CACHE_TTL_MEDIUM,
        () => ghFetch<GitHubUserProfile>(`/users/${username}`),
    );
}

export async function fetchUserRepos(
    username: string,
): Promise<GitHubRepo[]> {
    return fetchWithCache(
        `user:${username}:repos`,
        CACHE_TTL_MEDIUM,
        () =>
            ghFetch<GitHubRepo[]>(
                `/users/${username}/repos?sort=updated&per_page=30`,
            ),
    );
}

export async function fetchGitHubChangelog(): Promise<GitHubChangelogEntry[]> {
    return fetchWithCache("github:changelog", CACHE_TTL_LONG, async () => {
        const response = await fetch("https://github.blog/changelog/feed/", {
            method: "GET",
            headers: { "User-Agent": APP_USER_AGENT, Accept: "application/rss+xml" },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const xml = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, "text/xml");
        const items = doc.getElementsByTagName("item");
        const entries: GitHubChangelogEntry[] = [];
        for (let i = 0; i < items.length && i < 10; i++) {
            const item = items[i];
            const getText = (tag: string) =>
                item.getElementsByTagName(tag)[0]?.textContent?.trim() || "";
            const contentEncoded =
                item.getElementsByTagNameNS(
                    "http://purl.org/rss/1.0/modules/content/",
                    "encoded",
                )[0]?.textContent?.trim() || "";
            const descHtml =
                item.getElementsByTagName("description")[0]?.textContent?.trim() ||
                "";
            entries.push({
                title: getText("title"),
                link: getText("link"),
                pubDate: getText("pubDate"),
                description: descHtml,
                contentHtml: contentEncoded || descHtml,
            });
        }
        return entries;
    });
}

export interface GitHubRelease {
    id: number;
    tag_name: string;
    name: string | null;
    body: string | null;
    draft: boolean;
    prerelease: boolean;
    created_at: string;
    published_at: string | null;
    author: { login: string; avatar_url: string };
    html_url: string;
    assets: {
        name: string;
        size: number;
        download_count: number;
        browser_download_url: string;
    }[];
}

export interface GitHubContributor {
    login: string;
    avatar_url: string;
    contributions: number;
    html_url: string;
}

export interface GitHubCommitDetail {
    sha: string;
    commit: {
        message: string;
        author: { name: string; date: string; email: string };
    };
    author: { login: string; avatar_url: string } | null;
    stats: { total: number; additions: number; deletions: number };
    files: {
        filename: string;
        status: string;
        additions: number;
        deletions: number;
        changes: number;
        patch?: string;
    }[];
}

export interface GitHubWorkflowRunDetail {
    id: number;
    name: string;
    head_branch: string;
    head_sha: string;
    status: string;
    conclusion: string | null;
    run_number: number;
    event: string;
    created_at: string;
    updated_at: string;
    html_url: string;
    actor: { login: string; avatar_url: string } | null;
    run_attempt: number;
}

export interface GitHubWorkflowJob {
    id: number;
    name: string;
    status: string;
    conclusion: string | null;
    started_at: string;
    completed_at: string | null;
    steps: {
        name: string;
        status: string;
        conclusion: string | null;
        number: number;
    }[];
}

export interface GitHubBranch {
    name: string;
    protected: boolean;
    commit: { sha: string };
}

export interface GitHubPagesSite {
    status: string;
    html_url: string;
    cname: string | null;
    https_enforced: boolean;
    public: boolean;
    source: {
        branch: string;
        path: "/" | "/docs";
    };
}

export interface GitHubPagesBuild {
    status: string;
    url: string;
    created_at?: string;
    updated_at?: string;
    error?: {
        message: string | null;
    };
}

export async function fetchRepoReleases(
    owner: string,
    name: string,
): Promise<GitHubRelease[]> {
    return fetchWithCache(
        `repo:${owner}/${name}:releases`,
        CACHE_TTL_MEDIUM,
        () =>
            ghFetch<GitHubRelease[]>(
                `/repos/${owner}/${name}/releases?per_page=20`,
            ),
    );
}

export async function fetchRepoPagesSite(
    owner: string,
    name: string,
): Promise<GitHubPagesSite | null> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API}/repos/${owner}/${name}/pages`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": APP_USER_AGENT,
        },
    });

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`GitHub Pages error ${response.status}: ${text}`);
    }

    return response.json();
}

export async function createRepoPagesSite(
    owner: string,
    name: string,
    branch: string,
    path: "/" | "/docs",
): Promise<GitHubPagesSite> {
    return ghPost<GitHubPagesSite>(`/repos/${owner}/${name}/pages`, {
        source: {
            branch,
            path,
        },
    });
}

export async function updateRepoPagesSite(
    owner: string,
    name: string,
    branch: string,
    path: "/" | "/docs",
): Promise<void> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API}/repos/${owner}/${name}/pages`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": APP_USER_AGENT,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            source: {
                branch,
                path,
            },
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`GitHub Pages error ${response.status}: ${text}`);
    }
}

export async function deleteRepoPagesSite(
    owner: string,
    name: string,
): Promise<void> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API}/repos/${owner}/${name}/pages`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": APP_USER_AGENT,
        },
    });

    if (response.status === 404) {
        return;
    }

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`GitHub Pages error ${response.status}: ${text}`);
    }
}

export async function requestRepoPagesBuild(
    owner: string,
    name: string,
): Promise<GitHubPagesBuild> {
    return ghPost<GitHubPagesBuild>(`/repos/${owner}/${name}/pages/builds`, {});
}

export async function fetchLatestRepoPagesBuild(
    owner: string,
    name: string,
): Promise<GitHubPagesBuild | null> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API}/repos/${owner}/${name}/pages/builds/latest`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": APP_USER_AGENT,
        },
    });

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`GitHub Pages build error ${response.status}: ${text}`);
    }

    return response.json();
}

export async function fetchRepoContributors(
    owner: string,
    name: string,
): Promise<GitHubContributor[]> {
    return fetchWithCache(
        `repo:${owner}/${name}:contributors`,
        CACHE_TTL_MEDIUM,
        () =>
            ghFetch<GitHubContributor[]>(
                `/repos/${owner}/${name}/contributors?per_page=30`,
            ),
    );
}

export async function fetchCommitDetail(
    owner: string,
    name: string,
    sha: string,
): Promise<GitHubCommitDetail> {
    return fetchWithCache(
        `repo:${owner}/${name}:commit:${sha}`,
        CACHE_TTL_MEDIUM,
        () => ghFetch<GitHubCommitDetail>(`/repos/${owner}/${name}/commits/${sha}`),
    );
}

export async function fetchWorkflowRunDetail(
    owner: string,
    name: string,
    runId: number,
): Promise<GitHubWorkflowRunDetail> {
    return fetchWithCache(
        `repo:${owner}/${name}:workflow-run:${runId}`,
        CACHE_TTL_SHORT,
        () =>
            ghFetch<GitHubWorkflowRunDetail>(
                `/repos/${owner}/${name}/actions/runs/${runId}`,
            ),
    );
}

export async function fetchWorkflowRunJobs(
    owner: string,
    name: string,
    runId: number,
): Promise<GitHubWorkflowJob[]> {
    const data = await fetchWithCache(
        `repo:${owner}/${name}:workflow-run:${runId}:jobs`,
        CACHE_TTL_SHORT,
        () =>
            ghFetch<{ jobs: GitHubWorkflowJob[] }>(
                `/repos/${owner}/${name}/actions/runs/${runId}/jobs`,
            ),
    );
    return data.jobs || [];
}

// --- Star / Watch / Fork ---

export async function isRepoStarred(owner: string, name: string): Promise<boolean> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API}/user/starred/${owner}/${name}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": APP_USER_AGENT,
        },
    });
    return response.status === 204;
}

export async function starRepo(owner: string, name: string): Promise<void> {
    const token = useAuthStore.getState().token;
    await fetch(`${API}/user/starred/${owner}/${name}`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": APP_USER_AGENT,
            "Content-Length": "0",
        },
    });
}

export async function unstarRepo(owner: string, name: string): Promise<void> {
    const token = useAuthStore.getState().token;
    await fetch(`${API}/user/starred/${owner}/${name}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": APP_USER_AGENT,
        },
    });
}

export async function isRepoWatched(owner: string, name: string): Promise<boolean> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API}/repos/${owner}/${name}/subscription`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": APP_USER_AGENT,
        },
    });
    return response.ok;
}

export async function watchRepo(owner: string, name: string): Promise<void> {
    await ghPut(`/repos/${owner}/${name}/subscription`, { subscribed: true });
}

export async function unwatchRepo(owner: string, name: string): Promise<void> {
    const token = useAuthStore.getState().token;
    await fetch(`${API}/repos/${owner}/${name}/subscription`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": APP_USER_AGENT,
        },
    });
}

export async function forkRepo(owner: string, name: string): Promise<GitHubRepo> {
    return ghPost<GitHubRepo>(`/repos/${owner}/${name}/forks`, {});
}

export async function fetchRepoLanguages(owner: string, name: string): Promise<Record<string, number>> {
    return fetchWithCache(
        `repo:${owner}/${name}:languages`,
        CACHE_TTL_MEDIUM,
        () => ghFetch<Record<string, number>>(`/repos/${owner}/${name}/languages`),
    );
}

export async function fetchTrendingRepos(): Promise<GitHubRepo[]> {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    const since = date.toISOString().split("T")[0];
    const data = await fetchWithCache(
        `repos:trending:${since}`,
        CACHE_TTL_LONG,
        () =>
            ghFetch<{ items: GitHubRepo[] }>(
                `/search/repositories?q=created:>${since}+stars:>10&sort=stars&order=desc&per_page=20`,
            ),
    );
    return data.items || [];
}

// --- Releases ---

export async function createRelease(
    owner: string,
    name: string,
    tagName: string,
    releaseName: string,
    body: string,
    draft: boolean = false,
    prerelease: boolean = false,
): Promise<GitHubRelease> {
    return ghPost<GitHubRelease>(`/repos/${owner}/${name}/releases`, {
        tag_name: tagName,
        name: releaseName,
        body,
        draft,
        prerelease,
    });
}

// --- Security ---

export interface GitHubDependabotAlert {
    number: number;
    state: string;
    security_advisory: {
        summary: string;
        severity: string;
        description: string;
        cve_id: string | null;
    };
    security_vulnerability: {
        package: { name: string; ecosystem: string };
        severity: string;
        vulnerable_version_range: string;
    };
    created_at: string;
    html_url: string;
}

export interface GitHubCodeScanAlert {
    number: number;
    state: string;
    rule: { id: string; severity: string; description: string };
    tool: { name: string };
    most_recent_instance: {
        ref: string;
        location: { path: string; start_line: number };
    };
    created_at: string;
    html_url: string;
}

export async function fetchDependabotAlerts(
    owner: string,
    name: string,
): Promise<GitHubDependabotAlert[]> {
    return ghFetch<GitHubDependabotAlert[]>(
        `/repos/${owner}/${name}/dependabot/alerts?state=open&per_page=30`,
    );
}

export async function fetchCodeScanningAlerts(
    owner: string,
    name: string,
): Promise<GitHubCodeScanAlert[]> {
    return ghFetch<GitHubCodeScanAlert[]>(
        `/repos/${owner}/${name}/code-scanning/alerts?state=open&per_page=30`,
    );
}

// --- Secret Scanning ---

export interface GitHubSecretAlert {
    number: number;
    state: string;
    secret_type: string;
    secret_type_display_name: string;
    secret: string;
    resolution: string | null;
    created_at: string;
    updated_at: string;
    html_url: string;
    push_protection_bypassed: boolean | null;
}

export async function fetchSecretScanningAlerts(
    owner: string,
    name: string,
): Promise<GitHubSecretAlert[]> {
    return ghFetch<GitHubSecretAlert[]>(
        `/repos/${owner}/${name}/secret-scanning/alerts?state=open&per_page=30`,
    );
}

export async function dismissDependabotAlert(
    owner: string,
    name: string,
    alertNumber: number,
    state: "dismissed" | "open",
    dismissedReason?: string,
): Promise<GitHubDependabotAlert> {
    return ghPatch<GitHubDependabotAlert>(
        `/repos/${owner}/${name}/dependabot/alerts/${alertNumber}`,
        { state, ...(dismissedReason ? { dismissed_reason: dismissedReason } : {}) },
    );
}

export async function dismissCodeScanningAlert(
    owner: string,
    name: string,
    alertNumber: number,
    state: "dismissed" | "open",
    dismissedReason?: string,
): Promise<GitHubCodeScanAlert> {
    return ghPatch<GitHubCodeScanAlert>(
        `/repos/${owner}/${name}/code-scanning/alerts/${alertNumber}`,
        { state, ...(dismissedReason ? { dismissed_reason: dismissedReason } : {}) },
    );
}

export async function dismissSecretScanningAlert(
    owner: string,
    name: string,
    alertNumber: number,
    state: "resolved" | "open",
    resolution?: string,
): Promise<GitHubSecretAlert> {
    return ghPatch<GitHubSecretAlert>(
        `/repos/${owner}/${name}/secret-scanning/alerts/${alertNumber}`,
        { state, ...(resolution ? { resolution } : {}) },
    );
}

// --- Collaborators ---

export interface GitHubCollaborator {
    id: number;
    login: string;
    avatar_url: string;
    html_url: string;
    permissions: { admin: boolean; maintain: boolean; push: boolean; triage: boolean; pull: boolean };
    role_name: string;
}

export async function fetchCollaborators(
    owner: string,
    name: string,
): Promise<GitHubCollaborator[]> {
    return ghFetch<GitHubCollaborator[]>(
        `/repos/${owner}/${name}/collaborators?per_page=50`,
    );
}

export async function addCollaborator(
    owner: string,
    name: string,
    username: string,
    permission: string = "push",
): Promise<void> {
    await ghPut(`/repos/${owner}/${name}/collaborators/${username}`, { permission });
}

export async function removeCollaborator(
    owner: string,
    name: string,
    username: string,
): Promise<void> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API}/repos/${owner}/${name}/collaborators/${username}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": APP_USER_AGENT,
        },
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`GitHub API error ${response.status}: ${text}`);
    }
}

// --- Deploy Keys ---

export interface GitHubDeployKey {
    id: number;
    key: string;
    title: string;
    url: string;
    created_at: string;
    read_only: boolean;
    verified: boolean;
}

export async function fetchDeployKeys(
    owner: string,
    name: string,
): Promise<GitHubDeployKey[]> {
    return ghFetch<GitHubDeployKey[]>(`/repos/${owner}/${name}/keys?per_page=30`);
}

export async function addDeployKey(
    owner: string,
    name: string,
    title: string,
    key: string,
    readOnly: boolean = true,
): Promise<GitHubDeployKey> {
    return ghPost<GitHubDeployKey>(`/repos/${owner}/${name}/keys`, {
        title,
        key,
        read_only: readOnly,
    });
}

export async function removeDeployKey(
    owner: string,
    name: string,
    keyId: number,
): Promise<void> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API}/repos/${owner}/${name}/keys/${keyId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": APP_USER_AGENT,
        },
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`GitHub API error ${response.status}: ${text}`);
    }
}

// --- Webhooks ---

export interface GitHubWebhook {
    id: number;
    name: string;
    active: boolean;
    events: string[];
    config: { url: string; content_type: string; insecure_ssl: string };
    created_at: string;
    updated_at: string;
}

export async function fetchWebhooks(
    owner: string,
    name: string,
): Promise<GitHubWebhook[]> {
    return ghFetch<GitHubWebhook[]>(`/repos/${owner}/${name}/hooks?per_page=30`);
}

export async function createWebhook(
    owner: string,
    name: string,
    url: string,
    events: string[] = ["push"],
    contentType: string = "json",
): Promise<GitHubWebhook> {
    return ghPost<GitHubWebhook>(`/repos/${owner}/${name}/hooks`, {
        name: "web",
        active: true,
        events,
        config: { url, content_type: contentType, insecure_ssl: "0" },
    });
}

export async function deleteWebhook(
    owner: string,
    name: string,
    hookId: number,
): Promise<void> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API}/repos/${owner}/${name}/hooks/${hookId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": APP_USER_AGENT,
        },
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`GitHub API error ${response.status}: ${text}`);
    }
}

// --- Branch Protection ---

export interface GitHubBranchProtection {
    required_status_checks: { strict: boolean; contexts: string[] } | null;
    enforce_admins: { enabled: boolean } | null;
    required_pull_request_reviews: {
        dismiss_stale_reviews: boolean;
        require_code_owner_reviews: boolean;
        required_approving_review_count: number;
    } | null;
    restrictions: { users: { login: string }[]; teams: { slug: string }[] } | null;
}

export async function fetchBranchProtection(
    owner: string,
    name: string,
    branch: string,
): Promise<GitHubBranchProtection | null> {
    try {
        return await ghFetch<GitHubBranchProtection>(
            `/repos/${owner}/${name}/branches/${branch}/protection`,
        );
    } catch {
        return null;
    }
}

// --- Repo Settings ---

export async function updateRepo(
    owner: string,
    name: string,
    data: Record<string, unknown>,
): Promise<GitHubRepo> {
    return ghPatch<GitHubRepo>(`/repos/${owner}/${name}`, data);
}

export async function deleteRepo(
    owner: string,
    name: string,
): Promise<void> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API}/repos/${owner}/${name}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": APP_USER_AGENT,
        },
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`GitHub API error ${response.status}: ${text}`);
    }
}

// --- Notifications ---

export interface GitHubNotification {
    id: string;
    unread: boolean;
    reason: string;
    updated_at: string;
    last_read_at: string | null;
    subject: {
        title: string;
        url: string | null;
        latest_comment_url: string | null;
        type: string;
    };
    repository: {
        id: number;
        full_name: string;
        owner: { login: string; avatar_url: string };
        name: string;
    };
    url: string;
}

export async function fetchNotifications(
    all: boolean = false,
    participating: boolean = false,
): Promise<GitHubNotification[]> {
    return fetchWithCache(
        `notifications:${all}:${participating}`,
        CACHE_TTL_SHORT,
        () =>
            ghFetch<GitHubNotification[]>(
                `/notifications?all=${all}&participating=${participating}&per_page=50`,
            ),
    );
}

export async function markNotificationRead(threadId: string): Promise<void> {
    const token = useAuthStore.getState().token;
    await fetch(`${API}/notifications/threads/${threadId}`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": APP_USER_AGENT,
        },
    });
}

export async function markNotificationDone(threadId: string): Promise<void> {
    const token = useAuthStore.getState().token;
    await fetch(`${API}/notifications/threads/${threadId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": APP_USER_AGENT,
        },
    });
}

export async function markAllNotificationsRead(): Promise<void> {
    const token = useAuthStore.getState().token;
    await fetch(`${API}/notifications`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": APP_USER_AGENT,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
    });
}

// --- Copilot Agents ---

export async function fetchCopilotIssues(
    owner: string,
    name: string,
): Promise<GitHubIssue[]> {
    return ghFetch<GitHubIssue[]>(
        `/repos/${owner}/${name}/issues?assignee=copilot&state=all&per_page=30`,
    );
}

export async function assignCopilotToIssue(
    owner: string,
    name: string,
    issueNumber: number,
): Promise<GitHubIssue> {
    return ghPost<GitHubIssue>(
        `/repos/${owner}/${name}/issues/${issueNumber}/assignees`,
        { assignees: ["copilot"] },
    );
}

export async function createCopilotTask(
    owner: string,
    name: string,
    title: string,
    body: string,
): Promise<GitHubIssue> {
    return ghPost<GitHubIssue>(`/repos/${owner}/${name}/issues`, {
        title,
        body,
        assignees: ["copilot"],
    });
}

// --- Environments ---

export interface GitHubEnvironment {
    id: number;
    name: string;
    html_url: string;
    created_at: string;
    updated_at: string;
    protection_rules: {
        id: number;
        type: string;
        wait_timer?: number;
        reviewers?: { type: string; reviewer: { login: string; avatar_url: string } }[];
    }[];
    deployment_branch_policy: {
        protected_branches: boolean;
        custom_branch_policies: boolean;
    } | null;
}

export interface GitHubDeployment {
    id: number;
    sha: string;
    ref: string;
    task: string;
    environment: string;
    description: string | null;
    creator: { login: string; avatar_url: string } | null;
    created_at: string;
    updated_at: string;
    statuses_url: string;
    payload: Record<string, unknown>;
}

export interface GitHubDeploymentStatus {
    id: number;
    state: string;
    description: string | null;
    environment: string;
    created_at: string;
    creator: { login: string; avatar_url: string } | null;
    environment_url: string | null;
    log_url: string | null;
}

export async function fetchEnvironments(
    owner: string,
    name: string,
): Promise<GitHubEnvironment[]> {
    const data = await ghFetch<{ total_count: number; environments: GitHubEnvironment[] }>(
        `/repos/${owner}/${name}/environments`,
    );
    return data.environments;
}

export async function fetchDeployments(
    owner: string,
    name: string,
    environment?: string,
): Promise<GitHubDeployment[]> {
    const envParam = environment ? `&environment=${encodeURIComponent(environment)}` : "";
    return ghFetch<GitHubDeployment[]>(
        `/repos/${owner}/${name}/deployments?per_page=20${envParam}`,
    );
}

export async function fetchDeploymentStatuses(
    owner: string,
    name: string,
    deploymentId: number,
): Promise<GitHubDeploymentStatus[]> {
    return ghFetch<GitHubDeploymentStatus[]>(
        `/repos/${owner}/${name}/deployments/${deploymentId}/statuses?per_page=5`,
    );
}

export async function fetchGitHubStatus(): Promise<{
    indicator: string;
    description: string;
}> {
    return fetchWithCache("github:status", CACHE_TTL_LONG, async () => {
        const response = await fetch(
            "https://www.githubstatus.com/api/v2/status.json",
            { method: "GET", headers: { Accept: "application/json" } },
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return data.status;
    });
}
