import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Folder,
    File,
    GitBranch,
    Star,
    CircleDot,
    GitPullRequest,
    GitCommit,
    Loader2,
    ChevronRight,
    ChevronDown,
    PlayCircle,
    CheckCircle,
    XCircle,
    Clock,
    MinusCircle,
    Tag,
    Users,
    Shield,
    Package,
    Download,
    Pencil,
    Trash2,
    Eye,
    FilePlus,
    Image as ImageIcon,
    GitFork,
    Bell,
    BellOff,
    ExternalLink,
    Scale,
    Archive,
    Plus,
    Send,
    Upload,
    Key,
    Webhook,
    UserPlus,
    UserMinus,
    AlertTriangle,
    Lock,
    ShieldCheck,
    ShieldAlert,
    Settings,
    Trash,
    ToggleLeft,
    ToggleRight,
    MoreHorizontal,
    Sparkles,
} from "lucide-react";
import hljs from "highlight.js";
import DOMPurify from "dompurify";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import {
    fetchRepoDetail,
    fetchRepoContents,
    fetchFileContent,
    fetchFileInfo,
    fetchRepoIssues,
    fetchRepoPRs,
    fetchRepoCommits,
    fetchWorkflowRuns,
    fetchRepoReleases,
    fetchRepoBranches,
    fetchRepoContributors,
    createOrUpdateFile,
    deleteFile,
    fetchRepoLanguages,
    isRepoStarred,
    starRepo,
    unstarRepo,
    isRepoWatched,
    watchRepo,
    unwatchRepo,
    forkRepo,
    createIssue,
    createPR,
    createRelease,
    fetchDependabotAlerts,
    fetchCodeScanningAlerts,
    fetchSecretScanningAlerts,
    dismissDependabotAlert,
    dismissCodeScanningAlert,
    dismissSecretScanningAlert,
    fetchCollaborators,
    addCollaborator,
    removeCollaborator,
    fetchDeployKeys,
    addDeployKey,
    removeDeployKey,
    fetchWebhooks,
    createWebhook,
    deleteWebhook,
    fetchBranchProtection,
    updateRepo,
    deleteRepo,
    fetchCopilotIssues,
    createCopilotTask,
    fetchEnvironments,
    fetchDeployments,
    fetchDeploymentStatuses,
    langColor,
    timeAgo,
    detectLanguage,
    type GitHubRepo,
    type GitHubContent,
    type GitHubIssue,
    type GitHubRepoPR,
    type GitHubCommit,
    type GitHubWorkflowRun,
    type GitHubRelease,
    type GitHubBranch,
    type GitHubContributor,
    type GitHubDependabotAlert,
    type GitHubCodeScanAlert,
    type GitHubSecretAlert,
    type GitHubCollaborator,
    type GitHubDeployKey,
    type GitHubWebhook,
    type GitHubBranchProtection,
    type GitHubEnvironment,
    type GitHubDeployment,
    type GitHubDeploymentStatus,
} from "../lib/github";
import { useAuthStore } from "../stores/authStore";

type Tab =
    | "code"
    | "issues"
    | "prs"
    | "commits"
    | "actions"
    | "releases"
    | "branches"
    | "contributors"
    | "security"
    | "agents"
    | "environments"
    | "settings";

function ResponsiveTabs({
    tabs,
    activeTab,
    onTabChange,
}: {
    tabs: { id: Tab; label: string; icon: React.ElementType }[];
    activeTab: Tab;
    onTabChange: (id: Tab) => void;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [visibleCount, setVisibleCount] = useState(tabs.length);
    const [moreOpen, setMoreOpen] = useState(false);
    const moreRef = useRef<HTMLDivElement>(null);
    const measureRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const measure = () => {
            const container = containerRef.current;
            const hidden = measureRef.current;
            if (!container || !hidden) return;

            const containerWidth = container.offsetWidth;
            const moreButtonWidth = 48; // approximate width of "..." button
            const buttons = hidden.children;
            let totalWidth = 0;
            let count = 0;

            for (let i = 0; i < buttons.length; i++) {
                const w = (buttons[i] as HTMLElement).offsetWidth;
                const nextTotal = totalWidth + w;
                if (nextTotal > containerWidth - moreButtonWidth && i < buttons.length - 1) {
                    break;
                }
                if (nextTotal > containerWidth) {
                    break;
                }
                totalWidth = nextTotal;
                count++;
            }

            setVisibleCount(count);
        };

        measure();
        const observer = new ResizeObserver(measure);
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [tabs]);

    useEffect(() => {
        if (!moreOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
                setMoreOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [moreOpen]);

    const visibleTabs = tabs.slice(0, visibleCount);
    const overflowTabs = tabs.slice(visibleCount);

    // If active tab is in overflow, swap it with the last visible tab
    const activeInOverflow = overflowTabs.find((t) => t.id === activeTab);
    if (activeInOverflow && visibleTabs.length > 0) {
        const lastIdx = visibleTabs.length - 1;
        const swapped = visibleTabs[lastIdx];
        visibleTabs[lastIdx] = activeInOverflow;
        const oIdx = overflowTabs.indexOf(activeInOverflow);
        overflowTabs[oIdx] = swapped;
    }

    return (
        <div
            ref={containerRef}
            className="relative flex border-b mb-4"
            style={{ borderColor: "var(--border)" }}
        >
            {/* Hidden measure row */}
            <div
                ref={measureRef}
                className="flex absolute invisible pointer-events-none"
                style={{ top: 0, left: 0 }}
                aria-hidden
            >
                {tabs.map((t) => (
                    <div
                        key={t.id}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap"
                    >
                        <t.icon className="w-3.5 h-3.5" /> {t.label}
                    </div>
                ))}
            </div>

            {visibleTabs.map((t) => (
                <button
                    key={t.id}
                    onClick={() => onTabChange(t.id)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap"
                    style={{
                        borderColor:
                            activeTab === t.id ? "var(--accent)" : "transparent",
                        color:
                            activeTab === t.id
                                ? "var(--text-primary)"
                                : "var(--text-secondary)",
                    }}
                >
                    <t.icon className="w-3.5 h-3.5" /> {t.label}
                </button>
            ))}

            {overflowTabs.length > 0 && (
                <div ref={moreRef} className="relative -mb-px">
                    <button
                        onClick={() => setMoreOpen((v) => !v)}
                        className="flex items-center px-3 py-2 text-sm font-medium border-b-2 transition-colors"
                        style={{
                            borderColor: "transparent",
                            color: "var(--text-secondary)",
                        }}
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {moreOpen && (
                        <div
                            className="absolute right-0 top-full mt-1 py-1 rounded-lg border shadow-lg z-50 min-w-[180px]"
                            style={{
                                background: "var(--bg-secondary)",
                                borderColor: "var(--border)",
                            }}
                        >
                            {overflowTabs.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => {
                                        onTabChange(t.id);
                                        setMoreOpen(false);
                                    }}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors hover:opacity-80"
                                    style={{
                                        color:
                                            activeTab === t.id
                                                ? "var(--accent)"
                                                : "var(--text-secondary)",
                                    }}
                                >
                                    <t.icon className="w-3.5 h-3.5" /> {t.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function splitAssetReference(reference: string) {
    const [pathWithQuery, hash = ""] = reference.split("#");
    const [pathname, query = ""] = pathWithQuery.split("?");

    return {
        pathname,
        suffix: `${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`,
    };
}

function normalizeRepoPath(baseDir: string, assetPath: string): string | null {
    if (
        !assetPath ||
        assetPath.startsWith("#") ||
        /^(?:[a-z]+:)?\/\//i.test(assetPath) ||
        /^(?:data|blob|javascript|mailto|tel):/i.test(assetPath)
    ) {
        return null;
    }

    const { pathname } = splitAssetReference(assetPath);
    const seed = pathname.startsWith("/")
        ? pathname.slice(1).split("/")
        : [...(baseDir ? baseDir.split("/") : []), ...pathname.split("/")];
    const normalized: string[] = [];

    for (const segment of seed) {
        if (!segment || segment === ".") {
            continue;
        }

        if (segment === "..") {
            normalized.pop();
            continue;
        }

        normalized.push(segment);
    }

    return normalized.join("/");
}

function toRawGitHubUrl(
    owner: string,
    name: string,
    branch: string,
    repoPath: string,
    suffix = "",
) {
    return `https://raw.githubusercontent.com/${owner}/${name}/${branch}/${repoPath}${suffix}`;
}

function rewriteAssetReference(
    assetValue: string,
    owner: string,
    name: string,
    branch: string,
    baseDir: string,
) {
    const repoPath = normalizeRepoPath(baseDir, assetValue);
    if (!repoPath) {
        return null;
    }

    const { suffix } = splitAssetReference(assetValue);
    return toRawGitHubUrl(owner, name, branch, repoPath, suffix);
}

function rewriteCssUrls(
    css: string,
    owner: string,
    name: string,
    branch: string,
    baseDir: string,
) {
    return css
        .replace(/url\(([^)]+)\)/g, (match, rawValue: string) => {
            const trimmed = rawValue.trim().replace(/^['"]|['"]$/g, "");
            const rewritten = rewriteAssetReference(
                trimmed,
                owner,
                name,
                branch,
                baseDir,
            );

            if (!rewritten) {
                return match;
            }

            return `url("${rewritten}")`;
        })
        .replace(
            /@import\s+(?:url\()?\s*(['"]?)([^'")\s]+)\1\s*\)?/g,
            (match, _quote: string, rawValue: string) => {
                const rewritten = rewriteAssetReference(
                    rawValue,
                    owner,
                    name,
                    branch,
                    baseDir,
                );

                if (!rewritten) {
                    return match;
                }

                return `@import url("${rewritten}")`;
            },
        );
}

function rewriteSrcsetUrls(
    srcset: string,
    owner: string,
    name: string,
    branch: string,
    baseDir: string,
) {
    return srcset
        .split(",")
        .map((candidate) => {
            const trimmed = candidate.trim();
            if (!trimmed) {
                return candidate;
            }

            const [assetPath, ...descriptorParts] = trimmed.split(/\s+/);
            const rewritten = rewriteAssetReference(
                assetPath,
                owner,
                name,
                branch,
                baseDir,
            );

            if (!rewritten) {
                return trimmed;
            }

            return [rewritten, ...descriptorParts].join(" ");
        })
        .join(", ");
}

function upsertMetaHttpEquiv(
    doc: Document,
    httpEquiv: string,
    content: string,
) {
    let meta = Array.from(
        doc.querySelectorAll(`meta[http-equiv="${httpEquiv}"]`),
    )[0];

    if (!meta) {
        meta = doc.createElement("meta");
        meta.setAttribute("http-equiv", httpEquiv);
        if (doc.head) {
            doc.head.prepend(meta);
        }
    }

    meta.setAttribute("content", content);
}

function injectPreviewCsp(doc: Document, interactive: boolean) {
    const csp = interactive
        ? "default-src 'self' https: data: blob:; script-src 'unsafe-inline' 'unsafe-eval' https: blob:; style-src 'unsafe-inline' https:; img-src https: data: blob:; font-src https: data: blob:; media-src https: data: blob:; connect-src https: http:; frame-src https: blob: data:; worker-src blob: https:; object-src 'none';"
        : "default-src 'self' https: data: blob:; script-src 'none'; style-src 'unsafe-inline' https:; img-src https: data: blob:; font-src https: data: blob:; media-src https: data: blob:; frame-src https: blob: data:; object-src 'none';";

    upsertMetaHttpEquiv(doc, "Content-Security-Policy", csp);
}

function cloneInteractiveScripts(
    sourceDoc: Document,
    targetDoc: Document,
    owner: string,
    name: string,
    branch: string,
    baseDir: string,
) {
    const scripts = Array.from(sourceDoc.querySelectorAll("script"));

    for (const script of scripts) {
        const nextScript = targetDoc.createElement("script");

        for (const attribute of Array.from(script.attributes)) {
            if (/^on/i.test(attribute.name)) {
                continue;
            }

            if (attribute.name === "src") {
                const rewritten = rewriteAssetReference(
                    attribute.value,
                    owner,
                    name,
                    branch,
                    baseDir,
                );
                nextScript.setAttribute("src", rewritten ?? attribute.value);
                continue;
            }

            nextScript.setAttribute(attribute.name, attribute.value);
        }

        if (!script.src && script.textContent) {
            nextScript.textContent = script.textContent;
        }

        if (targetDoc.body) {
            targetDoc.body.append(nextScript);
        } else if (targetDoc.head) {
            targetDoc.head.append(nextScript);
        }
    }
}

const RepoDetail: React.FC = () => {
    const { owner, name } = useParams<{ owner: string; name: string }>();
    const navigate = useNavigate();
    const [repo, setRepo] = useState<GitHubRepo | null>(null);
    const [tab, setTab] = useState<Tab>("code");
    const [loading, setLoading] = useState(true);
    const [branches, setBranches] = useState<GitHubBranch[]>([]);
    const [selectedBranch, setSelectedBranch] = useState("");
    const [branchOpen, setBranchOpen] = useState(false);

    // Star / Watch / Fork state
    const [starred, setStarred] = useState(false);
    const [watched, setWatched] = useState(false);
    const [starLoading, setStarLoading] = useState(false);
    const [watchLoading, setWatchLoading] = useState(false);
    const [forkLoading, setForkLoading] = useState(false);

    // Languages breakdown
    const [languages, setLanguages] = useState<Record<string, number>>({});

    const currentUser = useAuthStore((s) => s.user);

    useEffect(() => {
        if (!owner || !name) return;
        fetchRepoDetail(owner, name)
            .then((r) => {
                setRepo(r);
                setSelectedBranch(r.default_branch);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
        fetchRepoBranches(owner, name)
            .then(setBranches)
            .catch(() => {});
        isRepoStarred(owner, name)
            .then(setStarred)
            .catch(() => {});
        isRepoWatched(owner, name)
            .then(setWatched)
            .catch(() => {});
        fetchRepoLanguages(owner, name)
            .then(setLanguages)
            .catch(() => {});
    }, [owner, name]);

    const toggleStar = async () => {
        if (!owner || !name || starLoading) return;
        setStarLoading(true);
        try {
            if (starred) {
                await unstarRepo(owner, name);
                setStarred(false);
                if (repo)
                    setRepo({
                        ...repo,
                        stargazers_count: repo.stargazers_count - 1,
                    });
            } else {
                await starRepo(owner, name);
                setStarred(true);
                if (repo)
                    setRepo({
                        ...repo,
                        stargazers_count: repo.stargazers_count + 1,
                    });
            }
        } catch {}
        setStarLoading(false);
    };

    const toggleWatch = async () => {
        if (!owner || !name || watchLoading) return;
        setWatchLoading(true);
        try {
            if (watched) {
                await unwatchRepo(owner, name);
                setWatched(false);
            } else {
                await watchRepo(owner, name);
                setWatched(true);
            }
        } catch {}
        setWatchLoading(false);
    };

    const doFork = async () => {
        if (!owner || !name || forkLoading) return;
        setForkLoading(true);
        try {
            const forked = await forkRepo(owner, name);
            navigate(`/repos/${forked.owner.login}/${forked.name}`);
        } catch {}
        setForkLoading(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2
                    className="w-6 h-6 animate-spin"
                    style={{ color: "var(--text-tertiary)" }}
                />
            </div>
        );
    }

    if (!repo || !owner || !name) {
        return (
            <div className="p-6">
                <p style={{ color: "var(--text-tertiary)" }}>
                    Repository not found.
                </p>
            </div>
        );
    }

    const isOwner = currentUser?.login === owner;

    const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
        { id: "code", label: "Code", icon: File },
        { id: "issues", label: "Issues", icon: CircleDot },
        { id: "prs", label: "Pull Requests", icon: GitPullRequest },
        { id: "commits", label: "Commits", icon: GitCommit },
        { id: "actions", label: "Actions", icon: PlayCircle },
        { id: "releases", label: "Releases", icon: Tag },
        { id: "branches", label: "Branches", icon: GitBranch },
        { id: "contributors", label: "Contributors", icon: Users },
        { id: "security", label: "Security", icon: Shield },
        { id: "agents", label: "Agents", icon: Send },
        { id: "environments", label: "Environments", icon: Archive },
        ...(isOwner
            ? [{ id: "settings" as Tab, label: "Settings", icon: Settings }]
            : []),
    ];

    const langTotal = Object.values(languages).reduce((a, b) => a + b, 0);

    return (
        <div className="p-6 w-full">
            <div className="flex items-start gap-3 mb-4">
                <button
                    onClick={() => navigate("/repos")}
                    className="p-1 rounded hover:bg-[var(--bg-tertiary)] mt-0.5"
                >
                    <ArrowLeft
                        className="w-4 h-4"
                        style={{ color: "var(--text-secondary)" }}
                    />
                </button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1
                            className="text-lg font-semibold"
                            style={{ color: "var(--text-primary)" }}
                        >
                            <span style={{ color: "var(--text-secondary)" }}>
                                {owner} /{" "}
                            </span>
                            {name}
                        </h1>
                        {repo.archived && (
                            <span
                                className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border"
                                style={{
                                    borderColor: "var(--warning)",
                                    color: "var(--warning)",
                                }}
                            >
                                <Archive className="w-2.5 h-2.5" /> Archived
                            </span>
                        )}
                        {repo.private && (
                            <span
                                className="text-[10px] px-1.5 py-0.5 rounded-full border"
                                style={{
                                    borderColor: "var(--border)",
                                    color: "var(--text-secondary)",
                                }}
                            >
                                Private
                            </span>
                        )}
                    </div>
                    {repo.description && (
                        <p
                            className="text-sm mt-0.5"
                            style={{ color: "var(--text-secondary)" }}
                        >
                            {repo.description}
                        </p>
                    )}
                    {repo.fork && repo.parent && (
                        <p
                            className="text-xs mt-0.5"
                            style={{ color: "var(--text-tertiary)" }}
                        >
                            forked from{" "}
                            <span
                                className="cursor-pointer hover:underline"
                                style={{ color: "var(--accent)" }}
                                onClick={() =>
                                    navigate(`/repos/${repo.parent!.full_name}`)
                                }
                            >
                                {repo.parent.full_name}
                            </span>
                        </p>
                    )}
                    {/* Topics */}
                    {repo.topics && repo.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            {repo.topics.map((t) => (
                                <span
                                    key={t}
                                    onClick={() => navigate(`/search?q=topic:${t}`)}
                                    className="text-[10px] px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80"
                                    style={{
                                        background: "rgba(0,122,255,0.1)",
                                        color: "var(--accent)",
                                    }}
                                >
                                    {t}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={() => navigate(`/wiki/${owner}/${name}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-[var(--bg-tertiary)] transition-colors"
                        style={{
                            borderColor: "var(--accent)",
                            background: "rgba(0,122,255,0.08)",
                            color: "var(--accent)",
                        }}
                    >
                        <Sparkles className="w-3 h-3" />
                        Code Wiki
                    </button>
                    <button
                        onClick={toggleWatch}
                        disabled={watchLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-[var(--bg-tertiary)] transition-colors"
                        style={{
                            borderColor: "var(--border)",
                            background: "var(--bg-secondary)",
                            color: watched
                                ? "var(--accent)"
                                : "var(--text-primary)",
                        }}
                    >
                        {watchLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : watched ? (
                            <BellOff className="w-3 h-3" />
                        ) : (
                            <Bell className="w-3 h-3" />
                        )}
                        {watched ? "Unwatch" : "Watch"}
                    </button>
                    <button
                        onClick={toggleStar}
                        disabled={starLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-[var(--bg-tertiary)] transition-colors"
                        style={{
                            borderColor: "var(--border)",
                            background: "var(--bg-secondary)",
                            color: starred
                                ? "var(--warning)"
                                : "var(--text-primary)",
                        }}
                    >
                        {starLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <Star
                                className="w-3 h-3"
                                style={
                                    starred ? { fill: "var(--warning)" } : {}
                                }
                            />
                        )}
                        {starred ? "Starred" : "Star"}
                        <span
                            className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px]"
                            style={{ background: "var(--bg-tertiary)" }}
                        >
                            {repo.stargazers_count}
                        </span>
                    </button>
                    <button
                        onClick={doFork}
                        disabled={forkLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-[var(--bg-tertiary)] transition-colors"
                        style={{
                            borderColor: "var(--border)",
                            background: "var(--bg-secondary)",
                            color: "var(--text-primary)",
                        }}
                    >
                        {forkLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <GitFork className="w-3 h-3" />
                        )}
                        Fork
                        <span
                            className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px]"
                            style={{ background: "var(--bg-tertiary)" }}
                        >
                            {repo.forks_count}
                        </span>
                    </button>
                </div>
            </div>

            {/* Stats + meta row */}
            <div
                className="flex items-center gap-4 text-xs mb-2"
                style={{ color: "var(--text-tertiary)" }}
            >
                {repo.language && (
                    <span className="flex items-center gap-1">
                        <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ background: langColor(repo.language) }}
                        />{" "}
                        {repo.language}
                    </span>
                )}
                <span className="flex items-center gap-1">
                    <Star className="w-3 h-3" /> {repo.stargazers_count}
                </span>
                <span className="flex items-center gap-1">
                    <GitBranch className="w-3 h-3" /> {repo.forks_count}
                </span>
                <span className="flex items-center gap-1">
                    <CircleDot className="w-3 h-3" /> {repo.open_issues_count}{" "}
                    issues
                </span>
                {repo.license && (
                    <span className="flex items-center gap-1">
                        <Scale className="w-3 h-3" /> {repo.license.spdx_id}
                    </span>
                )}
                {repo.homepage && (
                    <a
                        href={repo.homepage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:underline"
                        style={{ color: "var(--accent)" }}
                    >
                        <ExternalLink className="w-3 h-3" /> Website
                    </a>
                )}
            </div>

            {/* Languages bar */}
            {langTotal > 0 && (
                <div className="mb-4">
                    <div className="flex h-2 rounded-full overflow-hidden">
                        {Object.entries(languages).map(([lang, bytes]) => (
                            <div
                                key={lang}
                                style={{
                                    width: `${(bytes / langTotal) * 100}%`,
                                    background: langColor(lang),
                                }}
                                title={`${lang}: ${((bytes / langTotal) * 100).toFixed(1)}%`}
                            />
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                        {Object.entries(languages)
                            .slice(0, 6)
                            .map(([lang, bytes]) => (
                                <span
                                    key={lang}
                                    className="flex items-center gap-1 text-[10px]"
                                    style={{ color: "var(--text-tertiary)" }}
                                >
                                    <span
                                        className="w-2 h-2 rounded-full"
                                        style={{ background: langColor(lang) }}
                                    />
                                    {lang}{" "}
                                    {((bytes / langTotal) * 100).toFixed(1)}%
                                </span>
                            ))}
                    </div>
                </div>
            )}

            {/* Branch selector */}
            {branches.length > 1 && (
                <div className="relative mb-4 inline-block">
                    <button
                        onClick={() => setBranchOpen(!branchOpen)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-[var(--bg-tertiary)] transition-colors"
                        style={{
                            borderColor: "var(--border)",
                            background: "var(--bg-secondary)",
                            color: "var(--text-primary)",
                        }}
                    >
                        <GitBranch
                            className="w-3 h-3"
                            style={{ color: "var(--text-tertiary)" }}
                        />
                        <span className="font-mono">{selectedBranch}</span>
                        <ChevronDown
                            className="w-3 h-3"
                            style={{ color: "var(--text-tertiary)" }}
                        />
                    </button>
                    {branchOpen && (
                        <div
                            className="absolute top-full left-0 mt-1 z-50 border rounded-lg shadow-lg overflow-auto max-h-64 min-w-[200px]"
                            style={{
                                borderColor: "var(--border)",
                                background: "var(--bg-secondary)",
                            }}
                        >
                            {branches.map((b) => (
                                <button
                                    key={b.name}
                                    className="w-full text-left px-3 py-2 text-xs font-mono hover:bg-[var(--bg-tertiary)] transition-colors flex items-center gap-2"
                                    style={{
                                        color:
                                            b.name === selectedBranch
                                                ? "var(--accent)"
                                                : "var(--text-primary)",
                                    }}
                                    onClick={() => {
                                        setSelectedBranch(b.name);
                                        setBranchOpen(false);
                                    }}
                                >
                                    <GitBranch
                                        className="w-3 h-3 flex-shrink-0"
                                        style={{
                                            color:
                                                b.name === selectedBranch
                                                    ? "var(--accent)"
                                                    : "var(--text-tertiary)",
                                        }}
                                    />
                                    {b.name}
                                    {b.name === repo.default_branch && (
                                        <span
                                            className="text-[9px] px-1 py-0.5 rounded-full ml-auto"
                                            style={{
                                                background:
                                                    "rgba(0,122,255,0.1)",
                                                color: "var(--accent)",
                                            }}
                                        >
                                            default
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <ResponsiveTabs tabs={tabs} activeTab={tab} onTabChange={setTab} />

            {tab === "code" && (
                <CodeTab owner={owner} name={name} branch={selectedBranch} />
            )}
            {tab === "issues" && <IssuesTab owner={owner} name={name} />}
            {tab === "prs" && (
                <PRsTab owner={owner} name={name} branches={branches} />
            )}
            {tab === "commits" && (
                <CommitsTab owner={owner} name={name} branch={selectedBranch} />
            )}
            {tab === "actions" && <ActionsTab owner={owner} name={name} />}
            {tab === "releases" && <ReleasesTab owner={owner} name={name} />}
            {tab === "branches" && (
                <BranchesTab
                    owner={owner}
                    name={name}
                    defaultBranch={repo.default_branch}
                    onSelectBranch={(b) => {
                        setSelectedBranch(b);
                        setTab("code");
                    }}
                />
            )}
            {tab === "contributors" && (
                <ContributorsTab owner={owner} name={name} />
            )}
            {tab === "security" && <SecurityTab owner={owner} name={name} />}
            {tab === "agents" && <AgentsTab owner={owner} name={name} />}
            {tab === "environments" && <EnvironmentsTab owner={owner} name={name} />}
            {tab === "settings" && (
                <SettingsTab
                    owner={owner}
                    name={name}
                    repo={repo}
                    onUpdate={(r) => setRepo(r)}
                    navigate={navigate}
                />
            )}
        </div>
    );
};

// --- Helpers ---

const IMAGE_EXTS = new Set([
    "png",
    "jpg",
    "jpeg",
    "gif",
    "svg",
    "webp",
    "ico",
    "bmp",
    "avif",
]);
const MARKDOWN_EXTS = new Set(["md", "mdx", "markdown"]);
const HTML_EXTS = new Set(["html", "htm"]);
const isImageFile = (f: string) =>
    IMAGE_EXTS.has(f.split(".").pop()?.toLowerCase() || "");
const isMarkdownFile = (f: string) =>
    MARKDOWN_EXTS.has(f.split(".").pop()?.toLowerCase() || "");
const isHtmlFile = (f: string) =>
    HTML_EXTS.has(f.split(".").pop()?.toLowerCase() || "");

// --- Code Tab with highlight.js + edit/commit/preview ---

const CodeTab: React.FC<{ owner: string; name: string; branch: string }> = ({
    owner,
    name,
    branch,
}) => {
    const [contents, setContents] = useState<GitHubContent[]>([]);
    const [currentPath, setCurrentPath] = useState("");
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFileView, setIsFileView] = useState(false);
    const codeRef = useRef<HTMLElement>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // Edit state
    const [editing, setEditing] = useState(false);
    const [editContent, setEditContent] = useState("");
    const [fileSha, setFileSha] = useState<string | null>(null);
    const [commitMsg, setCommitMsg] = useState("");
    const [saving, setSaving] = useState(false);
    const [showCommitDialog, setShowCommitDialog] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // New file state
    const [creating, setCreating] = useState(false);
    const [newFileName, setNewFileName] = useState("");
    const [newFileContent, setNewFileContent] = useState("");
    const [newFileCommitMsg, setNewFileCommitMsg] = useState("");

    // Markdown/HTML preview & delete
    const [showPreview, setShowPreview] = useState(false);
    const [resolvedHtml, setResolvedHtml] = useState<string | null>(null);
    const [resolvedHtmlUrl, setResolvedHtmlUrl] = useState<string | null>(null);
    const [interactiveHtmlPreview, setInteractiveHtmlPreview] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        setCurrentPath("");
        setFileContent(null);
        setEditing(false);
        setCreating(false);
        setIsFileView(false);
    }, [branch]);

    useEffect(() => {
        setLoading(true);
        setFileContent(null);
        setContents([]);
        setIsFileView(false);
        setFileSha(null);
        setEditing(false);
        setSaveSuccess(false);
        setSaveError(null);
        setShowPreview(false);
        setInteractiveHtmlPreview(false);
        setShowDeleteConfirm(false);

        fetchRepoContents(owner, name, currentPath, branch)
            .then((items) => {
                setIsFileView(false);
                setContents(
                    [...items].sort((a, b) => {
                        if (a.type === "dir" && b.type !== "dir") return -1;
                        if (a.type !== "dir" && b.type === "dir") return 1;
                        return a.name.localeCompare(b.name);
                    }),
                );
            })
            .catch(() => {
                setIsFileView(true);
                const fn = currentPath.split("/").pop() || "";
                if (!isImageFile(fn)) {
                    fetchFileContent(owner, name, currentPath, branch)
                        .then(setFileContent)
                        .catch(() => {});
                }
                fetchFileInfo(owner, name, currentPath, branch)
                    .then((info) => setFileSha(info.sha))
                    .catch(() => {});
            })
            .finally(() => setLoading(false));
    }, [owner, name, currentPath, branch, refreshKey]);

    useEffect(() => {
        if (
            fileContent !== null &&
            codeRef.current &&
            !editing &&
            !showPreview
        ) {
            codeRef.current.removeAttribute("data-highlighted");
            hljs.highlightElement(codeRef.current);
        }
    }, [fileContent, currentPath, editing, showPreview]);

    const breadcrumbs = currentPath ? currentPath.split("/") : [];
    const fileName = breadcrumbs[breadcrumbs.length - 1] || "";
    const lang = detectLanguage(fileName);
    const isImage = isImageFile(fileName);
    const isMd = isMarkdownFile(fileName);
    const isHtml = isHtmlFile(fileName);

    // Resolve linked CSS/JS for HTML preview
    useEffect(() => {
        if (!showPreview || !isHtml || fileContent === null) {
            setResolvedHtml(null);
            return;
        }
        let cancelled = false;
        const dirPath = currentPath.split("/").slice(0, -1).join("/");
        const sourceDoc = new DOMParser().parseFromString(fileContent, "text/html");

        (async () => {
            const sanitizedHtml = DOMPurify.sanitize(fileContent, {
                WHOLE_DOCUMENT: true,
                ADD_TAGS: ["base", "body", "head", "html", "link", "meta", "style", "title"],
                ADD_ATTR: [
                    "alt",
                    "charset",
                    "class",
                    "content",
                    "href",
                    "http-equiv",
                    "id",
                    "media",
                    "name",
                    "poster",
                    "rel",
                    "sizes",
                    "src",
                    "srcset",
                    "style",
                    "type",
                ],
                FORBID_TAGS: ["script"],
            });
            const parser = new DOMParser();
            const doc = parser.parseFromString(sanitizedHtml, "text/html");

            for (const element of Array.from(doc.querySelectorAll("*"))) {
                for (const attribute of Array.from(element.attributes)) {
                    if (/^on/i.test(attribute.name)) {
                        element.removeAttribute(attribute.name);
                    }
                }
            }

            const baseHref = `${toRawGitHubUrl(
                owner,
                name,
                branch,
                dirPath ? `${dirPath}/` : "",
            )}`;
            let baseEl = doc.querySelector("base");
            if (!baseEl) {
                baseEl = doc.createElement("base");
                if (doc.head) {
                    doc.head.prepend(baseEl);
                }
            }
            baseEl.setAttribute("href", baseHref);
            injectPreviewCsp(doc, interactiveHtmlPreview);

            // Inline linked stylesheets: <link rel="stylesheet" href="...">
            const linkEls = Array.from(
                doc.querySelectorAll('link[rel="stylesheet"][href]'),
            );
            for (const link of linkEls) {
                const href = link.getAttribute("href")!;
                const repoPath = normalizeRepoPath(dirPath, href);
                if (!repoPath) continue;
                try {
                    const css = rewriteCssUrls(
                        await fetchFileContent(
                            owner,
                            name,
                            repoPath,
                            branch,
                        ),
                        owner,
                        name,
                        branch,
                        repoPath.split("/").slice(0, -1).join("/"),
                    );
                    if (cancelled) return;
                    const style = doc.createElement("style");
                    style.textContent = css;
                    link.replaceWith(style);
                } catch {
                    /* skip if not found */
                }
            }

            for (const styleEl of Array.from(doc.querySelectorAll("style"))) {
                styleEl.textContent = rewriteCssUrls(
                    styleEl.textContent || "",
                    owner,
                    name,
                    branch,
                    dirPath,
                );
            }

            for (const element of Array.from(doc.querySelectorAll("[style]"))) {
                const styleValue = element.getAttribute("style");
                if (!styleValue) continue;
                element.setAttribute(
                    "style",
                    rewriteCssUrls(styleValue, owner, name, branch, dirPath),
                );
            }

            for (const element of Array.from(doc.querySelectorAll("[srcset]"))) {
                const srcset = element.getAttribute("srcset");
                if (!srcset) continue;
                element.setAttribute(
                    "srcset",
                    rewriteSrcsetUrls(srcset, owner, name, branch, dirPath),
                );
            }

            // Resolve remaining local asset URLs to raw.githubusercontent.com
            const assetAttrs = [
                ["img[src]", "src"],
                ["source[src]", "src"],
                ["video[poster]", "poster"],
                ["audio[src]", "src"],
                ["object[data]", "data"],
                ["link[href]", "href"],
            ] as const;

            for (const [selector, attribute] of assetAttrs) {
                const elements = Array.from(doc.querySelectorAll(selector));
                for (const element of elements) {
                    const value = element.getAttribute(attribute);
                    if (!value) continue;
                    const repoPath = normalizeRepoPath(dirPath, value);
                    if (!repoPath) continue;
                    const { suffix } = splitAssetReference(value);
                    element.setAttribute(
                        attribute,
                        toRawGitHubUrl(owner, name, branch, repoPath, suffix),
                    );
                }
            }

            if (interactiveHtmlPreview) {
                cloneInteractiveScripts(
                    sourceDoc,
                    doc,
                    owner,
                    name,
                    branch,
                    dirPath,
                );
            }

            if (!cancelled) setResolvedHtml(doc.documentElement.outerHTML);
        })();

        return () => {
            cancelled = true;
        };
    }, [
        showPreview,
        isHtml,
        fileContent,
        owner,
        name,
        currentPath,
        branch,
        interactiveHtmlPreview,
    ]);

    useEffect(() => {
        if (!resolvedHtml) {
            setResolvedHtmlUrl((currentUrl) => {
                if (currentUrl) {
                    URL.revokeObjectURL(currentUrl);
                }
                return null;
            });
            return;
        }

        const blob = new Blob([resolvedHtml], { type: "text/html;charset=utf-8" });
        const nextUrl = URL.createObjectURL(blob);

        setResolvedHtmlUrl((currentUrl) => {
            if (currentUrl) {
                URL.revokeObjectURL(currentUrl);
            }
            return nextUrl;
        });

        return () => {
            URL.revokeObjectURL(nextUrl);
        };
    }, [resolvedHtml]);

    const handleSave = async () => {
        if (!commitMsg.trim()) return;
        setSaving(true);
        setSaveError(null);
        try {
            await createOrUpdateFile(
                owner,
                name,
                currentPath,
                editContent,
                commitMsg,
                fileSha || undefined,
                branch,
            );
            setFileContent(editContent);
            setEditing(false);
            setSaveSuccess(true);
            setShowCommitDialog(false);
            fetchFileInfo(owner, name, currentPath, branch)
                .then((info) => setFileSha(info.sha))
                .catch(() => {});
        } catch (e: any) {
            setSaveError(e.message || "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!fileSha) return;
        setDeleting(true);
        try {
            await deleteFile(
                owner,
                name,
                currentPath,
                fileSha,
                `Delete ${fileName}`,
                branch,
            );
            const p = currentPath.split("/");
            p.pop();
            setCurrentPath(p.join("/"));
            setShowDeleteConfirm(false);
        } catch (e: any) {
            setSaveError(e.message || "Failed to delete");
        } finally {
            setDeleting(false);
        }
    };

    const handleCreateFile = async () => {
        if (!newFileName.trim() || !newFileCommitMsg.trim()) return;
        setSaving(true);
        setSaveError(null);
        try {
            const fullPath = currentPath
                ? `${currentPath}/${newFileName}`
                : newFileName;
            await createOrUpdateFile(
                owner,
                name,
                fullPath,
                newFileContent,
                newFileCommitMsg,
                undefined,
                branch,
            );
            setCreating(false);
            setNewFileName("");
            setNewFileContent("");
            setNewFileCommitMsg("");
            setRefreshKey((k) => k + 1);
        } catch (e: any) {
            setSaveError(e.message || "Failed to create file");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2
                    className="w-5 h-5 animate-spin"
                    style={{ color: "var(--text-tertiary)" }}
                />
            </div>
        );
    }

    // --- Creating new file ---
    if (creating) {
        return (
            <div>
                <Breadcrumbs
                    parts={breadcrumbs}
                    onNavigate={(p) => {
                        setCreating(false);
                        setCurrentPath(p);
                    }}
                />
                <div
                    className="border rounded-lg overflow-hidden mt-2"
                    style={{
                        borderColor: "var(--border)",
                        background: "var(--bg-secondary)",
                    }}
                >
                    <div
                        className="px-4 py-3 border-b flex items-center gap-3"
                        style={{
                            borderColor: "var(--border)",
                            background: "var(--bg-tertiary)",
                        }}
                    >
                        <FilePlus
                            className="w-4 h-4"
                            style={{ color: "var(--accent)" }}
                        />
                        <span
                            className="text-sm font-medium"
                            style={{ color: "var(--text-primary)" }}
                        >
                            New file in {currentPath || "/"}
                        </span>
                    </div>
                    <div className="p-4 space-y-3">
                        <input
                            value={newFileName}
                            onChange={(e) => setNewFileName(e.target.value)}
                            placeholder="filename.ext"
                            className="input-glass"
                            autoFocus
                        />
                        <textarea
                            value={newFileContent}
                            onChange={(e) => setNewFileContent(e.target.value)}
                            placeholder="File content..."
                            className="input-glass font-mono text-sm"
                            style={{ minHeight: 200, resize: "vertical" }}
                        />
                        <input
                            value={newFileCommitMsg}
                            onChange={(e) =>
                                setNewFileCommitMsg(e.target.value)
                            }
                            placeholder="Commit message"
                            className="input-glass"
                        />
                        {saveError && (
                            <p
                                className="text-xs"
                                style={{ color: "var(--error)" }}
                            >
                                {saveError}
                            </p>
                        )}
                        <div className="flex gap-2">
                            <button
                                onClick={handleCreateFile}
                                disabled={
                                    saving ||
                                    !newFileName.trim() ||
                                    !newFileCommitMsg.trim()
                                }
                                className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                            >
                                {saving ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <>
                                        <GitCommit className="w-3 h-3" /> Commit
                                        new file
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setCreating(false);
                                    setSaveError(null);
                                }}
                                className="btn-secondary text-xs px-3 py-1.5"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- File viewer (code, image, markdown) ---
    if (isFileView) {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${name}/${branch}/${currentPath}`;

        return (
            <div>
                <Breadcrumbs parts={breadcrumbs} onNavigate={setCurrentPath} />

                {saveSuccess && (
                    <div
                        className="mt-2 px-3 py-2 rounded-lg text-xs flex items-center gap-2"
                        style={{
                            background: "rgba(52,199,89,0.1)",
                            color: "var(--success)",
                        }}
                    >
                        <CheckCircle className="w-3.5 h-3.5" /> Changes
                        committed successfully
                    </div>
                )}

                <div
                    className="border rounded-lg overflow-hidden mt-2"
                    style={{ borderColor: "var(--border)" }}
                >
                    {/* File header toolbar */}
                    <div
                        className="px-4 py-2 text-xs border-b flex items-center justify-between gap-2"
                        style={{
                            borderColor: "var(--border)",
                            background: "var(--bg-tertiary)",
                            color: "var(--text-secondary)",
                        }}
                    >
                        <div className="flex items-center gap-2">
                            {isImage && (
                                <ImageIcon
                                    className="w-3.5 h-3.5"
                                    style={{ color: "var(--success)" }}
                                />
                            )}
                            <span>{fileName}</span>
                            {lang && (
                                <span
                                    className="text-[10px] px-1.5 py-0.5 rounded"
                                    style={{
                                        background: "var(--bg-secondary)",
                                    }}
                                >
                                    {lang}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5">
                            {(isMd || isHtml) && !editing && (
                                <button
                                    onClick={() => setShowPreview(!showPreview)}
                                    className="flex items-center gap-1 px-2 py-1 rounded text-[11px] hover:bg-[var(--bg-secondary)] transition-colors"
                                    style={{
                                        color: showPreview
                                            ? "var(--accent)"
                                            : "var(--text-secondary)",
                                    }}
                                >
                                    <Eye className="w-3 h-3" />{" "}
                                    {showPreview ? "Code" : "Preview"}
                                </button>
                            )}
                            {isHtml && showPreview && !editing && (
                                <button
                                    onClick={() =>
                                        setInteractiveHtmlPreview((value) => !value)
                                    }
                                    className="flex items-center gap-1 px-2 py-1 rounded text-[11px] hover:bg-[var(--bg-secondary)] transition-colors"
                                    style={{
                                        color: interactiveHtmlPreview
                                            ? "var(--warning)"
                                            : "var(--text-secondary)",
                                    }}
                                >
                                    <PlayCircle className="w-3 h-3" />
                                    {interactiveHtmlPreview
                                        ? "JS on"
                                        : "Enable JS"}
                                </button>
                            )}
                            {!isImage && !editing && (
                                <button
                                    onClick={() => {
                                        setEditContent(fileContent || "");
                                        setEditing(true);
                                        setCommitMsg(`Update ${fileName}`);
                                        setSaveError(null);
                                        setSaveSuccess(false);
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 rounded text-[11px] hover:bg-[var(--bg-secondary)] transition-colors"
                                    style={{ color: "var(--text-secondary)" }}
                                >
                                    <Pencil className="w-3 h-3" /> Edit
                                </button>
                            )}
                            {!editing && fileSha && (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="flex items-center gap-1 px-2 py-1 rounded text-[11px] hover:bg-[var(--bg-secondary)] transition-colors"
                                    style={{ color: "var(--error)" }}
                                >
                                    <Trash2 className="w-3 h-3" /> Delete
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Image preview */}
                    {isImage && (
                        <div
                            className="p-6 flex justify-center"
                            style={{ background: "var(--bg-secondary)" }}
                        >
                            <img
                                src={rawUrl}
                                alt={fileName}
                                style={{
                                    maxWidth: "100%",
                                    maxHeight: "70vh",
                                    borderRadius: 8,
                                }}
                            />
                        </div>
                    )}

                    {/* Markdown preview */}
                    {!isImage &&
                        showPreview &&
                        isMd &&
                        fileContent !== null &&
                        (() => {
                            const dirPath = currentPath
                                .split("/")
                                .slice(0, -1)
                                .join("/");
                            const rawBase = `https://raw.githubusercontent.com/${owner}/${name}/${branch}/${dirPath ? dirPath + "/" : ""}`;
                            return (
                                <div
                                    className="p-6 overflow-auto max-h-[65vh] changelog-content"
                                    style={{
                                        background: "var(--bg-secondary)",
                                    }}
                                >
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        rehypePlugins={[rehypeRaw]}
                                        components={{
                                            img: ({ src, alt, ...props }) => {
                                                const resolved =
                                                    src &&
                                                    !/^https?:\/\/|^\/\/|^data:/i.test(
                                                        src,
                                                    )
                                                        ? `${rawBase}${src}`
                                                        : src;
                                                return (
                                                    <img
                                                        src={resolved}
                                                        alt={alt || ""}
                                                        style={{
                                                            maxWidth: "100%",
                                                        }}
                                                        {...props}
                                                    />
                                                );
                                            },
                                        }}
                                    >
                                        {fileContent}
                                    </ReactMarkdown>
                                </div>
                            );
                        })()}

                    {/* HTML preview */}
                    {!isImage &&
                        showPreview &&
                        isHtml &&
                        (resolvedHtmlUrl ? (
                            <div style={{ background: "var(--bg-secondary)" }}>
                                {interactiveHtmlPreview && (
                                    <div
                                        className="px-4 py-2 text-[11px] flex items-center gap-2 border-b"
                                        style={{
                                            borderColor: "var(--border)",
                                            background: "rgba(255, 149, 0, 0.08)",
                                            color: "var(--warning)",
                                        }}
                                    >
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        Interactive preview enabled. Repository JavaScript runs in a sandboxed iframe with no access to the app context.
                                    </div>
                                )}
                                <iframe
                                    src={resolvedHtmlUrl}
                                    sandbox={
                                        interactiveHtmlPreview
                                            ? "allow-scripts"
                                            : ""
                                    }
                                    title={`Preview ${fileName}`}
                                    style={{
                                        width: "100%",
                                        height: "65vh",
                                        border: "none",
                                        background: "white",
                                    }}
                                />
                            </div>
                        ) : (
                            <div
                                className="flex items-center justify-center py-12"
                                style={{ background: "var(--bg-secondary)" }}
                            >
                                <Loader2
                                    className="w-5 h-5 animate-spin"
                                    style={{ color: "var(--text-tertiary)" }}
                                />
                            </div>
                        ))}

                    {/* Edit mode */}
                    {!isImage && editing && (
                        <div style={{ background: "var(--bg-secondary)" }}>
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full p-4 text-[13px] leading-relaxed font-mono outline-none"
                                style={{
                                    background: "transparent",
                                    color: "var(--text-primary)",
                                    minHeight: "50vh",
                                    resize: "vertical",
                                    border: "none",
                                }}
                            />
                            <div
                                className="px-4 py-3 border-t flex items-center gap-2 flex-wrap"
                                style={{ borderColor: "var(--border)" }}
                            >
                                {showCommitDialog ? (
                                    <>
                                        <input
                                            value={commitMsg}
                                            onChange={(e) =>
                                                setCommitMsg(e.target.value)
                                            }
                                            placeholder="Commit message"
                                            className="input-glass flex-1 text-xs"
                                            autoFocus
                                        />
                                        <button
                                            onClick={handleSave}
                                            disabled={
                                                saving || !commitMsg.trim()
                                            }
                                            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                                        >
                                            {saving ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <>
                                                    <GitCommit className="w-3 h-3" />{" "}
                                                    Commit
                                                </>
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() =>
                                            setShowCommitDialog(true)
                                        }
                                        className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                                    >
                                        <GitCommit className="w-3 h-3" /> Commit
                                        changes
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        setEditing(false);
                                        setSaveError(null);
                                        setShowCommitDialog(false);
                                    }}
                                    className="btn-secondary text-xs px-3 py-1.5"
                                >
                                    Cancel
                                </button>
                                {saveError && (
                                    <p
                                        className="text-xs w-full"
                                        style={{ color: "var(--error)" }}
                                    >
                                        {saveError}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Code view (read-only) with line numbers */}
                    {!isImage &&
                        !editing &&
                        !showPreview &&
                        fileContent !== null && (
                            <div
                                className="overflow-auto max-h-[65vh] flex"
                                style={{ background: "var(--bg-secondary)" }}
                            >
                                <div
                                    className="select-none text-right py-4 pl-3 pr-3 text-[13px] flex-shrink-0"
                                    style={{
                                        color: "var(--text-tertiary)",
                                        userSelect: "none",
                                        lineHeight: "1.625",
                                        borderRight: "1px solid var(--border)",
                                        fontFamily:
                                            'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
                                    }}
                                >
                                    {fileContent.split("\n").map((_, i) => (
                                        <div key={i}>{i + 1}</div>
                                    ))}
                                </div>
                                <pre
                                    className="py-4 pl-4 pr-4 text-[13px] m-0 flex-1 min-w-0"
                                    style={{ lineHeight: "1.625" }}
                                >
                                    <code
                                        ref={codeRef}
                                        className={
                                            lang ? `language-${lang}` : ""
                                        }
                                        style={{ background: "transparent" }}
                                    >
                                        {fileContent}
                                    </code>
                                </pre>
                            </div>
                        )}
                </div>

                {/* Delete confirmation dialog */}
                {showDeleteConfirm && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        style={{ background: "rgba(0,0,0,0.5)" }}
                        onClick={() => setShowDeleteConfirm(false)}
                    >
                        <div
                            className="border rounded-xl p-5 max-w-sm w-full mx-4"
                            style={{
                                background: "var(--bg-secondary)",
                                borderColor: "var(--border)",
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3
                                className="text-sm font-semibold mb-2"
                                style={{ color: "var(--text-primary)" }}
                            >
                                Delete {fileName}?
                            </h3>
                            <p
                                className="text-xs mb-4"
                                style={{ color: "var(--text-secondary)" }}
                            >
                                This will create a commit that deletes this
                                file. This action cannot be undone.
                            </p>
                            {saveError && (
                                <p
                                    className="text-xs mb-2"
                                    style={{ color: "var(--error)" }}
                                >
                                    {saveError}
                                </p>
                            )}
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="btn-secondary text-xs px-3 py-1.5"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="text-xs px-3 py-1.5 rounded-md font-medium transition-colors"
                                    style={{
                                        background: "var(--error)",
                                        color: "white",
                                    }}
                                >
                                    {deleting ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        "Delete file"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- Directory listing ---
    return (
        <div>
            {currentPath && (
                <Breadcrumbs parts={breadcrumbs} onNavigate={setCurrentPath} />
            )}
            <div className="flex justify-end mb-2 mt-1">
                <button
                    onClick={() => {
                        setCreating(true);
                        setNewFileCommitMsg("Create new file");
                        setSaveError(null);
                    }}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors hover:opacity-80"
                    style={{
                        background: "rgba(0,122,255,0.1)",
                        color: "var(--accent)",
                    }}
                >
                    <FilePlus className="w-3.5 h-3.5" /> New file
                </button>
            </div>
            <div
                className="border rounded-lg divide-y"
                style={{
                    borderColor: "var(--border)",
                    background: "var(--bg-secondary)",
                }}
            >
                {currentPath && (
                    <div
                        className="px-4 py-2 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors flex items-center gap-2 text-sm"
                        onClick={() => {
                            const p = currentPath.split("/");
                            p.pop();
                            setCurrentPath(p.join("/"));
                        }}
                        style={{ color: "var(--text-secondary)" }}
                    >
                        ..
                    </div>
                )}
                {contents.map((item) => (
                    <div
                        key={item.sha}
                        className="px-4 py-2 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors flex items-center gap-2 text-sm"
                        onClick={() => setCurrentPath(item.path)}
                    >
                        {item.type === "dir" ? (
                            <Folder
                                className="w-4 h-4 flex-shrink-0"
                                style={{ color: "var(--accent)" }}
                            />
                        ) : isImageFile(item.name) ? (
                            <ImageIcon
                                className="w-4 h-4 flex-shrink-0"
                                style={{ color: "var(--success)" }}
                            />
                        ) : (
                            <File
                                className="w-4 h-4 flex-shrink-0"
                                style={{ color: "var(--text-tertiary)" }}
                            />
                        )}
                        <span style={{ color: "var(--text-primary)" }}>
                            {item.name}
                        </span>
                    </div>
                ))}
                {contents.length === 0 && (
                    <p
                        className="text-center py-6 text-sm"
                        style={{ color: "var(--text-tertiary)" }}
                    >
                        Empty directory
                    </p>
                )}
            </div>
        </div>
    );
};

const Breadcrumbs: React.FC<{
    parts: string[];
    onNavigate: (path: string) => void;
}> = ({ parts, onNavigate }) => (
    <div className="flex items-center gap-1 text-sm flex-wrap">
        <button
            onClick={() => onNavigate("")}
            className="font-medium"
            style={{ color: "var(--accent)" }}
        >
            root
        </button>
        {parts.map((part, i) => (
            <React.Fragment key={i}>
                <ChevronRight
                    className="w-3 h-3"
                    style={{ color: "var(--text-tertiary)" }}
                />
                <button
                    onClick={() => onNavigate(parts.slice(0, i + 1).join("/"))}
                    className="font-medium"
                    style={{
                        color:
                            i === parts.length - 1
                                ? "var(--text-primary)"
                                : "var(--accent)",
                    }}
                >
                    {part}
                </button>
            </React.Fragment>
        ))}
    </div>
);

// --- Issues Tab (clickable) ---
const IssuesTab: React.FC<{ owner: string; name: string }> = ({
    owner,
    name,
}) => {
    const [issues, setIssues] = useState<GitHubIssue[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "open" | "closed">("open");
    const [showCreate, setShowCreate] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newBody, setNewBody] = useState("");
    const [creating, setCreating] = useState(false);
    const navigate = useNavigate();

    const loadIssues = () => {
        setLoading(true);
        fetchRepoIssues(owner, name)
            .then((items) => setIssues(items.filter((i) => !i.pull_request)))
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadIssues();
    }, [owner, name]);

    const filtered =
        filter === "all" ? issues : issues.filter((i) => i.state === filter);

    const handleCreate = async () => {
        if (!newTitle.trim() || creating) return;
        setCreating(true);
        try {
            await createIssue(owner, name, newTitle, newBody);
            setNewTitle("");
            setNewBody("");
            setShowCreate(false);
            loadIssues();
        } catch {}
        setCreating(false);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <div className="flex gap-1">
                    {(["open", "closed", "all"] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className="px-2.5 py-1 text-xs rounded-md transition-colors"
                            style={{
                                background:
                                    filter === f
                                        ? "var(--accent)"
                                        : "var(--bg-tertiary)",
                                color:
                                    filter === f
                                        ? "#fff"
                                        : "var(--text-secondary)",
                            }}
                        >
                            {f === "open"
                                ? `Open (${issues.filter((i) => i.state === "open").length})`
                                : f === "closed"
                                  ? `Closed (${issues.filter((i) => i.state === "closed").length})`
                                  : "All"}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                >
                    <Plus className="w-3 h-3" /> New Issue
                </button>
            </div>

            {showCreate && (
                <div
                    className="border rounded-lg p-4 mb-3"
                    style={{
                        borderColor: "var(--border)",
                        background: "var(--bg-secondary)",
                    }}
                >
                    <input
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Issue title"
                        className="input-glass w-full text-sm mb-2"
                    />
                    <textarea
                        value={newBody}
                        onChange={(e) => setNewBody(e.target.value)}
                        placeholder="Description (Markdown supported)"
                        className="input-glass w-full text-sm h-24 resize-none mb-2"
                    />
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => setShowCreate(false)}
                            className="btn-secondary text-xs px-3 py-1.5"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={!newTitle.trim() || creating}
                            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                        >
                            {creating ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <Send className="w-3 h-3" />
                            )}{" "}
                            Submit
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2
                        className="w-5 h-5 animate-spin"
                        style={{ color: "var(--text-tertiary)" }}
                    />
                </div>
            ) : filtered.length === 0 ? (
                <p
                    className="text-center py-8 text-sm"
                    style={{ color: "var(--text-tertiary)" }}
                >
                    No issues.
                </p>
            ) : (
                <div
                    className="border rounded-lg divide-y"
                    style={{
                        borderColor: "var(--border)",
                        background: "var(--bg-secondary)",
                    }}
                >
                    {filtered.map((issue) => (
                        <div
                            key={issue.id}
                            className="px-4 py-3 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
                            onClick={() =>
                                navigate(
                                    `/issue/${owner}/${name}/${issue.number}`,
                                )
                            }
                        >
                            <div className="flex items-start gap-2">
                                <CircleDot
                                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                                    style={{
                                        color:
                                            issue.state === "open"
                                                ? "var(--success)"
                                                : "var(--text-tertiary)",
                                    }}
                                />
                                <div className="flex-1 min-w-0">
                                    <p
                                        className="text-sm font-medium"
                                        style={{ color: "var(--text-primary)" }}
                                    >
                                        {issue.title}
                                    </p>
                                    <div
                                        className="flex items-center gap-3 mt-1 text-xs flex-wrap"
                                        style={{
                                            color: "var(--text-tertiary)",
                                        }}
                                    >
                                        <span>#{issue.number}</span>
                                        <span>{issue.user.login}</span>
                                        <span>{timeAgo(issue.updated_at)}</span>
                                        {issue.comments > 0 && (
                                            <span>
                                                {issue.comments} comments
                                            </span>
                                        )}
                                        {issue.labels.map((l) => (
                                            <span
                                                key={l.name}
                                                className="px-1.5 py-0.5 rounded-full text-[10px]"
                                                style={{
                                                    background: `#${l.color}30`,
                                                    color: `#${l.color}`,
                                                }}
                                            >
                                                {l.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- PRs Tab ---
const PRsTab: React.FC<{
    owner: string;
    name: string;
    branches: GitHubBranch[];
}> = ({ owner, name, branches }) => {
    const [prs, setPRs] = useState<GitHubRepoPR[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "open" | "closed" | "merged">(
        "open",
    );
    const [showCreate, setShowCreate] = useState(false);
    const [prTitle, setPrTitle] = useState("");
    const [prBody, setPrBody] = useState("");
    const [prHead, setPrHead] = useState("");
    const [prBase, setPrBase] = useState("");
    const [creating, setCreating] = useState(false);
    const navigate = useNavigate();

    const loadPRs = () => {
        setLoading(true);
        fetchRepoPRs(owner, name)
            .then(setPRs)
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadPRs();
    }, [owner, name]);

    const filtered =
        filter === "all"
            ? prs
            : filter === "merged"
              ? prs.filter((p) => p.merged_at)
              : filter === "open"
                ? prs.filter((p) => p.state === "open" && !p.merged_at)
                : prs.filter((p) => p.state === "closed" && !p.merged_at);

    const handleCreate = async () => {
        if (!prTitle.trim() || !prHead || !prBase || creating) return;
        setCreating(true);
        try {
            const created = await createPR(
                owner,
                name,
                prTitle,
                prBody,
                prHead,
                prBase,
            );
            setShowCreate(false);
            setPrTitle("");
            setPrBody("");
            navigate(`/pr/${owner}/${name}/${created.number}`);
        } catch {}
        setCreating(false);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <div className="flex gap-1">
                    {(["open", "merged", "closed", "all"] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className="px-2.5 py-1 text-xs rounded-md transition-colors"
                            style={{
                                background:
                                    filter === f
                                        ? "var(--accent)"
                                        : "var(--bg-tertiary)",
                                color:
                                    filter === f
                                        ? "#fff"
                                        : "var(--text-secondary)",
                            }}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                >
                    <Plus className="w-3 h-3" /> New PR
                </button>
            </div>

            {showCreate && (
                <div
                    className="border rounded-lg p-4 mb-3"
                    style={{
                        borderColor: "var(--border)",
                        background: "var(--bg-secondary)",
                    }}
                >
                    <input
                        value={prTitle}
                        onChange={(e) => setPrTitle(e.target.value)}
                        placeholder="PR title"
                        className="input-glass w-full text-sm mb-2"
                    />
                    <div className="flex gap-2 mb-2">
                        <select
                            value={prHead}
                            onChange={(e) => setPrHead(e.target.value)}
                            className="input-glass text-xs flex-1"
                            style={{
                                color: prHead
                                    ? "var(--text-primary)"
                                    : "var(--text-tertiary)",
                            }}
                        >
                            <option value="">Head branch...</option>
                            {branches.map((b) => (
                                <option key={b.name} value={b.name}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                        <span
                            className="text-xs self-center"
                            style={{ color: "var(--text-tertiary)" }}
                        >
                            into
                        </span>
                        <select
                            value={prBase}
                            onChange={(e) => setPrBase(e.target.value)}
                            className="input-glass text-xs flex-1"
                            style={{
                                color: prBase
                                    ? "var(--text-primary)"
                                    : "var(--text-tertiary)",
                            }}
                        >
                            <option value="">Base branch...</option>
                            {branches.map((b) => (
                                <option key={b.name} value={b.name}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <textarea
                        value={prBody}
                        onChange={(e) => setPrBody(e.target.value)}
                        placeholder="Description (Markdown supported)"
                        className="input-glass w-full text-sm h-24 resize-none mb-2"
                    />
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => setShowCreate(false)}
                            className="btn-secondary text-xs px-3 py-1.5"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={
                                !prTitle.trim() ||
                                !prHead ||
                                !prBase ||
                                creating
                            }
                            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                        >
                            {creating ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <GitPullRequest className="w-3 h-3" />
                            )}{" "}
                            Create PR
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2
                        className="w-5 h-5 animate-spin"
                        style={{ color: "var(--text-tertiary)" }}
                    />
                </div>
            ) : filtered.length === 0 ? (
                <p
                    className="text-center py-8 text-sm"
                    style={{ color: "var(--text-tertiary)" }}
                >
                    No pull requests.
                </p>
            ) : (
                <div
                    className="border rounded-lg divide-y"
                    style={{
                        borderColor: "var(--border)",
                        background: "var(--bg-secondary)",
                    }}
                >
                    {filtered.map((pr) => {
                        const status = pr.merged_at ? "merged" : pr.state;
                        const color =
                            status === "merged"
                                ? "#A371F7"
                                : status === "open"
                                  ? "#3FB950"
                                  : "#F85149";
                        return (
                            <div
                                key={pr.id}
                                className="px-4 py-3 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
                                onClick={() =>
                                    navigate(
                                        `/pr/${owner}/${name}/${pr.number}`,
                                    )
                                }
                            >
                                <div className="flex items-start gap-2">
                                    <GitPullRequest
                                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                                        style={{ color }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p
                                            className="text-sm font-medium"
                                            style={{
                                                color: "var(--text-primary)",
                                            }}
                                        >
                                            {pr.title}
                                        </p>
                                        <div
                                            className="flex items-center gap-3 mt-1 text-xs"
                                            style={{
                                                color: "var(--text-tertiary)",
                                            }}
                                        >
                                            <span>#{pr.number}</span>
                                            <span>{pr.user.login}</span>
                                            <span>
                                                {timeAgo(pr.updated_at)}
                                            </span>
                                            {pr.comments > 0 && (
                                                <span>
                                                    {pr.comments} comments
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// --- Commits Tab (clickable) ---
const CommitsTab: React.FC<{ owner: string; name: string; branch: string }> = ({
    owner,
    name,
    branch,
}) => {
    const [commits, setCommits] = useState<GitHubCommit[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchRepoCommits(owner, name, branch)
            .then(setCommits)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [owner, name, branch]);

    if (loading)
        return (
            <div className="flex justify-center py-12">
                <Loader2
                    className="w-5 h-5 animate-spin"
                    style={{ color: "var(--text-tertiary)" }}
                />
            </div>
        );
    if (commits.length === 0)
        return (
            <p
                className="text-center py-8 text-sm"
                style={{ color: "var(--text-tertiary)" }}
            >
                No commits.
            </p>
        );

    return (
        <div
            className="border rounded-lg divide-y"
            style={{
                borderColor: "var(--border)",
                background: "var(--bg-secondary)",
            }}
        >
            {commits.map((c) => (
                <div
                    key={c.sha}
                    className="px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
                    onClick={() =>
                        navigate(`/commit/${owner}/${name}/${c.sha}`)
                    }
                >
                    <GitCommit
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        style={{ color: "var(--text-tertiary)" }}
                    />
                    <div className="flex-1 min-w-0">
                        <p
                            className="text-sm font-medium truncate"
                            style={{ color: "var(--text-primary)" }}
                        >
                            {c.commit.message.split("\n")[0]}
                        </p>
                        <div
                            className="flex items-center gap-3 mt-1 text-xs"
                            style={{ color: "var(--text-tertiary)" }}
                        >
                            {c.author ? (
                                <span
                                    className="flex items-center gap-1 hover:underline"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/profile/${c.author!.login}`);
                                    }}
                                >
                                    <img
                                        src={c.author.avatar_url}
                                        alt=""
                                        className="w-3.5 h-3.5 rounded-full"
                                    />
                                    {c.author.login}
                                </span>
                            ) : (
                                <span>{c.commit.author.name}</span>
                            )}
                            <span className="font-mono">
                                {c.sha.substring(0, 7)}
                            </span>
                            <span>{timeAgo(c.commit.author.date)}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- Actions Tab ---
function runIcon(conclusion: string | null, status: string) {
    if (
        status === "in_progress" ||
        status === "queued" ||
        status === "waiting"
    ) {
        return (
            <Clock className="w-4 h-4" style={{ color: "var(--warning)" }} />
        );
    }
    switch (conclusion) {
        case "success":
            return (
                <CheckCircle
                    className="w-4 h-4"
                    style={{ color: "var(--success)" }}
                />
            );
        case "failure":
            return (
                <XCircle
                    className="w-4 h-4"
                    style={{ color: "var(--error)" }}
                />
            );
        case "cancelled":
            return (
                <MinusCircle
                    className="w-4 h-4"
                    style={{ color: "var(--text-tertiary)" }}
                />
            );
        case "skipped":
            return (
                <MinusCircle
                    className="w-4 h-4"
                    style={{ color: "var(--text-tertiary)" }}
                />
            );
        default:
            return (
                <Clock
                    className="w-4 h-4"
                    style={{ color: "var(--text-tertiary)" }}
                />
            );
    }
}

function runColor(conclusion: string | null, status: string): string {
    if (status === "in_progress" || status === "queued" || status === "waiting")
        return "var(--warning)";
    switch (conclusion) {
        case "success":
            return "var(--success)";
        case "failure":
            return "var(--error)";
        default:
            return "var(--text-tertiary)";
    }
}

const ActionsTab: React.FC<{ owner: string; name: string }> = ({
    owner,
    name,
}) => {
    const [runs, setRuns] = useState<GitHubWorkflowRun[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const navigate = useNavigate();

    useEffect(() => {
        fetchWorkflowRuns(owner, name)
            .then(setRuns)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [owner, name]);

    if (loading)
        return (
            <div className="flex justify-center py-12">
                <Loader2
                    className="w-5 h-5 animate-spin"
                    style={{ color: "var(--text-tertiary)" }}
                />
            </div>
        );
    if (runs.length === 0)
        return (
            <p
                className="text-center py-8 text-sm"
                style={{ color: "var(--text-tertiary)" }}
            >
                No workflow runs found.
            </p>
        );

    const workflows = Array.from(new Set(runs.map((r) => r.name)));
    const filtered = filter === "all" ? runs : runs.filter((r) => r.name === filter);

    return (
        <div>
            {workflows.length > 1 && (
                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                    <button
                        onClick={() => setFilter("all")}
                        className="text-xs px-2.5 py-1 rounded-md transition-colors"
                        style={{
                            background: filter === "all" ? "var(--accent)" : "var(--bg-tertiary)",
                            color: filter === "all" ? "#fff" : "var(--text-secondary)",
                        }}
                    >
                        All
                    </button>
                    {workflows.map((w) => (
                        <button
                            key={w}
                            onClick={() => setFilter(w)}
                            className="text-xs px-2.5 py-1 rounded-md transition-colors"
                            style={{
                                background: filter === w ? "var(--accent)" : "var(--bg-tertiary)",
                                color: filter === w ? "#fff" : "var(--text-secondary)",
                            }}
                        >
                            {w}
                        </button>
                    ))}
                </div>
            )}
        <div
            className="border rounded-lg divide-y"
            style={{
                borderColor: "var(--border)",
                background: "var(--bg-secondary)",
            }}
        >
            {filtered.map((run) => {
                const color = runColor(run.conclusion, run.status);
                return (
                    <div
                        key={run.id}
                        className="px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
                        onClick={() =>
                            navigate(`/run/${owner}/${name}/${run.id}`)
                        }
                    >
                        <div className="mt-0.5 flex-shrink-0">
                            {runIcon(run.conclusion, run.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p
                                className="text-sm font-medium truncate"
                                style={{ color: "var(--text-primary)" }}
                            >
                                {run.name}
                            </p>
                            <div
                                className="flex items-center gap-3 mt-1 text-xs"
                                style={{ color: "var(--text-tertiary)" }}
                            >
                                <span
                                    className="font-medium px-1.5 py-0.5 rounded-full text-[10px]"
                                    style={{ background: `${color}15`, color }}
                                >
                                    {run.status === "in_progress"
                                        ? "Running"
                                        : run.conclusion || run.status}
                                </span>
                                <span>#{run.run_number}</span>
                                <span>{run.event}</span>
                                {run.head_branch && (
                                    <span className="font-mono">
                                        {run.head_branch}
                                    </span>
                                )}
                                {run.actor && (
                                    <span
                                        className="flex items-center gap-1 hover:underline"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(
                                                `/profile/${run.actor!.login}`,
                                            );
                                        }}
                                    >
                                        <img
                                            src={run.actor.avatar_url}
                                            alt=""
                                            className="w-3.5 h-3.5 rounded-full"
                                        />
                                        {run.actor.login}
                                    </span>
                                )}
                                <span>{timeAgo(run.created_at)}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
        </div>
    );
};

// --- Releases Tab ---
const ReleasesTab: React.FC<{ owner: string; name: string }> = ({
    owner,
    name,
}) => {
    const [releases, setReleases] = useState<GitHubRelease[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [relTag, setRelTag] = useState("");
    const [relName, setRelName] = useState("");
    const [relBody, setRelBody] = useState("");
    const [relDraft, setRelDraft] = useState(false);
    const [relPrerelease, setRelPrerelease] = useState(false);
    const [creating, setCreating] = useState(false);
    const navigate = useNavigate();
    const [expandedRelease, setExpandedRelease] = useState<number | null>(null);

    const loadReleases = () => {
        setLoading(true);
        fetchRepoReleases(owner, name)
            .then(setReleases)
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadReleases();
    }, [owner, name]);

    const handleCreate = async () => {
        if (!relTag.trim() || creating) return;
        setCreating(true);
        try {
            await createRelease(
                owner,
                name,
                relTag,
                relName || relTag,
                relBody,
                relDraft,
                relPrerelease,
            );
            setShowCreate(false);
            setRelTag("");
            setRelName("");
            setRelBody("");
            loadReleases();
        } catch {}
        setCreating(false);
    };

    return (
        <div>
            <div className="flex items-center justify-end mb-3">
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                >
                    <Plus className="w-3 h-3" /> New Release
                </button>
            </div>

            {showCreate && (
                <div
                    className="border rounded-lg p-4 mb-3"
                    style={{
                        borderColor: "var(--border)",
                        background: "var(--bg-secondary)",
                    }}
                >
                    <div className="flex gap-2 mb-2">
                        <input
                            value={relTag}
                            onChange={(e) => setRelTag(e.target.value)}
                            placeholder="Tag (e.g. v1.0.0)"
                            className="input-glass text-sm flex-1"
                        />
                        <input
                            value={relName}
                            onChange={(e) => setRelName(e.target.value)}
                            placeholder="Release title (optional)"
                            className="input-glass text-sm flex-1"
                        />
                    </div>
                    <textarea
                        value={relBody}
                        onChange={(e) => setRelBody(e.target.value)}
                        placeholder="Release notes (Markdown supported)"
                        className="input-glass w-full text-sm h-24 resize-none mb-2"
                    />
                    <div className="flex items-center gap-4 mb-2">
                        <label
                            className="flex items-center gap-1.5 text-xs cursor-pointer"
                            style={{ color: "var(--text-secondary)" }}
                        >
                            <input
                                type="checkbox"
                                checked={relDraft}
                                onChange={(e) => setRelDraft(e.target.checked)}
                            />{" "}
                            Draft
                        </label>
                        <label
                            className="flex items-center gap-1.5 text-xs cursor-pointer"
                            style={{ color: "var(--text-secondary)" }}
                        >
                            <input
                                type="checkbox"
                                checked={relPrerelease}
                                onChange={(e) =>
                                    setRelPrerelease(e.target.checked)
                                }
                            />{" "}
                            Pre-release
                        </label>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => setShowCreate(false)}
                            className="btn-secondary text-xs px-3 py-1.5"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={!relTag.trim() || creating}
                            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                        >
                            {creating ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <Upload className="w-3 h-3" />
                            )}{" "}
                            Publish
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2
                        className="w-5 h-5 animate-spin"
                        style={{ color: "var(--text-tertiary)" }}
                    />
                </div>
            ) : releases.length === 0 ? (
                <p
                    className="text-center py-8 text-sm"
                    style={{ color: "var(--text-tertiary)" }}
                >
                    No releases.
                </p>
            ) : (
                <div className="space-y-3">
                    {releases.map((rel, idx) => {
                        const isExpanded = expandedRelease === rel.id;
                        return (
                            <div
                                key={rel.id}
                                className="border rounded-lg overflow-hidden"
                                style={{ borderColor: "var(--border)" }}
                            >
                                <div
                                    className="px-4 py-3 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
                                    style={{ background: "var(--bg-secondary)" }}
                                    onClick={() => setExpandedRelease(isExpanded ? null : rel.id)}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Tag className="w-4 h-4" style={{ color: "var(--accent)" }} />
                                        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                                            {rel.name || rel.tag_name}
                                        </span>
                                        {idx === 0 && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(52,199,89,0.15)", color: "var(--success)" }}>
                                                Latest
                                            </span>
                                        )}
                                        {rel.prerelease && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(255,149,0,0.15)", color: "var(--warning)" }}>
                                                Pre-release
                                            </span>
                                        )}
                                        {rel.draft && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
                                                Draft
                                            </span>
                                        )}
                                        <ChevronDown
                                            className="w-4 h-4 ml-auto flex-shrink-0 transition-transform"
                                            style={{ color: "var(--text-tertiary)", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-tertiary)" }}>
                                        <span className="font-mono">{rel.tag_name}</span>
                                        <span
                                            className="flex items-center gap-1 cursor-pointer hover:underline"
                                            onClick={(e) => { e.stopPropagation(); navigate(`/profile/${rel.author.login}`); }}
                                        >
                                            <img src={rel.author.avatar_url} alt="" className="w-3.5 h-3.5 rounded-full" />
                                            {rel.author.login}
                                        </span>
                                        <span>{rel.published_at ? timeAgo(rel.published_at) : timeAgo(rel.created_at)}</span>
                                        {rel.assets.length > 0 && (
                                            <span className="flex items-center gap-0.5">
                                                <Package className="w-3 h-3" /> {rel.assets.length} asset{rel.assets.length > 1 ? "s" : ""}
                                            </span>
                                        )}
                                    </div>
                                    {!isExpanded && rel.body && (
                                        <p className="text-sm mt-2 line-clamp-2 whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
                                            {rel.body}
                                        </p>
                                    )}
                                </div>
                                {isExpanded && (
                                    <>
                                        {rel.body && (
                                            <div className="border-t px-4 py-3" style={{ borderColor: "var(--border)" }}>
                                                <div className="prose prose-sm max-w-none text-sm" style={{ color: "var(--text-secondary)" }}>
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                                                        {rel.body}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        )}
                                        {rel.assets.length > 0 && (
                                            <div className="border-t px-4 py-2" style={{ borderColor: "var(--border)", background: "var(--bg-tertiary)" }}>
                                                <p className="text-[10px] font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                                                    Assets
                                                </p>
                                                {rel.assets.map((asset) => (
                                                    <a
                                                        key={asset.name}
                                                        href={asset.browser_download_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 py-1 text-xs hover:underline"
                                                        style={{ color: "var(--accent)" }}
                                                    >
                                                        <Package className="w-3 h-3" />
                                                        <span>{asset.name}</span>
                                                        <span style={{ color: "var(--text-tertiary)" }}>
                                                            ({(asset.size / 1024 / 1024).toFixed(1)} MB)
                                                        </span>
                                                        <span className="flex items-center gap-0.5" style={{ color: "var(--text-tertiary)" }}>
                                                            <Download className="w-2.5 h-2.5" /> {asset.download_count}
                                                        </span>
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// --- Expandable Alert Row ---
const AlertRow: React.FC<{
    icon: React.ElementType;
    iconColor: string;
    title: string;
    badges: React.ReactNode;
    expanded: boolean;
    onToggle: () => void;
    children?: React.ReactNode;
}> = ({ icon: Icon, iconColor, title, badges, expanded, onToggle, children }) => (
    <div>
        <div
            className="px-4 py-3 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
            onClick={onToggle}
        >
            <div className="flex items-start gap-2">
                <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: iconColor }} />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {title}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs flex-wrap" style={{ color: "var(--text-tertiary)" }}>
                        {badges}
                    </div>
                </div>
                <ChevronDown
                    className="w-4 h-4 flex-shrink-0 mt-0.5 transition-transform"
                    style={{
                        color: "var(--text-tertiary)",
                        transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                />
            </div>
        </div>
        {expanded && (
            <div
                className="px-4 pb-3 pt-0 ml-6 border-t"
                style={{ borderColor: "var(--border)" }}
            >
                <div className="pt-3 space-y-2">
                    {children}
                </div>
            </div>
        )}
    </div>
);

// --- Security Tab ---
type SecuritySection =
    | "overview"
    | "dependabot"
    | "code-scanning"
    | "secret-scanning";

const SecurityTab: React.FC<{ owner: string; name: string }> = ({
    owner,
    name,
}) => {
    const [section, setSection] = useState<SecuritySection>("overview");
    const [dependabot, setDependabot] = useState<GitHubDependabotAlert[]>([]);
    const [codeScanning, setCodeScanning] = useState<GitHubCodeScanAlert[]>([]);
    const [secrets, setSecrets] = useState<GitHubSecretAlert[]>([]);
    const [protection, setProtection] = useState<GitHubBranchProtection | null>(
        null,
    );
    const [loading, setLoading] = useState(true);
    const [depError, setDepError] = useState(false);
    const [csError, setCsError] = useState(false);
    const [secError, setSecError] = useState(false);
    const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
    const [dismissing, setDismissing] = useState<string | null>(null);

    const toggleAlert = (key: string) =>
        setExpandedAlert((prev) => (prev === key ? null : key));

    const handleDismissDependabot = async (a: GitHubDependabotAlert) => {
        const key = `dep-${a.number}`;
        setDismissing(key);
        try {
            await dismissDependabotAlert(owner, name, a.number, "dismissed", "tolerable_risk");
            setDependabot((prev) => prev.filter((x) => x.number !== a.number));
            setExpandedAlert(null);
        } catch {}
        setDismissing(null);
    };

    const handleDismissCodeScan = async (a: GitHubCodeScanAlert) => {
        const key = `cs-${a.number}`;
        setDismissing(key);
        try {
            await dismissCodeScanningAlert(owner, name, a.number, "dismissed", "won't fix");
            setCodeScanning((prev) => prev.filter((x) => x.number !== a.number));
            setExpandedAlert(null);
        } catch {}
        setDismissing(null);
    };

    const handleDismissSecret = async (a: GitHubSecretAlert) => {
        const key = `sec-${a.number}`;
        setDismissing(key);
        try {
            await dismissSecretScanningAlert(owner, name, a.number, "resolved", "revoked");
            setSecrets((prev) => prev.filter((x) => x.number !== a.number));
            setExpandedAlert(null);
        } catch {}
        setDismissing(null);
    };

    useEffect(() => {
        Promise.allSettled([
            fetchDependabotAlerts(owner, name)
                .then(setDependabot)
                .catch(() => setDepError(true)),
            fetchCodeScanningAlerts(owner, name)
                .then(setCodeScanning)
                .catch(() => setCsError(true)),
            fetchSecretScanningAlerts(owner, name)
                .then(setSecrets)
                .catch(() => setSecError(true)),
            fetchBranchProtection(owner, name, "main")
                .then(setProtection)
                .catch(() => {}),
        ]).finally(() => setLoading(false));
    }, [owner, name]);

    const severityColor = (s: string) => {
        switch (s.toLowerCase()) {
            case "critical":
                return "var(--error)";
            case "high":
                return "#FF6B35";
            case "medium":
                return "var(--warning)";
            case "low":
                return "var(--text-tertiary)";
            default:
                return "var(--text-tertiary)";
        }
    };

    if (loading)
        return (
            <div className="flex justify-center py-12">
                <Loader2
                    className="w-5 h-5 animate-spin"
                    style={{ color: "var(--text-tertiary)" }}
                />
            </div>
        );

    const navItems: {
        id: SecuritySection;
        label: string;
        icon: React.ElementType;
        count?: number;
        error?: boolean;
    }[] = [
        { id: "overview", label: "Overview", icon: ShieldCheck },
        {
            id: "dependabot",
            label: "Dependabot",
            icon: Shield,
            count: depError ? undefined : dependabot.length,
            error: depError,
        },
        {
            id: "code-scanning",
            label: "Code scanning",
            icon: Eye,
            count: csError ? undefined : codeScanning.length,
            error: csError,
        },
        {
            id: "secret-scanning",
            label: "Secret scanning",
            icon: Key,
            count: secError ? undefined : secrets.length,
            error: secError,
        },
    ];

    return (
        <div className="flex gap-4">
            {/* Sidebar nav */}
            <div className="w-48 flex-shrink-0">
                <h3
                    className="text-sm font-semibold mb-2"
                    style={{ color: "var(--text-primary)" }}
                >
                    Security
                </h3>
                <div className="space-y-0.5">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setSection(item.id)}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md transition-colors text-left"
                            style={{
                                background:
                                    section === item.id
                                        ? "var(--bg-tertiary)"
                                        : "transparent",
                                color:
                                    section === item.id
                                        ? "var(--text-primary)"
                                        : "var(--text-secondary)",
                                borderLeft:
                                    section === item.id
                                        ? "2px solid var(--accent)"
                                        : "2px solid transparent",
                            }}
                        >
                            <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="flex-1">{item.label}</span>
                            {item.count !== undefined && (
                                <span
                                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                                    style={{
                                        background:
                                            item.count > 0
                                                ? "rgba(255,59,48,0.15)"
                                                : "rgba(52,199,89,0.15)",
                                        color:
                                            item.count > 0
                                                ? "var(--error)"
                                                : "var(--success)",
                                    }}
                                >
                                    {item.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {section === "overview" && (
                    <div>
                        <h3
                            className="text-sm font-semibold mb-3"
                            style={{ color: "var(--text-primary)" }}
                        >
                            Security overview
                        </h3>
                        <div
                            className="border rounded-lg divide-y"
                            style={{
                                borderColor: "var(--border)",
                                background: "var(--bg-secondary)",
                            }}
                        >
                            {/* Branch protection */}
                            <div className="px-4 py-3 flex items-center justify-between">
                                <div>
                                    <p
                                        className="text-sm font-medium"
                                        style={{ color: "var(--text-primary)" }}
                                    >
                                        Branch protection{" "}
                                        {protection ? (
                                            <span
                                                className="text-xs ml-1"
                                                style={{
                                                    color: "var(--success)",
                                                }}
                                            >
                                                Enabled
                                            </span>
                                        ) : (
                                            <span
                                                className="text-xs ml-1"
                                                style={{
                                                    color: "var(--text-tertiary)",
                                                }}
                                            >
                                                Not configured
                                            </span>
                                        )}
                                    </p>
                                    <p
                                        className="text-xs"
                                        style={{
                                            color: "var(--text-tertiary)",
                                        }}
                                    >
                                        Protect important branches with rules
                                    </p>
                                </div>
                            </div>
                            {/* Dependabot */}
                            <div className="px-4 py-3 flex items-center justify-between">
                                <div>
                                    <p
                                        className="text-sm font-medium"
                                        style={{ color: "var(--text-primary)" }}
                                    >
                                        Dependabot alerts{" "}
                                        {!depError ? (
                                            <span
                                                className="text-xs ml-1"
                                                style={{
                                                    color: "var(--success)",
                                                }}
                                            >
                                                Enabled
                                            </span>
                                        ) : (
                                            <span
                                                className="text-xs ml-1"
                                                style={{
                                                    color: "var(--text-tertiary)",
                                                }}
                                            >
                                                Not available
                                            </span>
                                        )}
                                    </p>
                                    <p
                                        className="text-xs"
                                        style={{
                                            color: "var(--text-tertiary)",
                                        }}
                                    >
                                        Get notified when dependencies have
                                        vulnerabilities
                                    </p>
                                </div>
                                {!depError && (
                                    <button
                                        onClick={() => setSection("dependabot")}
                                        className="text-xs hover:underline"
                                        style={{ color: "var(--accent)" }}
                                    >
                                        View alerts ({dependabot.length})
                                    </button>
                                )}
                            </div>
                            {/* Code scanning */}
                            <div className="px-4 py-3 flex items-center justify-between">
                                <div>
                                    <p
                                        className="text-sm font-medium"
                                        style={{ color: "var(--text-primary)" }}
                                    >
                                        Code scanning alerts{" "}
                                        {!csError ? (
                                            <span
                                                className="text-xs ml-1"
                                                style={{
                                                    color: "var(--success)",
                                                }}
                                            >
                                                Enabled
                                            </span>
                                        ) : (
                                            <span
                                                className="text-xs ml-1"
                                                style={{
                                                    color: "var(--text-tertiary)",
                                                }}
                                            >
                                                Not available
                                            </span>
                                        )}
                                    </p>
                                    <p
                                        className="text-xs"
                                        style={{
                                            color: "var(--text-tertiary)",
                                        }}
                                    >
                                        Automatically detect vulnerabilities and
                                        coding errors
                                    </p>
                                </div>
                                {!csError && (
                                    <button
                                        onClick={() =>
                                            setSection("code-scanning")
                                        }
                                        className="text-xs hover:underline"
                                        style={{ color: "var(--accent)" }}
                                    >
                                        View alerts ({codeScanning.length})
                                    </button>
                                )}
                            </div>
                            {/* Secret scanning */}
                            <div className="px-4 py-3 flex items-center justify-between">
                                <div>
                                    <p
                                        className="text-sm font-medium"
                                        style={{ color: "var(--text-primary)" }}
                                    >
                                        Secret scanning alerts{" "}
                                        {!secError ? (
                                            <span
                                                className="text-xs ml-1"
                                                style={{
                                                    color: "var(--success)",
                                                }}
                                            >
                                                Enabled
                                            </span>
                                        ) : (
                                            <span
                                                className="text-xs ml-1"
                                                style={{
                                                    color: "var(--text-tertiary)",
                                                }}
                                            >
                                                Not available
                                            </span>
                                        )}
                                    </p>
                                    <p
                                        className="text-xs"
                                        style={{
                                            color: "var(--text-tertiary)",
                                        }}
                                    >
                                        Get notified when secrets are pushed to
                                        this repository
                                    </p>
                                </div>
                                {!secError && (
                                    <button
                                        onClick={() =>
                                            setSection("secret-scanning")
                                        }
                                        className="text-xs hover:underline"
                                        style={{ color: "var(--accent)" }}
                                    >
                                        View detected secrets ({secrets.length})
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {section === "dependabot" && (
                    <div>
                        <h3
                            className="text-sm font-semibold mb-3 flex items-center gap-2"
                            style={{ color: "var(--text-primary)" }}
                        >
                            <Shield
                                className="w-4 h-4"
                                style={{ color: "var(--warning)" }}
                            />{" "}
                            Dependabot Alerts
                        </h3>
                        {depError ? (
                            <div
                                className="border rounded-lg p-6 text-center"
                                style={{
                                    borderColor: "var(--border)",
                                    background: "var(--bg-secondary)",
                                }}
                            >
                                <ShieldAlert
                                    className="w-8 h-8 mx-auto mb-2"
                                    style={{ color: "var(--text-tertiary)" }}
                                />
                                <p
                                    className="text-sm"
                                    style={{ color: "var(--text-secondary)" }}
                                >
                                    Dependabot alerts are not available
                                </p>
                                <p
                                    className="text-xs mt-1"
                                    style={{ color: "var(--text-tertiary)" }}
                                >
                                    Requires admin access or Dependabot to be
                                    enabled
                                </p>
                            </div>
                        ) : dependabot.length === 0 ? (
                            <div
                                className="border rounded-lg p-6 text-center"
                                style={{
                                    borderColor: "var(--border)",
                                    background: "var(--bg-secondary)",
                                }}
                            >
                                <ShieldCheck
                                    className="w-8 h-8 mx-auto mb-2"
                                    style={{ color: "var(--success)" }}
                                />
                                <p
                                    className="text-sm"
                                    style={{ color: "var(--success)" }}
                                >
                                    No open vulnerability alerts
                                </p>
                            </div>
                        ) : (
                            <div
                                className="border rounded-lg divide-y"
                                style={{
                                    borderColor: "var(--border)",
                                    background: "var(--bg-secondary)",
                                }}
                            >
                                {dependabot.map((a) => {
                                    const key = `dep-${a.number}`;
                                    return (
                                        <AlertRow
                                            key={a.number}
                                            icon={AlertTriangle}
                                            iconColor={severityColor(a.security_vulnerability.severity)}
                                            title={a.security_advisory.summary}
                                            expanded={expandedAlert === key}
                                            onToggle={() => toggleAlert(key)}
                                            badges={<>
                                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium" style={{ background: `${severityColor(a.security_vulnerability.severity)}20`, color: severityColor(a.security_vulnerability.severity) }}>
                                                    {a.security_vulnerability.severity}
                                                </span>
                                                <span className="font-mono">{a.security_vulnerability.package.ecosystem}/{a.security_vulnerability.package.name}</span>
                                                <span>{a.security_vulnerability.vulnerable_version_range}</span>
                                                {a.security_advisory.cve_id && <span className="font-mono">{a.security_advisory.cve_id}</span>}
                                                <span>{timeAgo(a.created_at)}</span>
                                            </>}
                                        >
                                            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                                                {a.security_advisory.description}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}>
                                                    #{a.number}
                                                </span>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDismissDependabot(a); }}
                                                disabled={dismissing === key}
                                                className="text-xs px-3 py-1.5 border rounded-md font-medium mt-1 flex items-center gap-1"
                                                style={{ borderColor: "var(--warning)", color: "var(--warning)" }}
                                            >
                                                {dismissing === key ? <Loader2 className="w-3 h-3 animate-spin" /> : <MinusCircle className="w-3 h-3" />}
                                                Dismiss
                                            </button>
                                        </AlertRow>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {section === "code-scanning" && (
                    <div>
                        <h3
                            className="text-sm font-semibold mb-3 flex items-center gap-2"
                            style={{ color: "var(--text-primary)" }}
                        >
                            <Eye
                                className="w-4 h-4"
                                style={{ color: "var(--accent)" }}
                            />{" "}
                            Code Scanning Alerts
                        </h3>
                        {csError ? (
                            <div
                                className="border rounded-lg p-6 text-center"
                                style={{
                                    borderColor: "var(--border)",
                                    background: "var(--bg-secondary)",
                                }}
                            >
                                <ShieldAlert
                                    className="w-8 h-8 mx-auto mb-2"
                                    style={{ color: "var(--text-tertiary)" }}
                                />
                                <p
                                    className="text-sm"
                                    style={{ color: "var(--text-secondary)" }}
                                >
                                    Code scanning is not available
                                </p>
                                <p
                                    className="text-xs mt-1"
                                    style={{ color: "var(--text-tertiary)" }}
                                >
                                    Requires GitHub Advanced Security or feature
                                    to be enabled
                                </p>
                            </div>
                        ) : codeScanning.length === 0 ? (
                            <div
                                className="border rounded-lg p-6 text-center"
                                style={{
                                    borderColor: "var(--border)",
                                    background: "var(--bg-secondary)",
                                }}
                            >
                                <ShieldCheck
                                    className="w-8 h-8 mx-auto mb-2"
                                    style={{ color: "var(--success)" }}
                                />
                                <p
                                    className="text-sm"
                                    style={{ color: "var(--success)" }}
                                >
                                    No open code scanning alerts
                                </p>
                            </div>
                        ) : (
                            <div
                                className="border rounded-lg divide-y"
                                style={{
                                    borderColor: "var(--border)",
                                    background: "var(--bg-secondary)",
                                }}
                            >
                                {codeScanning.map((a) => {
                                    const key = `cs-${a.number}`;
                                    return (
                                        <AlertRow
                                            key={a.number}
                                            icon={XCircle}
                                            iconColor={severityColor(a.rule.severity)}
                                            title={a.rule.description}
                                            expanded={expandedAlert === key}
                                            onToggle={() => toggleAlert(key)}
                                            badges={<>
                                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium" style={{ background: `${severityColor(a.rule.severity)}20`, color: severityColor(a.rule.severity) }}>
                                                    {a.rule.severity}
                                                </span>
                                                <span className="font-mono">{a.most_recent_instance.location.path}:{a.most_recent_instance.location.start_line}</span>
                                                <span>{a.tool.name}</span>
                                                <span>{timeAgo(a.created_at)}</span>
                                            </>}
                                        >
                                            <div className="text-xs space-y-1" style={{ color: "var(--text-secondary)" }}>
                                                <p><span style={{ color: "var(--text-tertiary)" }}>Rule:</span> <span className="font-mono">{a.rule.id}</span></p>
                                                <p><span style={{ color: "var(--text-tertiary)" }}>File:</span> <span className="font-mono">{a.most_recent_instance.location.path}:{a.most_recent_instance.location.start_line}</span></p>
                                                <p><span style={{ color: "var(--text-tertiary)" }}>Ref:</span> <span className="font-mono">{a.most_recent_instance.ref}</span></p>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}>
                                                    #{a.number}
                                                </span>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDismissCodeScan(a); }}
                                                disabled={dismissing === key}
                                                className="text-xs px-3 py-1.5 border rounded-md font-medium mt-1 flex items-center gap-1"
                                                style={{ borderColor: "var(--warning)", color: "var(--warning)" }}
                                            >
                                                {dismissing === key ? <Loader2 className="w-3 h-3 animate-spin" /> : <MinusCircle className="w-3 h-3" />}
                                                Dismiss
                                            </button>
                                        </AlertRow>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {section === "secret-scanning" && (
                    <div>
                        <h3
                            className="text-sm font-semibold mb-3 flex items-center gap-2"
                            style={{ color: "var(--text-primary)" }}
                        >
                            <Key
                                className="w-4 h-4"
                                style={{ color: "var(--error)" }}
                            />{" "}
                            Secret Scanning Alerts
                        </h3>
                        {secError ? (
                            <div
                                className="border rounded-lg p-6 text-center"
                                style={{
                                    borderColor: "var(--border)",
                                    background: "var(--bg-secondary)",
                                }}
                            >
                                <ShieldAlert
                                    className="w-8 h-8 mx-auto mb-2"
                                    style={{ color: "var(--text-tertiary)" }}
                                />
                                <p
                                    className="text-sm"
                                    style={{ color: "var(--text-secondary)" }}
                                >
                                    Secret scanning is not available
                                </p>
                                <p
                                    className="text-xs mt-1"
                                    style={{ color: "var(--text-tertiary)" }}
                                >
                                    Requires GitHub Advanced Security or feature
                                    to be enabled
                                </p>
                            </div>
                        ) : secrets.length === 0 ? (
                            <div
                                className="border rounded-lg p-6 text-center"
                                style={{
                                    borderColor: "var(--border)",
                                    background: "var(--bg-secondary)",
                                }}
                            >
                                <ShieldCheck
                                    className="w-8 h-8 mx-auto mb-2"
                                    style={{ color: "var(--success)" }}
                                />
                                <p
                                    className="text-sm"
                                    style={{ color: "var(--success)" }}
                                >
                                    No exposed secrets detected
                                </p>
                            </div>
                        ) : (
                            <div
                                className="border rounded-lg divide-y"
                                style={{
                                    borderColor: "var(--border)",
                                    background: "var(--bg-secondary)",
                                }}
                            >
                                {secrets.map((a) => {
                                    const key = `sec-${a.number}`;
                                    return (
                                        <AlertRow
                                            key={a.number}
                                            icon={AlertTriangle}
                                            iconColor="var(--error)"
                                            title={a.secret_type_display_name}
                                            expanded={expandedAlert === key}
                                            onToggle={() => toggleAlert(key)}
                                            badges={<>
                                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "rgba(255,59,48,0.15)", color: "var(--error)" }}>
                                                    {a.state}
                                                </span>
                                                <span className="font-mono">{a.secret_type}</span>
                                                {a.push_protection_bypassed && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,149,0,0.15)", color: "var(--warning)" }}>
                                                        Push protection bypassed
                                                    </span>
                                                )}
                                                <span>{timeAgo(a.created_at)}</span>
                                            </>}
                                        >
                                            <div className="text-xs space-y-1" style={{ color: "var(--text-secondary)" }}>
                                                <p><span style={{ color: "var(--text-tertiary)" }}>Type:</span> <span className="font-mono">{a.secret_type}</span></p>
                                                <p><span style={{ color: "var(--text-tertiary)" }}>Secret:</span> <span className="font-mono">{a.secret.slice(0, 16)}...</span></p>
                                                {a.resolution && <p><span style={{ color: "var(--text-tertiary)" }}>Resolution:</span> {a.resolution}</p>}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}>
                                                    #{a.number}
                                                </span>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDismissSecret(a); }}
                                                disabled={dismissing === key}
                                                className="text-xs px-3 py-1.5 border rounded-md font-medium mt-1 flex items-center gap-1"
                                                style={{ borderColor: "var(--warning)", color: "var(--warning)" }}
                                            >
                                                {dismissing === key ? <Loader2 className="w-3 h-3 animate-spin" /> : <MinusCircle className="w-3 h-3" />}
                                                Resolve
                                            </button>
                                        </AlertRow>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Settings Tab ---
type SettingsSection =
    | "general"
    | "collaborators"
    | "branches"
    | "webhooks"
    | "deploy-keys"
    | "danger";

const SettingsTab: React.FC<{
    owner: string;
    name: string;
    repo: GitHubRepo;
    onUpdate: (r: GitHubRepo) => void;
    navigate: ReturnType<typeof useNavigate>;
}> = ({ owner, name, repo, onUpdate, navigate }) => {
    const [section, setSection] = useState<SettingsSection>("general");

    const navItems: {
        id: SettingsSection;
        label: string;
        icon: React.ElementType;
        group?: string;
    }[] = [
        { id: "general", label: "General", icon: Settings },
        {
            id: "collaborators",
            label: "Collaborators",
            icon: Users,
            group: "Access",
        },
        {
            id: "branches",
            label: "Branches",
            icon: GitBranch,
            group: "Code and automation",
        },
        {
            id: "webhooks",
            label: "Webhooks",
            icon: Webhook,
            group: "Code and automation",
        },
        {
            id: "deploy-keys",
            label: "Deploy keys",
            icon: Key,
            group: "Security",
        },
        {
            id: "danger",
            label: "Danger Zone",
            icon: AlertTriangle,
            group: "Danger",
        },
    ];

    let lastGroup = "";

    return (
        <div className="flex gap-4">
            {/* Sidebar nav */}
            <div className="w-48 flex-shrink-0">
                {navItems.map((item) => {
                    const showGroup = item.group && item.group !== lastGroup;
                    if (item.group) lastGroup = item.group;
                    return (
                        <React.Fragment key={item.id}>
                            {showGroup && (
                                <p
                                    className="text-[10px] font-semibold uppercase mt-3 mb-1 px-2.5"
                                    style={{ color: "var(--text-tertiary)" }}
                                >
                                    {item.group}
                                </p>
                            )}
                            <button
                                onClick={() => setSection(item.id)}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md transition-colors text-left"
                                style={{
                                    background:
                                        section === item.id
                                            ? "var(--bg-tertiary)"
                                            : "transparent",
                                    color:
                                        item.id === "danger"
                                            ? "var(--error)"
                                            : section === item.id
                                              ? "var(--text-primary)"
                                              : "var(--text-secondary)",
                                    borderLeft:
                                        section === item.id
                                            ? "2px solid var(--accent)"
                                            : "2px solid transparent",
                                }}
                            >
                                <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                                {item.label}
                            </button>
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {section === "general" && (
                    <SettingsGeneral
                        owner={owner}
                        name={name}
                        repo={repo}
                        onUpdate={onUpdate}
                    />
                )}
                {section === "collaborators" && (
                    <SettingsCollaborators owner={owner} name={name} />
                )}
                {section === "branches" && (
                    <SettingsBranches owner={owner} name={name} repo={repo} />
                )}
                {section === "webhooks" && (
                    <SettingsWebhooks owner={owner} name={name} />
                )}
                {section === "deploy-keys" && (
                    <SettingsDeployKeys owner={owner} name={name} />
                )}
                {section === "danger" && (
                    <SettingsDanger
                        owner={owner}
                        name={name}
                        repo={repo}
                        onUpdate={onUpdate}
                        navigate={navigate}
                    />
                )}
            </div>
        </div>
    );
};

// --- Settings Sub-components ---

const SettingsGeneral: React.FC<{
    owner: string;
    name: string;
    repo: GitHubRepo;
    onUpdate: (r: GitHubRepo) => void;
}> = ({ owner, name, repo, onUpdate }) => {
    const [description, setDescription] = useState(repo.description || "");
    const [homepage, setHomepage] = useState(repo.homepage || "");
    const [isPrivate, setIsPrivate] = useState(repo.private);
    const [isTemplate, setIsTemplate] = useState(repo.is_template);
    const [hasIssues, setHasIssues] = useState(repo.has_issues);
    const [hasWiki, setHasWiki] = useState(repo.has_wiki);
    const [hasProjects, setHasProjects] = useState(repo.has_projects);
    const [allowSquash, setAllowSquash] = useState(repo.allow_squash_merge);
    const [allowMerge, setAllowMerge] = useState(repo.allow_merge_commit);
    const [allowRebase, setAllowRebase] = useState(repo.allow_rebase_merge);
    const [autoMerge, setAutoMerge] = useState(repo.allow_auto_merge);
    const [deleteBranch, setDeleteBranch] = useState(
        repo.delete_branch_on_merge,
    );
    const [signoff, setSignoff] = useState(repo.web_commit_signoff_required);
    const [defaultBranch, setDefaultBranch] = useState(repo.default_branch);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        setError("");
        try {
            const updated = await updateRepo(owner, name, {
                description,
                homepage,
                private: isPrivate,
                is_template: isTemplate,
                has_issues: hasIssues,
                has_wiki: hasWiki,
                has_projects: hasProjects,
                allow_squash_merge: allowSquash,
                allow_merge_commit: allowMerge,
                allow_rebase_merge: allowRebase,
                allow_auto_merge: autoMerge,
                delete_branch_on_merge: deleteBranch,
                web_commit_signoff_required: signoff,
                default_branch: defaultBranch,
            });
            onUpdate(updated);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (e: any) {
            setError(e?.message || "Failed to save settings.");
        }
        setSaving(false);
    };

    const Toggle: React.FC<{
        checked: boolean;
        onChange: (v: boolean) => void;
        label: string;
        desc?: string;
    }> = ({ checked, onChange, label, desc }) => (
        <div className="flex items-start justify-between py-1.5">
            <div>
                <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                    {label}
                </p>
                {desc && (
                    <p
                        className="text-xs"
                        style={{ color: "var(--text-tertiary)" }}
                    >
                        {desc}
                    </p>
                )}
            </div>
            <button
                onClick={() => onChange(!checked)}
                className="flex-shrink-0 mt-0.5"
            >
                {checked ? (
                    <ToggleRight
                        className="w-5 h-5"
                        style={{ color: "var(--accent)" }}
                    />
                ) : (
                    <ToggleLeft
                        className="w-5 h-5"
                        style={{ color: "var(--text-tertiary)" }}
                    />
                )}
            </button>
        </div>
    );

    return (
        <div className="space-y-4">
            <h3
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
            >
                General
            </h3>

            {/* Basic info */}
            <div
                className="border rounded-lg p-4 space-y-3"
                style={{
                    borderColor: "var(--border)",
                    background: "var(--bg-secondary)",
                }}
            >
                <div>
                    <label
                        className="text-xs font-medium block mb-1"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        Description
                    </label>
                    <input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="input-glass w-full text-sm"
                    />
                </div>
                <div>
                    <label
                        className="text-xs font-medium block mb-1"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        Homepage URL
                    </label>
                    <input
                        value={homepage}
                        onChange={(e) => setHomepage(e.target.value)}
                        className="input-glass w-full text-sm"
                        placeholder="https://"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label
                        className="text-xs font-medium"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        Visibility:
                    </label>
                    <select
                        value={isPrivate ? "private" : "public"}
                        onChange={(e) =>
                            setIsPrivate(e.target.value === "private")
                        }
                        className="input-glass text-xs"
                    >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                    </select>
                </div>
                <Toggle
                    checked={isTemplate}
                    onChange={setIsTemplate}
                    label="Template repository"
                    desc="Let users generate repos with the same structure"
                />
                <Toggle
                    checked={signoff}
                    onChange={setSignoff}
                    label="Require sign-off on web commits"
                    desc="Require contributors to sign off on web-based commits"
                />
            </div>

            {/* Default branch */}
            <div
                className="border rounded-lg p-4"
                style={{
                    borderColor: "var(--border)",
                    background: "var(--bg-secondary)",
                }}
            >
                <h4
                    className="text-sm font-semibold mb-2"
                    style={{ color: "var(--text-primary)" }}
                >
                    Default branch
                </h4>
                <p
                    className="text-xs mb-2"
                    style={{ color: "var(--text-tertiary)" }}
                >
                    The default branch is the base for pull requests and code
                    commits.
                </p>
                <input
                    value={defaultBranch}
                    onChange={(e) => setDefaultBranch(e.target.value)}
                    className="input-glass text-sm font-mono w-48"
                />
            </div>

            {/* Features */}
            <div
                className="border rounded-lg p-4"
                style={{
                    borderColor: "var(--border)",
                    background: "var(--bg-secondary)",
                }}
            >
                <h4
                    className="text-sm font-semibold mb-2"
                    style={{ color: "var(--text-primary)" }}
                >
                    Features
                </h4>
                <Toggle
                    checked={hasIssues}
                    onChange={setHasIssues}
                    label="Issues"
                    desc="Track bugs, tasks, and feature requests"
                />
                <Toggle
                    checked={hasProjects}
                    onChange={setHasProjects}
                    label="Projects"
                    desc="Organize and track work with project boards"
                />
                <Toggle
                    checked={hasWiki}
                    onChange={setHasWiki}
                    label="Wiki"
                    desc="Host documentation for your project"
                />
            </div>

            {/* Pull Requests */}
            <div
                className="border rounded-lg p-4"
                style={{
                    borderColor: "var(--border)",
                    background: "var(--bg-secondary)",
                }}
            >
                <h4
                    className="text-sm font-semibold mb-2"
                    style={{ color: "var(--text-primary)" }}
                >
                    Pull Requests
                </h4>
                <Toggle
                    checked={allowMerge}
                    onChange={setAllowMerge}
                    label="Allow merge commits"
                />
                <Toggle
                    checked={allowSquash}
                    onChange={setAllowSquash}
                    label="Allow squash merging"
                />
                <Toggle
                    checked={allowRebase}
                    onChange={setAllowRebase}
                    label="Allow rebase merging"
                />
                <Toggle
                    checked={autoMerge}
                    onChange={setAutoMerge}
                    label="Allow auto-merge"
                    desc="Automatically merge when requirements are met"
                />
                <Toggle
                    checked={deleteBranch}
                    onChange={setDeleteBranch}
                    label="Auto-delete head branches"
                    desc="Delete branches after pull requests are merged"
                />
            </div>

            {error && (
                <p className="text-xs px-1" style={{ color: "var(--error)" }}>{error}</p>
            )}

            <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1"
            >
                {saving ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                ) : saved ? (
                    <CheckCircle className="w-3 h-3" />
                ) : null}
                {saved ? "Saved" : "Save changes"}
            </button>
        </div>
    );
};

const SettingsCollaborators: React.FC<{ owner: string; name: string }> = ({
    owner,
    name,
}) => {
    const [collaborators, setCollaborators] = useState<GitHubCollaborator[]>(
        [],
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [newUser, setNewUser] = useState("");
    const [newPerm, setNewPerm] = useState("push");
    const [adding, setAdding] = useState(false);
    const [actionError, setActionError] = useState("");

    const load = () => {
        setLoading(true);
        fetchCollaborators(owner, name)
            .then(setCollaborators)
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };
    useEffect(() => {
        load();
    }, [owner, name]);

    const handleAdd = async () => {
        if (!newUser.trim() || adding) return;
        setAdding(true);
        setActionError("");
        try {
            await addCollaborator(owner, name, newUser, newPerm);
            setNewUser("");
            load();
        } catch (e: any) {
            setActionError(e?.message || "Failed to add collaborator.");
        }
        setAdding(false);
    };

    const handleRemove = async (user: string) => {
        setActionError("");
        try {
            await removeCollaborator(owner, name, user);
            load();
        } catch (e: any) {
            setActionError(e?.message || "Failed to remove collaborator.");
        }
    };

    if (loading)
        return (
            <div className="flex justify-center py-12">
                <Loader2
                    className="w-5 h-5 animate-spin"
                    style={{ color: "var(--text-tertiary)" }}
                />
            </div>
        );
    if (error)
        return (
            <p
                className="text-xs py-4 text-center"
                style={{ color: "var(--text-tertiary)" }}
            >
                Cannot access collaborators (requires admin).
            </p>
        );

    return (
        <div>
            <h3
                className="text-sm font-semibold mb-3"
                style={{ color: "var(--text-primary)" }}
            >
                Collaborators
            </h3>
            <div className="flex gap-2 mb-3">
                <input
                    value={newUser}
                    onChange={(e) => setNewUser(e.target.value)}
                    placeholder="GitHub username"
                    className="input-glass text-sm flex-1"
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
                <select
                    value={newPerm}
                    onChange={(e) => setNewPerm(e.target.value)}
                    className="input-glass text-xs w-28"
                >
                    <option value="pull">Read</option>
                    <option value="push">Write</option>
                    <option value="admin">Admin</option>
                    <option value="maintain">Maintain</option>
                    <option value="triage">Triage</option>
                </select>
                <button
                    onClick={handleAdd}
                    disabled={!newUser.trim() || adding}
                    className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                >
                    {adding ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        <UserPlus className="w-3 h-3" />
                    )}{" "}
                    Invite
                </button>
            </div>
            {actionError && (
                <p className="text-xs mb-2 px-1" style={{ color: "var(--error)" }}>{actionError}</p>
            )}
            <div
                className="border rounded-lg divide-y"
                style={{
                    borderColor: "var(--border)",
                    background: "var(--bg-secondary)",
                }}
            >
                {collaborators.map((c) => (
                    <div
                        key={c.id}
                        className="px-4 py-2.5 flex items-center gap-3"
                    >
                        <img
                            src={c.avatar_url}
                            alt={c.login}
                            className="w-7 h-7 rounded-full"
                        />
                        <div className="flex-1 min-w-0">
                            <span
                                className="text-sm font-medium"
                                style={{ color: "var(--text-primary)" }}
                            >
                                {c.login}
                            </span>
                        </div>
                        <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full"
                            style={{
                                background: "var(--bg-tertiary)",
                                color: "var(--text-tertiary)",
                            }}
                        >
                            {c.role_name}
                        </span>
                        <button
                            onClick={() => handleRemove(c.login)}
                            className="p-1 rounded hover:bg-[var(--bg-tertiary)]"
                            title="Remove"
                        >
                            <UserMinus
                                className="w-3.5 h-3.5"
                                style={{ color: "var(--error)" }}
                            />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SettingsBranches: React.FC<{
    owner: string;
    name: string;
    repo: GitHubRepo;
}> = ({ owner, name, repo }) => {
    const [branches, setBranches] = useState<GitHubBranch[]>([]);
    const [protections, setProtections] = useState<
        Record<string, GitHubBranchProtection | null>
    >({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRepoBranches(owner, name)
            .then(async (b) => {
                setBranches(b);
                const prots: Record<string, GitHubBranchProtection | null> = {};
                for (const br of b.filter((x) => x.protected)) {
                    prots[br.name] = await fetchBranchProtection(
                        owner,
                        name,
                        br.name,
                    );
                }
                setProtections(prots);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [owner, name]);

    if (loading)
        return (
            <div className="flex justify-center py-12">
                <Loader2
                    className="w-5 h-5 animate-spin"
                    style={{ color: "var(--text-tertiary)" }}
                />
            </div>
        );

    return (
        <div>
            <h3
                className="text-sm font-semibold mb-3"
                style={{ color: "var(--text-primary)" }}
            >
                Branch protection rules
            </h3>
            <div
                className="border rounded-lg divide-y"
                style={{
                    borderColor: "var(--border)",
                    background: "var(--bg-secondary)",
                }}
            >
                {branches.map((b) => {
                    const prot = protections[b.name];
                    return (
                        <div key={b.name} className="px-4 py-3">
                            <div className="flex items-center gap-2">
                                <GitBranch
                                    className="w-4 h-4"
                                    style={{
                                        color:
                                            b.name === repo.default_branch
                                                ? "var(--accent)"
                                                : "var(--text-tertiary)",
                                    }}
                                />
                                <span
                                    className="text-sm font-mono font-medium"
                                    style={{ color: "var(--text-primary)" }}
                                >
                                    {b.name}
                                </span>
                                {b.name === repo.default_branch && (
                                    <span
                                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                                        style={{
                                            background: "rgba(0,122,255,0.1)",
                                            color: "var(--accent)",
                                        }}
                                    >
                                        default
                                    </span>
                                )}
                                {b.protected && (
                                    <span
                                        className="text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                                        style={{
                                            background: "rgba(255,149,0,0.1)",
                                            color: "var(--warning)",
                                        }}
                                    >
                                        <Lock className="w-2.5 h-2.5" />{" "}
                                        protected
                                    </span>
                                )}
                            </div>
                            {prot && (
                                <div
                                    className="mt-1.5 ml-6 text-xs space-y-0.5"
                                    style={{ color: "var(--text-tertiary)" }}
                                >
                                    {prot.required_pull_request_reviews && (
                                        <p>
                                            Requires{" "}
                                            {
                                                prot
                                                    .required_pull_request_reviews
                                                    .required_approving_review_count
                                            }{" "}
                                            approving review(s)
                                            {prot.required_pull_request_reviews
                                                .dismiss_stale_reviews &&
                                                " / Dismiss stale reviews"}
                                            {prot.required_pull_request_reviews
                                                .require_code_owner_reviews &&
                                                " / Require code owner reviews"}
                                        </p>
                                    )}
                                    {prot.required_status_checks && (
                                        <p>
                                            Status checks:{" "}
                                            {prot.required_status_checks.contexts.join(
                                                ", ",
                                            ) || "none"}
                                            {prot.required_status_checks
                                                .strict && " (strict)"}
                                        </p>
                                    )}
                                    {prot.enforce_admins?.enabled && (
                                        <p>Enforce for admins</p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const SettingsWebhooks: React.FC<{ owner: string; name: string }> = ({
    owner,
    name,
}) => {
    const [hooks, setHooks] = useState<GitHubWebhook[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [url, setUrl] = useState("");
    const [events, setEvents] = useState("push");
    const [creating, setCreating] = useState(false);
    const [actionError, setActionError] = useState("");

    const load = () => {
        setLoading(true);
        fetchWebhooks(owner, name)
            .then(setHooks)
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };
    useEffect(() => {
        load();
    }, [owner, name]);

    const handleCreate = async () => {
        if (!url.trim() || creating) return;
        setCreating(true);
        setActionError("");
        try {
            await createWebhook(
                owner,
                name,
                url,
                events.split(",").map((s) => s.trim()),
            );
            setShowCreate(false);
            setUrl("");
            load();
        } catch (e: any) {
            setActionError(e?.message || "Failed to create webhook.");
        }
        setCreating(false);
    };

    const handleDelete = async (id: number) => {
        setActionError("");
        try {
            await deleteWebhook(owner, name, id);
            load();
        } catch (e: any) {
            setActionError(e?.message || "Failed to delete webhook.");
        }
    };

    if (loading)
        return (
            <div className="flex justify-center py-12">
                <Loader2
                    className="w-5 h-5 animate-spin"
                    style={{ color: "var(--text-tertiary)" }}
                />
            </div>
        );
    if (error)
        return (
            <p
                className="text-xs py-4 text-center"
                style={{ color: "var(--text-tertiary)" }}
            >
                Cannot access webhooks (requires admin).
            </p>
        );

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <h3
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                >
                    Webhooks
                </h3>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                >
                    <Plus className="w-3 h-3" /> Add webhook
                </button>
            </div>
            {actionError && (
                <p className="text-xs mb-2 px-1" style={{ color: "var(--error)" }}>{actionError}</p>
            )}
            {showCreate && (
                <div
                    className="border rounded-lg p-4 mb-3"
                    style={{
                        borderColor: "var(--border)",
                        background: "var(--bg-secondary)",
                    }}
                >
                    <input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Payload URL (https://...)"
                        className="input-glass w-full text-sm mb-2"
                    />
                    <input
                        value={events}
                        onChange={(e) => setEvents(e.target.value)}
                        placeholder="Events (comma-separated)"
                        className="input-glass w-full text-xs mb-2"
                    />
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => setShowCreate(false)}
                            className="btn-secondary text-xs px-3 py-1.5"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={!url.trim() || creating}
                            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                        >
                            {creating ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <Webhook className="w-3 h-3" />
                            )}{" "}
                            Create
                        </button>
                    </div>
                </div>
            )}
            {hooks.length === 0 ? (
                <p
                    className="text-xs text-center py-6"
                    style={{ color: "var(--text-tertiary)" }}
                >
                    No webhooks configured.
                </p>
            ) : (
                <div
                    className="border rounded-lg divide-y"
                    style={{
                        borderColor: "var(--border)",
                        background: "var(--bg-secondary)",
                    }}
                >
                    {hooks.map((h) => (
                        <div
                            key={h.id}
                            className="px-4 py-3 flex items-center gap-3"
                        >
                            <Webhook
                                className="w-4 h-4 flex-shrink-0"
                                style={{
                                    color: h.active
                                        ? "var(--success)"
                                        : "var(--text-tertiary)",
                                }}
                            />
                            <div className="flex-1 min-w-0">
                                <p
                                    className="text-sm font-mono truncate"
                                    style={{ color: "var(--text-primary)" }}
                                >
                                    {h.config.url}
                                </p>
                                <p
                                    className="text-xs"
                                    style={{ color: "var(--text-tertiary)" }}
                                >
                                    {h.events.join(", ")} /{" "}
                                    {h.active ? "Active" : "Inactive"} / Last
                                    updated {timeAgo(h.updated_at)}
                                </p>
                            </div>
                            <button
                                onClick={() => handleDelete(h.id)}
                                className="p-1 rounded hover:bg-[var(--bg-tertiary)]"
                                title="Delete"
                            >
                                <Trash
                                    className="w-3.5 h-3.5"
                                    style={{ color: "var(--error)" }}
                                />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const SettingsDeployKeys: React.FC<{ owner: string; name: string }> = ({
    owner,
    name,
}) => {
    const [keys, setKeys] = useState<GitHubDeployKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [title, setTitle] = useState("");
    const [keyValue, setKeyValue] = useState("");
    const [readOnly, setReadOnly] = useState(true);
    const [creating, setCreating] = useState(false);
    const [actionError, setActionError] = useState("");

    const load = () => {
        setLoading(true);
        fetchDeployKeys(owner, name)
            .then(setKeys)
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };
    useEffect(() => {
        load();
    }, [owner, name]);

    const handleCreate = async () => {
        if (!title.trim() || !keyValue.trim() || creating) return;
        setCreating(true);
        setActionError("");
        try {
            await addDeployKey(owner, name, title, keyValue, readOnly);
            setShowCreate(false);
            setTitle("");
            setKeyValue("");
            load();
        } catch (e: any) {
            setActionError(e?.message || "Failed to add deploy key.");
        }
        setCreating(false);
    };

    const handleDelete = async (id: number) => {
        setActionError("");
        try {
            await removeDeployKey(owner, name, id);
            load();
        } catch (e: any) {
            setActionError(e?.message || "Failed to remove deploy key.");
        }
    };

    if (loading)
        return (
            <div className="flex justify-center py-12">
                <Loader2
                    className="w-5 h-5 animate-spin"
                    style={{ color: "var(--text-tertiary)" }}
                />
            </div>
        );
    if (error)
        return (
            <p
                className="text-xs py-4 text-center"
                style={{ color: "var(--text-tertiary)" }}
            >
                Cannot access deploy keys (requires admin).
            </p>
        );

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <h3
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                >
                    Deploy keys
                </h3>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                >
                    <Plus className="w-3 h-3" /> Add deploy key
                </button>
            </div>
            {actionError && (
                <p className="text-xs mb-2 px-1" style={{ color: "var(--error)" }}>{actionError}</p>
            )}
            {showCreate && (
                <div
                    className="border rounded-lg p-4 mb-3"
                    style={{
                        borderColor: "var(--border)",
                        background: "var(--bg-secondary)",
                    }}
                >
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Title"
                        className="input-glass w-full text-sm mb-2"
                    />
                    <textarea
                        value={keyValue}
                        onChange={(e) => setKeyValue(e.target.value)}
                        placeholder="ssh-rsa AAAA..."
                        className="input-glass w-full text-xs h-20 resize-none font-mono mb-2"
                    />
                    <label
                        className="flex items-center gap-1.5 text-xs mb-2 cursor-pointer"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        <input
                            type="checkbox"
                            checked={readOnly}
                            onChange={(e) => setReadOnly(e.target.checked)}
                        />{" "}
                        Allow read access only
                    </label>
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => setShowCreate(false)}
                            className="btn-secondary text-xs px-3 py-1.5"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={
                                !title.trim() || !keyValue.trim() || creating
                            }
                            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                        >
                            {creating ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <Key className="w-3 h-3" />
                            )}{" "}
                            Add key
                        </button>
                    </div>
                </div>
            )}
            {keys.length === 0 ? (
                <p
                    className="text-xs text-center py-6"
                    style={{ color: "var(--text-tertiary)" }}
                >
                    No deploy keys configured.
                </p>
            ) : (
                <div
                    className="border rounded-lg divide-y"
                    style={{
                        borderColor: "var(--border)",
                        background: "var(--bg-secondary)",
                    }}
                >
                    {keys.map((k) => (
                        <div
                            key={k.id}
                            className="px-4 py-3 flex items-center gap-3"
                        >
                            <Key
                                className="w-4 h-4 flex-shrink-0"
                                style={{ color: "var(--text-tertiary)" }}
                            />
                            <div className="flex-1 min-w-0">
                                <p
                                    className="text-sm font-medium"
                                    style={{ color: "var(--text-primary)" }}
                                >
                                    {k.title}
                                </p>
                                <p
                                    className="text-xs font-mono truncate"
                                    style={{ color: "var(--text-tertiary)" }}
                                >
                                    {k.key.substring(0, 40)}... /{" "}
                                    {k.read_only ? "Read-only" : "Read-write"} /
                                    Added {timeAgo(k.created_at)}
                                </p>
                            </div>
                            <button
                                onClick={() => handleDelete(k.id)}
                                className="p-1 rounded hover:bg-[var(--bg-tertiary)]"
                                title="Delete"
                            >
                                <Trash
                                    className="w-3.5 h-3.5"
                                    style={{ color: "var(--error)" }}
                                />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const SettingsDanger: React.FC<{
    owner: string;
    name: string;
    repo: GitHubRepo;
    onUpdate: (r: GitHubRepo) => void;
    navigate: ReturnType<typeof useNavigate>;
}> = ({ owner, name, repo, onUpdate, navigate }) => {
    const [deleteConfirm, setDeleteConfirm] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [archiving, setArchiving] = useState(false);
    const [error, setError] = useState("");

    const handleArchive = async () => {
        setArchiving(true);
        setError("");
        try {
            const updated = await updateRepo(owner, name, {
                archived: !repo.archived,
            });
            onUpdate(updated);
        } catch (e: any) {
            setError(e?.message || "Failed to archive repository.");
        }
        setArchiving(false);
    };

    const handleDelete = async () => {
        if (deleteConfirm !== `${owner}/${name}` || deleting) return;
        setDeleting(true);
        setError("");
        try {
            await deleteRepo(owner, name);
            navigate("/repos");
        } catch (e: any) {
            setError(e?.message || "Failed to delete repository. Make sure you have the required permissions.");
        }
        setDeleting(false);
    };

    return (
        <div
            className="border rounded-lg"
            style={{
                borderColor: "var(--error)",
                background: "rgba(255,59,48,0.05)",
            }}
        >
            <h3
                className="text-sm font-semibold p-4 pb-0"
                style={{ color: "var(--error)" }}
            >
                Danger Zone
            </h3>
            <div
                className="divide-y"
                style={{ borderColor: "rgba(255,59,48,0.2)" }}
            >
                <div className="p-4 flex items-center justify-between">
                    <div>
                        <p
                            className="text-sm font-medium"
                            style={{ color: "var(--text-primary)" }}
                        >
                            {repo.archived ? "Unarchive" : "Archive"} this
                            repository
                        </p>
                        <p
                            className="text-xs"
                            style={{ color: "var(--text-tertiary)" }}
                        >
                            {repo.archived
                                ? "Unarchive to make it active again."
                                : "Mark as archived and read-only."}
                        </p>
                    </div>
                    <button
                        onClick={handleArchive}
                        disabled={archiving}
                        className="text-xs px-3 py-1.5 border rounded-md font-medium"
                        style={{
                            borderColor: "var(--warning)",
                            color: "var(--warning)",
                        }}
                    >
                        {archiving ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : repo.archived ? (
                            "Unarchive"
                        ) : (
                            "Archive"
                        )}
                    </button>
                </div>
                <div className="p-4">
                    <p
                        className="text-sm font-medium mb-1"
                        style={{ color: "var(--text-primary)" }}
                    >
                        Delete this repository
                    </p>
                    <p
                        className="text-xs mb-2"
                        style={{ color: "var(--text-tertiary)" }}
                    >
                        This action <strong>cannot be undone</strong>. Type{" "}
                        <span className="font-mono font-bold">
                            {owner}/{name}
                        </span>{" "}
                        to confirm.
                    </p>
                    <div className="flex gap-2">
                        <input
                            value={deleteConfirm}
                            onChange={(e) => setDeleteConfirm(e.target.value)}
                            className="input-glass text-xs flex-1"
                            placeholder={`${owner}/${name}`}
                        />
                        <button
                            onClick={handleDelete}
                            disabled={
                                deleteConfirm !== `${owner}/${name}` || deleting
                            }
                            className="text-xs px-3 py-1.5 rounded-md font-medium transition-colors"
                            style={{
                                background:
                                    deleteConfirm === `${owner}/${name}`
                                        ? "var(--error)"
                                        : "var(--bg-tertiary)",
                                color:
                                    deleteConfirm === `${owner}/${name}`
                                        ? "#fff"
                                        : "var(--text-tertiary)",
                            }}
                        >
                            {deleting ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                "Delete"
                            )}
                        </button>
                    {error && (
                        <p className="text-xs mt-2" style={{ color: "var(--error)" }}>{error}</p>
                    )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Branches Tab ---
const BranchesTab: React.FC<{
    owner: string;
    name: string;
    defaultBranch: string;
    onSelectBranch?: (branch: string) => void;
}> = ({ owner, name, defaultBranch, onSelectBranch }) => {
    const [branches, setBranches] = useState<GitHubBranch[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRepoBranches(owner, name)
            .then(setBranches)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [owner, name]);

    if (loading)
        return (
            <div className="flex justify-center py-12">
                <Loader2
                    className="w-5 h-5 animate-spin"
                    style={{ color: "var(--text-tertiary)" }}
                />
            </div>
        );
    if (branches.length === 0)
        return (
            <p
                className="text-center py-8 text-sm"
                style={{ color: "var(--text-tertiary)" }}
            >
                No branches.
            </p>
        );

    const sorted = [...branches].sort((a, b) => {
        if (a.name === defaultBranch) return -1;
        if (b.name === defaultBranch) return 1;
        return a.name.localeCompare(b.name);
    });

    return (
        <div
            className="border rounded-lg divide-y"
            style={{
                borderColor: "var(--border)",
                background: "var(--bg-secondary)",
            }}
        >
            {sorted.map((branch) => (
                <div
                    key={branch.name}
                    className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
                    onClick={() => onSelectBranch?.(branch.name)}
                    title={`View code on ${branch.name}`}
                >
                    <GitBranch
                        className="w-4 h-4 flex-shrink-0"
                        style={{
                            color:
                                branch.name === defaultBranch
                                    ? "var(--accent)"
                                    : "var(--text-tertiary)",
                        }}
                    />
                    <div className="flex-1 min-w-0">
                        <span
                            className="text-sm font-mono font-medium"
                            style={{ color: "var(--text-primary)" }}
                        >
                            {branch.name}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {branch.name === defaultBranch && (
                            <span
                                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                style={{
                                    background: "rgba(0,122,255,0.1)",
                                    color: "var(--accent)",
                                }}
                            >
                                default
                            </span>
                        )}
                        {branch.protected && (
                            <span
                                className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full"
                                style={{
                                    background: "rgba(255,149,0,0.1)",
                                    color: "var(--warning)",
                                }}
                            >
                                <Shield className="w-2.5 h-2.5" /> protected
                            </span>
                        )}
                        <span
                            className="text-[10px] font-mono"
                            style={{ color: "var(--text-tertiary)" }}
                        >
                            {branch.commit.sha.substring(0, 7)}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- Contributors Tab ---
const ContributorsTab: React.FC<{ owner: string; name: string }> = ({
    owner,
    name,
}) => {
    const [contributors, setContributors] = useState<GitHubContributor[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchRepoContributors(owner, name)
            .then(setContributors)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [owner, name]);

    if (loading)
        return (
            <div className="flex justify-center py-12">
                <Loader2
                    className="w-5 h-5 animate-spin"
                    style={{ color: "var(--text-tertiary)" }}
                />
            </div>
        );
    if (contributors.length === 0)
        return (
            <p
                className="text-center py-8 text-sm"
                style={{ color: "var(--text-tertiary)" }}
            >
                No contributors.
            </p>
        );

    return (
        <div
            className="border rounded-lg divide-y"
            style={{
                borderColor: "var(--border)",
                background: "var(--bg-secondary)",
            }}
        >
            {contributors.map((c) => (
                <div
                    key={c.login}
                    className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
                    onClick={() => navigate(`/profile/${c.login}`)}
                >
                    <img
                        src={c.avatar_url}
                        alt={c.login}
                        className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                        <span
                            className="text-sm font-medium"
                            style={{ color: "var(--text-primary)" }}
                        >
                            {c.login}
                        </span>
                    </div>
                    <span
                        className="text-xs"
                        style={{ color: "var(--text-tertiary)" }}
                    >
                        {c.contributions} commit
                        {c.contributions !== 1 ? "s" : ""}
                    </span>
                </div>
            ))}
        </div>
    );
};

// --- Copilot Agents Tab ---
const AgentsTab: React.FC<{ owner: string; name: string }> = ({
    owner,
    name,
}) => {
    const [sessions, setSessions] = useState<GitHubIssue[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [taskTitle, setTaskTitle] = useState("");
    const [taskBody, setTaskBody] = useState("");
    const [creating, setCreating] = useState(false);
    const [actionError, setActionError] = useState("");
    const navigate = useNavigate();

    const load = () => {
        setLoading(true);
        fetchCopilotIssues(owner, name)
            .then(setSessions)
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, [owner, name]);

    const handleCreate = async () => {
        if (!taskTitle.trim() || creating) return;
        setCreating(true);
        setActionError("");
        try {
            const issue = await createCopilotTask(owner, name, taskTitle, taskBody);
            setShowCreate(false);
            setTaskTitle("");
            setTaskBody("");
            load();
            navigate(`/issue/${owner}/${name}/${issue.number}`);
        } catch (e: any) {
            setActionError(e?.message || "Failed to create agent task. Copilot may not be available.");
        }
        setCreating(false);
    };

    if (loading)
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--text-tertiary)" }} />
            </div>
        );

    if (error)
        return (
            <div className="border rounded-lg p-6 text-center" style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}>
                <Send className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-tertiary)" }} />
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Copilot coding agent is not available</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                    Requires a GitHub Copilot Pro/Business subscription and the feature enabled on this repository.
                </p>
            </div>
        );

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    <Send className="w-4 h-4" style={{ color: "var(--accent)" }} />
                    Copilot Agent Sessions
                </h3>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                >
                    <Plus className="w-3 h-3" /> New Task
                </button>
            </div>

            {actionError && (
                <p className="text-xs mb-2 px-1" style={{ color: "var(--error)" }}>{actionError}</p>
            )}

            {showCreate && (
                <div className="border rounded-lg p-4 mb-3" style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}>
                    <input
                        value={taskTitle}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        placeholder="Describe the task for Copilot..."
                        className="input-glass w-full text-sm mb-2"
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleCreate()}
                    />
                    <textarea
                        value={taskBody}
                        onChange={(e) => setTaskBody(e.target.value)}
                        placeholder="Additional context (optional)..."
                        className="input-glass w-full text-sm h-20 resize-none mb-2"
                    />
                    <div className="flex gap-2 justify-end">
                        <button onClick={() => setShowCreate(false)} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                        <button
                            onClick={handleCreate}
                            disabled={!taskTitle.trim() || creating}
                            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                        >
                            {creating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                            Assign to Copilot
                        </button>
                    </div>
                </div>
            )}

            {sessions.length === 0 ? (
                <div className="border rounded-lg p-6 text-center" style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}>
                    <Send className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-tertiary)" }} />
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No agent sessions yet</p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                        Create a task to assign to Copilot coding agent.
                    </p>
                </div>
            ) : (
                <div className="border rounded-lg divide-y" style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}>
                    {sessions.map((issue) => {
                        const isOpen = issue.state === "open";
                        const hasPR = !!issue.pull_request;
                        return (
                            <div
                                key={issue.id}
                                className="px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
                                onClick={() => navigate(`/issue/${owner}/${name}/${issue.number}`)}
                            >
                                <div className="mt-0.5 flex-shrink-0">
                                    {hasPR ? (
                                        <GitPullRequest className="w-4 h-4" style={{ color: "var(--accent)" }} />
                                    ) : isOpen ? (
                                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--warning)" }} />
                                    ) : (
                                        <CheckCircle className="w-4 h-4" style={{ color: "var(--success)" }} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                                        {issue.title}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
                                        <span className="font-medium px-1.5 py-0.5 rounded-full text-[10px]" style={{
                                            background: isOpen ? "rgba(255,149,0,0.15)" : "rgba(52,199,89,0.15)",
                                            color: isOpen ? "var(--warning)" : "var(--success)",
                                        }}>
                                            {hasPR ? "PR created" : isOpen ? "Working..." : "Completed"}
                                        </span>
                                        <span>#{issue.number}</span>
                                        <span>{timeAgo(issue.created_at)}</span>
                                        {issue.labels.length > 0 && issue.labels.map((l) => (
                                            <span key={l.name} className="px-1.5 py-0.5 rounded-full text-[10px]" style={{ background: `#${l.color}30`, color: `#${l.color}` }}>
                                                {l.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// --- Environments Tab ---
const EnvironmentsTab: React.FC<{ owner: string; name: string }> = ({
    owner,
    name,
}) => {
    const [environments, setEnvironments] = useState<GitHubEnvironment[]>([]);
    const [deployments, setDeployments] = useState<Record<string, GitHubDeployment[]>>({});
    const [statuses, setStatuses] = useState<Record<number, GitHubDeploymentStatus[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [expandedEnv, setExpandedEnv] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchEnvironments(owner, name)
            .then(async (envs) => {
                setEnvironments(envs);
                const deps: Record<string, GitHubDeployment[]> = {};
                for (const env of envs) {
                    try {
                        deps[env.name] = await fetchDeployments(owner, name, env.name);
                    } catch {
                        deps[env.name] = [];
                    }
                }
                setDeployments(deps);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [owner, name]);

    const loadStatuses = async (dep: GitHubDeployment) => {
        if (statuses[dep.id]) return;
        try {
            const s = await fetchDeploymentStatuses(owner, name, dep.id);
            setStatuses((prev) => ({ ...prev, [dep.id]: s }));
        } catch {}
    };

    const deployStatusColor = (state: string) => {
        switch (state) {
            case "success": return "var(--success)";
            case "error": case "failure": return "var(--error)";
            case "in_progress": case "pending": case "queued": return "var(--warning)";
            case "inactive": return "var(--text-tertiary)";
            default: return "var(--text-tertiary)";
        }
    };

    if (loading)
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--text-tertiary)" }} />
            </div>
        );

    if (error)
        return (
            <div className="border rounded-lg p-6 text-center" style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}>
                <Archive className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-tertiary)" }} />
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Environments not available</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                    Requires admin access or no environments configured.
                </p>
            </div>
        );

    if (environments.length === 0)
        return (
            <div className="border rounded-lg p-6 text-center" style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}>
                <Archive className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-tertiary)" }} />
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No environments configured</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                    Configure deployment environments in your repository settings or GitHub Actions workflows.
                </p>
            </div>
        );

    return (
        <div className="space-y-3">
            {environments.map((env) => {
                const isExpanded = expandedEnv === env.name;
                const envDeploys = deployments[env.name] || [];
                const latestDeploy = envDeploys[0];
                return (
                    <div key={env.id} className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border)" }}>
                        <div
                            className="px-4 py-3 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
                            style={{ background: "var(--bg-secondary)" }}
                            onClick={() => {
                                setExpandedEnv(isExpanded ? null : env.name);
                                if (!isExpanded && latestDeploy) loadStatuses(latestDeploy);
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <Archive className="w-4 h-4" style={{ color: "var(--accent)" }} />
                                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                                    {env.name}
                                </span>
                                {env.protection_rules.length > 0 && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,149,0,0.1)", color: "var(--warning)" }}>
                                        <Shield className="w-2.5 h-2.5 inline mr-0.5" />
                                        {env.protection_rules.length} rule{env.protection_rules.length > 1 ? "s" : ""}
                                    </span>
                                )}
                                {env.deployment_branch_policy && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(0,122,255,0.1)", color: "var(--accent)" }}>
                                        Branch policy
                                    </span>
                                )}
                                <span className="text-xs ml-auto" style={{ color: "var(--text-tertiary)" }}>
                                    {envDeploys.length} deployment{envDeploys.length !== 1 ? "s" : ""}
                                </span>
                                <ChevronDown
                                    className="w-4 h-4 flex-shrink-0 transition-transform"
                                    style={{ color: "var(--text-tertiary)", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                                />
                            </div>
                        </div>
                        {isExpanded && (
                            <div className="border-t divide-y" style={{ borderColor: "var(--border)" }}>
                                {env.protection_rules.length > 0 && (
                                    <div className="px-4 py-2" style={{ background: "var(--bg-tertiary)" }}>
                                        <p className="text-[10px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Protection Rules</p>
                                        {env.protection_rules.map((rule) => (
                                            <div key={rule.id} className="text-xs flex items-center gap-2 py-0.5" style={{ color: "var(--text-tertiary)" }}>
                                                <Shield className="w-3 h-3" style={{ color: "var(--warning)" }} />
                                                <span>{rule.type === "required_reviewers" ? "Required reviewers" : rule.type === "wait_timer" ? `Wait timer: ${rule.wait_timer} min` : rule.type}</span>
                                                {rule.reviewers && rule.reviewers.map((r) => (
                                                    <span
                                                        key={r.reviewer.login}
                                                        className="flex items-center gap-1 cursor-pointer hover:underline"
                                                        onClick={() => navigate(`/profile/${r.reviewer.login}`)}
                                                    >
                                                        <img src={r.reviewer.avatar_url} alt="" className="w-3 h-3 rounded-full" />
                                                        {r.reviewer.login}
                                                    </span>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {envDeploys.length === 0 ? (
                                    <p className="px-4 py-4 text-xs text-center" style={{ color: "var(--text-tertiary)" }}>No deployments yet.</p>
                                ) : (
                                    envDeploys.slice(0, 10).map((dep) => {
                                        const depStatuses = statuses[dep.id] || [];
                                        const latestStatus = depStatuses[0];
                                        return (
                                            <div
                                                key={dep.id}
                                                className="px-4 py-2.5"
                                                onMouseEnter={() => loadStatuses(dep)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {latestStatus ? (
                                                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: deployStatusColor(latestStatus.state) }} />
                                                    ) : (
                                                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "var(--text-tertiary)" }} />
                                                    )}
                                                    <span className="text-xs font-mono" style={{ color: "var(--text-primary)" }}>
                                                        {dep.sha.substring(0, 7)}
                                                    </span>
                                                    <span className="text-xs font-mono" style={{ color: "var(--accent)" }}>
                                                        {dep.ref}
                                                    </span>
                                                    {latestStatus && (
                                                        <span
                                                            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                                            style={{ background: `${deployStatusColor(latestStatus.state)}15`, color: deployStatusColor(latestStatus.state) }}
                                                        >
                                                            {latestStatus.state}
                                                        </span>
                                                    )}
                                                    {dep.creator && (
                                                        <span
                                                            className="flex items-center gap-1 text-xs cursor-pointer hover:underline ml-auto"
                                                            style={{ color: "var(--text-tertiary)" }}
                                                            onClick={() => navigate(`/profile/${dep.creator!.login}`)}
                                                        >
                                                            <img src={dep.creator.avatar_url} alt="" className="w-3.5 h-3.5 rounded-full" />
                                                            {dep.creator.login}
                                                        </span>
                                                    )}
                                                    <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                                                        {timeAgo(dep.created_at)}
                                                    </span>
                                                </div>
                                                {dep.description && (
                                                    <p className="text-xs mt-0.5 ml-4" style={{ color: "var(--text-tertiary)" }}>{dep.description}</p>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default RepoDetail;
