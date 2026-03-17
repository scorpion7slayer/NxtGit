import React, { useState, useEffect, useCallback } from "react";
import {
    Bug,
    Lightbulb,
    HelpCircle,
    MessageSquare,
    Send,
    Loader2,
    CheckCircle,
    CircleDot,
    ExternalLink,
    ChevronRight,
    Monitor,
    RefreshCw,
    ArrowLeft,
    CheckCircle2,
    MessageCircle,
    XCircle,
    RotateCcw,
    Plus,
} from "lucide-react";
import { open } from "@tauri-apps/plugin-shell";
import { getVersion } from "@tauri-apps/api/app";
import {
    createIssue,
    createComment,
    fetchRepoIssuesNoCache,
    fetchIssueCommentsNoCache,
    updateIssueState,
    timeAgo,
    type GitHubIssue,
    type GitHubComment,
} from "../lib/github";
import { APP_FALLBACK_VERSION } from "../lib/appMeta";
import MarkdownRenderer from "./MarkdownRenderer";

const OWNER = "scorpion7slayer";
const REPO = "NxtGit";

// --- Categories ---

interface Category {
    id: string;
    icon: React.ElementType;
    color: string;
    label: string;
    ghLabel: string;
    titlePrefix: string;
}

const CATEGORIES: Category[] = [
    {
        id: "bug",
        icon: Bug,
        color: "var(--error)",
        label: "Bug",
        ghLabel: "bug",
        titlePrefix: "[Bug]",
    },
    {
        id: "feature",
        icon: Lightbulb,
        color: "var(--warning)",
        label: "Idea",
        ghLabel: "enhancement",
        titlePrefix: "[Feature]",
    },
    {
        id: "question",
        icon: HelpCircle,
        color: "var(--accent)",
        label: "Question",
        ghLabel: "question",
        titlePrefix: "[Question]",
    },
    {
        id: "feedback",
        icon: MessageSquare,
        color: "var(--success)",
        label: "Feedback",
        ghLabel: "feedback",
        titlePrefix: "[Feedback]",
    },
];

// --- Platforms ---

const PLATFORMS = [
    "macOS (Apple Silicon)",
    "macOS (Intel)",
    "Windows",
    "Windows (ARM)",
    "Linux",
    "Linux (ARM)",
] as const;

type Platform = (typeof PLATFORMS)[number];

function detectPlatform(): Platform {
    const ua = navigator.userAgent;
    if (ua.includes("Macintosh")) {
        return "macOS (Apple Silicon)";
    }
    if (ua.includes("Windows")) {
        if (ua.includes("ARM") || ua.includes("WOA")) return "Windows (ARM)";
        return "Windows";
    }
    if (ua.includes("aarch64") || ua.includes("arm")) return "Linux (ARM)";
    return "Linux";
}

// --- Build markdown body from form fields ---

function buildBody(fields: {
    description: string;
    steps: string;
    expected: string;
    platform: Platform;
    version: string;
    categoryId: string;
}): string {
    const sections: string[] = [];

    sections.push(
        `## Description\n\n${fields.description || "_No details provided._"}`,
    );

    if (fields.categoryId === "bug") {
        if (fields.steps.trim()) {
            sections.push(`## Steps to reproduce\n\n${fields.steps}`);
        }
        if (fields.expected.trim()) {
            sections.push(`## Expected behavior\n\n${fields.expected}`);
        }
    }

    sections.push(
        `## Environment\n\n| | |\n|---|---|\n| **Platform** | ${fields.platform} |\n| **NxtGit version** | v${fields.version} |`,
    );

    return sections.join("\n\n");
}

// --- Shared input style ---

const inputStyle: React.CSSProperties = {
    background: "var(--bg-tertiary)",
    borderColor: "var(--border)",
    color: "var(--text-primary)",
};

function labelColor(hex: string): string {
    return `#${hex}`;
}

// --- Main component ---

const Support: React.FC = () => {
    const [category, setCategory] = useState<Category>(CATEGORIES[0]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [steps, setSteps] = useState("");
    const [expected, setExpected] = useState("");
    const [platform, setPlatform] = useState<Platform>(detectPlatform());
    const [appVersion, setAppVersion] = useState(APP_FALLBACK_VERSION);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    // Sidebar
    const [issues, setIssues] = useState<GitHubIssue[]>([]);
    const [loadingIssues, setLoadingIssues] = useState(true);
    const [issueError, setIssueError] = useState(false);

    // Detail view
    const [selectedIssue, setSelectedIssue] = useState<GitHubIssue | null>(null);

    useEffect(() => {
        getVersion().then(setAppVersion).catch(() => {});
    }, []);

    const loadIssues = useCallback(() => {
        setLoadingIssues(true);
        setIssueError(false);
        fetchRepoIssuesNoCache(OWNER, REPO)
            .then((all) => {
                setIssues(all.filter((i) => !i.pull_request).slice(0, 30));
            })
            .catch(() => setIssueError(true))
            .finally(() => setLoadingIssues(false));
    }, []);

    // Load issues on mount
    useEffect(() => {
        loadIssues();
    }, [loadIssues]);

    const submit = async () => {
        if (!title.trim()) return;
        setSending(true);
        setError("");
        try {
            const fullTitle = `${category.titlePrefix} ${title}`;
            const body = buildBody({
                description,
                steps,
                expected,
                platform,
                version: appVersion,
                categoryId: category.id,
            });
            const created = await createIssue(OWNER, REPO, fullTitle, body, [category.ghLabel]);
            // Immediately add the new issue to the sidebar
            setIssues((prev) => [created, ...prev.filter((i) => i.id !== created.id)].slice(0, 30));
            setSent(true);
            setTitle("");
            setDescription("");
            setSteps("");
            setExpected("");
            // Also do a background refresh for consistency
            setTimeout(loadIssues, 3000);
            setTimeout(() => setSent(false), 4000);
        } catch (e: any) {
            setError(e?.message || "Failed to submit. Check your connection.");
        } finally {
            setSending(false);
        }
    };

    const openIssue = (issue: GitHubIssue) => {
        setSelectedIssue(issue);
    };

    const closeDetail = () => {
        setSelectedIssue(null);
    };

    const handleStateChange = (issue: GitHubIssue, newState: "open" | "closed") => {
        // Update sidebar list
        setIssues((prev) =>
            prev.map((i) => (i.id === issue.id ? { ...i, state: newState } : i)),
        );
        // Update selected issue
        setSelectedIssue((prev) =>
            prev && prev.id === issue.id ? { ...prev, state: newState } : prev,
        );
    };

    const isBug = category.id === "bug";

    return (
        <div className="flex h-full">
            {/* ---- Main area ---- */}
            <div className="flex-1 overflow-y-auto">
                {selectedIssue ? (
                    <IssueDetail
                        issue={selectedIssue}
                        onBack={closeDetail}
                        onStateChange={handleStateChange}
                    />
                ) : (
                    <div className="p-6">
                        <h1
                            className="text-lg font-semibold mb-1"
                            style={{ color: "var(--text-primary)" }}
                        >
                            Help & Feedback
                        </h1>
                        <p
                            className="text-sm mb-6"
                            style={{ color: "var(--text-secondary)" }}
                        >
                            Something to report? Fill in the details and we'll create a
                            ticket.
                        </p>

                        {/* Category */}
                        <div className="flex gap-2 mb-5 flex-wrap">
                            {CATEGORIES.map((cat) => {
                                const Icon = cat.icon;
                                const active = category.id === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setCategory(cat)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
                                        style={{
                                            borderColor: active
                                                ? cat.color
                                                : "var(--border)",
                                            background: active
                                                ? `${cat.color}15`
                                                : "var(--bg-secondary)",
                                            color: active
                                                ? cat.color
                                                : "var(--text-secondary)",
                                        }}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        {cat.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Title */}
                        <Field label="Title">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Short summary"
                                className="w-full text-sm px-3 py-2 rounded-lg border outline-none transition-colors focus:border-[var(--accent)]"
                                style={inputStyle}
                            />
                        </Field>

                        {/* Description */}
                        <Field label="Description">
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={
                                    isBug
                                        ? "What happened?"
                                        : category.id === "feature"
                                          ? "What would you like to see in NxtGit?"
                                          : category.id === "question"
                                            ? "What do you need help with?"
                                            : "What do you think of NxtGit so far?"
                                }
                                rows={3}
                                className="w-full text-sm px-3 py-2 rounded-lg border outline-none transition-colors focus:border-[var(--accent)] resize-y"
                                style={inputStyle}
                            />
                        </Field>

                        {/* Bug-only fields */}
                        {isBug && (
                            <>
                                <Field label="Steps to reproduce">
                                    <textarea
                                        value={steps}
                                        onChange={(e) => setSteps(e.target.value)}
                                        placeholder={"1. Go to …\n2. Click on …\n3. See error"}
                                        rows={3}
                                        className="w-full text-sm px-3 py-2 rounded-lg border outline-none transition-colors focus:border-[var(--accent)] resize-y"
                                        style={inputStyle}
                                    />
                                </Field>

                                <Field label="Expected behavior">
                                    <textarea
                                        value={expected}
                                        onChange={(e) => setExpected(e.target.value)}
                                        placeholder="What should have happened instead?"
                                        rows={2}
                                        className="w-full text-sm px-3 py-2 rounded-lg border outline-none transition-colors focus:border-[var(--accent)] resize-y"
                                        style={inputStyle}
                                    />
                                </Field>
                            </>
                        )}

                        {/* Platform + Version */}
                        <div className="flex gap-3 mb-5">
                            <div className="flex-1">
                                <label
                                    className="block text-xs font-medium mb-1.5"
                                    style={{ color: "var(--text-secondary)" }}
                                >
                                    Platform
                                </label>
                                <div className="relative">
                                    <Monitor
                                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                                        style={{ color: "var(--text-tertiary)" }}
                                    />
                                    <select
                                        value={platform}
                                        onChange={(e) =>
                                            setPlatform(e.target.value as Platform)
                                        }
                                        className="w-full text-sm pl-8 pr-3 py-2 rounded-lg border outline-none appearance-none transition-colors focus:border-[var(--accent)]"
                                        style={inputStyle}
                                    >
                                        {PLATFORMS.map((p) => (
                                            <option key={p} value={p}>
                                                {p}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="w-32">
                                <label
                                    className="block text-xs font-medium mb-1.5"
                                    style={{ color: "var(--text-secondary)" }}
                                >
                                    Version
                                </label>
                                <input
                                    type="text"
                                    value={`v${appVersion}`}
                                    readOnly
                                    className="w-full text-sm px-3 py-2 rounded-lg border outline-none"
                                    style={{
                                        ...inputStyle,
                                        color: "var(--text-tertiary)",
                                    }}
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={submit}
                                disabled={!title.trim() || sending}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-opacity"
                                style={{
                                    background: "var(--accent)",
                                    color: "white",
                                    opacity: !title.trim() || sending ? 0.5 : 1,
                                }}
                            >
                                {sending ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Send className="w-3.5 h-3.5" />
                                )}
                                {sending ? "Submitting…" : "Submit"}
                            </button>

                            {sent && (
                                <span
                                    className="flex items-center gap-1 text-xs font-medium"
                                    style={{ color: "var(--success)" }}
                                >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Ticket created!
                                </span>
                            )}

                            {error && (
                                <span
                                    className="text-xs"
                                    style={{ color: "var(--error)" }}
                                >
                                    {error}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ---- Sidebar: open tickets ---- */}
            <aside
                className="w-72 border-l flex flex-col flex-shrink-0 overflow-hidden"
                style={{
                    borderColor: "var(--border)",
                    background: "var(--bg-secondary)",
                }}
            >
                <div className="px-4 pt-5 pb-3 flex items-center justify-between">
                    <h2
                        className="text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--text-tertiary)" }}
                    >
                        Open tickets
                    </h2>
                    <div className="flex items-center gap-2">
                        {!loadingIssues && !issueError && (
                            <span
                                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                style={{
                                    background: "var(--bg-tertiary)",
                                    color: "var(--text-secondary)",
                                }}
                            >
                                {issues.length}
                            </span>
                        )}
                        <button
                            onClick={loadIssues}
                            disabled={loadingIssues}
                            className="p-1 rounded hover:bg-[var(--bg-tertiary)] transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw
                                className={`w-3 h-3 ${loadingIssues ? "animate-spin" : ""}`}
                                style={{ color: "var(--text-tertiary)" }}
                            />
                        </button>
                    </div>
                </div>

                {/* New ticket button */}
                {selectedIssue && (
                    <div className="px-4 pb-3">
                        <button
                            onClick={closeDetail}
                            className="flex items-center gap-1.5 w-full px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-[var(--bg-tertiary)]"
                            style={{
                                borderColor: "var(--border)",
                                color: "var(--accent)",
                            }}
                        >
                            <Plus className="w-3 h-3" />
                            New ticket
                        </button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto">
                    {loadingIssues ? (
                        <div className="flex justify-center py-8">
                            <Loader2
                                className="w-4 h-4 animate-spin"
                                style={{ color: "var(--text-tertiary)" }}
                            />
                        </div>
                    ) : issueError ? (
                        <div className="text-center py-8 px-4">
                            <p
                                className="text-xs mb-2"
                                style={{ color: "var(--text-tertiary)" }}
                            >
                                Couldn't load tickets.
                            </p>
                            <button
                                onClick={loadIssues}
                                className="text-xs font-medium"
                                style={{ color: "var(--accent)" }}
                            >
                                Retry
                            </button>
                        </div>
                    ) : issues.length === 0 ? (
                        <p
                            className="text-xs text-center py-8 px-4"
                            style={{ color: "var(--text-tertiary)" }}
                        >
                            No open tickets — all clear!
                        </p>
                    ) : (
                        <div
                            className="divide-y"
                            style={{ borderColor: "var(--border)" }}
                        >
                            {issues.map((issue) => (
                                <IssueRow
                                    key={issue.id}
                                    issue={issue}
                                    active={selectedIssue?.id === issue.id}
                                    onClick={() => openIssue(issue)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div
                    className="px-4 py-3 border-t"
                    style={{ borderColor: "var(--border)" }}
                >
                    <button
                        onClick={() =>
                            void open(
                                `https://github.com/${OWNER}/${REPO}/issues`,
                            )
                        }
                        className="flex items-center gap-1 text-[11px] font-medium w-full justify-center hover:underline"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        View all on GitHub
                        <ExternalLink className="w-3 h-3" />
                    </button>
                </div>
            </aside>
        </div>
    );
};

// --- Reusable field wrapper ---

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({
    label,
    children,
}) => (
    <div className="mb-4">
        <label
            className="block text-xs font-medium mb-1.5"
            style={{ color: "var(--text-secondary)" }}
        >
            {label}
        </label>
        {children}
    </div>
);

// --- Issue row ---

const IssueRow: React.FC<{
    issue: GitHubIssue;
    active: boolean;
    onClick: () => void;
}> = ({ issue, active, onClick }) => (
    <button
        className="w-full text-left px-4 py-2.5 hover:bg-[var(--bg-tertiary)] transition-colors flex items-start gap-2.5"
        style={active ? { background: "var(--bg-tertiary)" } : undefined}
        onClick={onClick}
    >
        {issue.state === "open" ? (
            <CircleDot
                className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                style={{ color: "var(--success)" }}
            />
        ) : (
            <CheckCircle2
                className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                style={{ color: "var(--text-tertiary)" }}
            />
        )}
        <div className="flex-1 min-w-0">
            <p
                className="text-xs font-medium truncate"
                style={{ color: "var(--text-primary)" }}
            >
                {issue.title}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
                {issue.labels.slice(0, 2).map((l) => (
                    <span
                        key={l.name}
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{
                            background: `${labelColor(l.color)}20`,
                            color: labelColor(l.color),
                            border: `1px solid ${labelColor(l.color)}40`,
                        }}
                    >
                        {l.name}
                    </span>
                ))}
                <span
                    className="text-[10px]"
                    style={{ color: "var(--text-tertiary)" }}
                >
                    #{issue.number} · {timeAgo(issue.created_at)}
                </span>
            </div>
        </div>
        <ChevronRight
            className="w-3 h-3 mt-1 flex-shrink-0"
            style={{ color: "var(--text-tertiary)" }}
        />
    </button>
);

// --- Issue detail view ---

const IssueDetail: React.FC<{
    issue: GitHubIssue;
    onBack: () => void;
    onStateChange: (issue: GitHubIssue, state: "open" | "closed") => void;
}> = ({ issue, onBack, onStateChange }) => {
    const [comments, setComments] = useState<GitHubComment[]>([]);
    const [loadingComments, setLoadingComments] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [sendingComment, setSendingComment] = useState(false);
    const [togglingState, setTogglingState] = useState(false);

    const loadComments = useCallback(() => {
        setLoadingComments(true);
        fetchIssueCommentsNoCache(OWNER, REPO, issue.number)
            .then(setComments)
            .catch(() => {})
            .finally(() => setLoadingComments(false));
    }, [issue.number]);

    useEffect(() => {
        loadComments();
    }, [loadComments]);

    const submitComment = async () => {
        if (!newComment.trim()) return;
        setSendingComment(true);
        try {
            const created = await createComment(OWNER, REPO, issue.number, newComment);
            setComments((prev) => [...prev, created]);
            setNewComment("");
        } catch {
            // silently fail
        } finally {
            setSendingComment(false);
        }
    };

    const toggleState = async () => {
        const newState = issue.state === "open" ? "closed" : "open";
        setTogglingState(true);
        try {
            await updateIssueState(OWNER, REPO, issue.number, newState);
            onStateChange(issue, newState);
        } catch {
            // silently fail
        } finally {
            setTogglingState(false);
        }
    };

    const handleCommentKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            submitComment();
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <button
                    onClick={onBack}
                    className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                    style={{ color: "var(--text-secondary)" }}
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1"
                            style={{
                                background: issue.state === "open" ? "rgba(52,199,89,0.15)" : "var(--bg-tertiary)",
                                color: issue.state === "open" ? "var(--success)" : "var(--text-tertiary)",
                            }}
                        >
                            {issue.state === "open" ? (
                                <CircleDot className="w-2.5 h-2.5" />
                            ) : (
                                <CheckCircle2 className="w-2.5 h-2.5" />
                            )}
                            {issue.state === "open" ? "Open" : "Closed"}
                        </span>
                        <span
                            className="text-[10px]"
                            style={{ color: "var(--text-tertiary)" }}
                        >
                            #{issue.number}
                        </span>
                    </div>
                    <h1
                        className="text-base font-semibold truncate"
                        style={{ color: "var(--text-primary)" }}
                    >
                        {issue.title}
                    </h1>
                </div>
                <button
                    onClick={() =>
                        void open(
                            `https://github.com/${OWNER}/${REPO}/issues/${issue.number}`,
                        )
                    }
                    className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors flex-shrink-0"
                    title="View on GitHub"
                    style={{ color: "var(--text-tertiary)" }}
                >
                    <ExternalLink className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Meta: author, labels, date */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
                <div className="flex items-center gap-1.5">
                    <img
                        src={issue.user.avatar_url}
                        alt={issue.user.login}
                        className="w-4 h-4 rounded-full"
                    />
                    <span
                        className="text-xs font-medium"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        {issue.user.login}
                    </span>
                </div>
                <span
                    className="text-[10px]"
                    style={{ color: "var(--text-tertiary)" }}
                >
                    {timeAgo(issue.created_at)}
                </span>
                {issue.labels.map((l) => (
                    <span
                        key={l.name}
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                        style={{
                            background: `${labelColor(l.color)}20`,
                            color: labelColor(l.color),
                            border: `1px solid ${labelColor(l.color)}40`,
                        }}
                    >
                        {l.name}
                    </span>
                ))}
            </div>

            {/* Body */}
            {issue.body ? (
                <div
                    className="rounded-lg border p-4 mb-5"
                    style={{
                        borderColor: "var(--border)",
                        background: "var(--bg-secondary)",
                    }}
                >
                    <MarkdownRenderer content={issue.body} />
                </div>
            ) : (
                <p
                    className="text-xs italic mb-5"
                    style={{ color: "var(--text-tertiary)" }}
                >
                    No description provided.
                </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 mb-6">
                <button
                    onClick={toggleState}
                    disabled={togglingState}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                    style={{
                        borderColor: issue.state === "open" ? "var(--error)" : "var(--success)",
                        color: issue.state === "open" ? "var(--error)" : "var(--success)",
                        background: issue.state === "open" ? "rgba(255,59,48,0.08)" : "rgba(52,199,89,0.08)",
                        opacity: togglingState ? 0.5 : 1,
                    }}
                >
                    {togglingState ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : issue.state === "open" ? (
                        <XCircle className="w-3 h-3" />
                    ) : (
                        <RotateCcw className="w-3 h-3" />
                    )}
                    {issue.state === "open" ? "Close ticket" : "Reopen ticket"}
                </button>
            </div>

            {/* Comments */}
            <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                    <MessageCircle
                        className="w-3.5 h-3.5"
                        style={{ color: "var(--text-tertiary)" }}
                    />
                    <h2
                        className="text-xs font-semibold uppercase tracking-wide flex-1"
                        style={{ color: "var(--text-tertiary)" }}
                    >
                        Comments
                        {!loadingComments && comments.length > 0 && (
                            <span
                                className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-medium normal-case"
                                style={{
                                    background: "var(--bg-tertiary)",
                                    color: "var(--text-secondary)",
                                }}
                            >
                                {comments.length}
                            </span>
                        )}
                    </h2>
                    <button
                        onClick={loadComments}
                        disabled={loadingComments}
                        className="p-1 rounded hover:bg-[var(--bg-tertiary)] transition-colors"
                        title="Refresh comments"
                    >
                        <RefreshCw
                            className={`w-3 h-3 ${loadingComments ? "animate-spin" : ""}`}
                            style={{ color: "var(--text-tertiary)" }}
                        />
                    </button>
                </div>

                {loadingComments ? (
                    <div className="flex justify-center py-6">
                        <Loader2
                            className="w-4 h-4 animate-spin"
                            style={{ color: "var(--text-tertiary)" }}
                        />
                    </div>
                ) : comments.length === 0 ? (
                    <p
                        className="text-xs py-4"
                        style={{ color: "var(--text-tertiary)" }}
                    >
                        No comments yet.
                    </p>
                ) : (
                    <div className="space-y-3 mb-4">
                        {comments.map((c) => (
                            <CommentCard key={c.id} comment={c} />
                        ))}
                    </div>
                )}
            </div>

            {/* Add comment */}
            <div
                className="rounded-lg border p-3"
                style={{
                    borderColor: "var(--border)",
                    background: "var(--bg-secondary)",
                }}
            >
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={handleCommentKeyDown}
                    placeholder="Write a comment…"
                    rows={3}
                    className="w-full text-sm px-3 py-2 rounded-lg border outline-none transition-colors focus:border-[var(--accent)] resize-y mb-2"
                    style={inputStyle}
                />
                <div className="flex items-center justify-between">
                    <span
                        className="text-[10px]"
                        style={{ color: "var(--text-tertiary)" }}
                    >
                        {navigator.platform.includes("Mac") ? "Cmd" : "Ctrl"}+Enter to send
                    </span>
                    <button
                        onClick={submitComment}
                        disabled={!newComment.trim() || sendingComment}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity"
                        style={{
                            background: "var(--accent)",
                            color: "white",
                            opacity: !newComment.trim() || sendingComment ? 0.5 : 1,
                        }}
                    >
                        {sendingComment ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <Send className="w-3 h-3" />
                        )}
                        Comment
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Comment card ---

const CommentCard: React.FC<{ comment: GitHubComment }> = ({ comment }) => (
    <div
        className="rounded-lg border p-3"
        style={{
            borderColor: "var(--border)",
            background: "var(--bg-secondary)",
        }}
    >
        <div className="flex items-center gap-2 mb-2">
            <img
                src={comment.user.avatar_url}
                alt={comment.user.login}
                className="w-4 h-4 rounded-full"
            />
            <span
                className="text-xs font-medium"
                style={{ color: "var(--text-primary)" }}
            >
                {comment.user.login}
            </span>
            <span
                className="text-[10px]"
                style={{ color: "var(--text-tertiary)" }}
            >
                {timeAgo(comment.created_at)}
            </span>
        </div>
        <MarkdownRenderer content={comment.body} className="text-sm" />
    </div>
);

export default Support;
