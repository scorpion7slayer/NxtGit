import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Bell,
    Inbox,
    Check,
    Loader2,
    CircleDot,
    GitPullRequest,
    GitCommit,
    MessageSquare,
    Tag,
    AlertTriangle,
    CheckCheck,
    Filter,
    RefreshCw,
} from "lucide-react";
import {
    fetchNotifications,
    markNotificationRead,
    markNotificationDone,
    markAllNotificationsRead,
    timeAgo,
    type GitHubNotification,
} from "../lib/github";

type NotifFilter = "all" | "unread" | "participating";
type NotifCategory = "inbox" | "saved" | "done";

const Notifications: React.FC = () => {
    const [notifications, setNotifications] = useState<GitHubNotification[]>(
        [],
    );
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<NotifFilter>("unread");
    const [category, setCategory] = useState<NotifCategory>("inbox");
    const [markingAll, setMarkingAll] = useState(false);
    const navigate = useNavigate();

    const load = useCallback(() => {
        setLoading(true);
        const all = filter === "all";
        const participating = filter === "participating";
        fetchNotifications(all, participating)
            .then(setNotifications)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [filter]);

    useEffect(() => {
        load();
    }, [load]);

    const handleMarkRead = async (id: string) => {
        await markNotificationRead(id);
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, unread: false } : n)),
        );
    };

    const handleMarkDone = async (id: string) => {
        await markNotificationDone(id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    const handleMarkAllRead = async () => {
        setMarkingAll(true);
        await markAllNotificationsRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
        setMarkingAll(false);
    };

    const subjectIcon = (type: string) => {
        switch (type) {
            case "Issue":
                return (
                    <CircleDot
                        className="w-4 h-4"
                        style={{ color: "var(--success)" }}
                    />
                );
            case "PullRequest":
                return (
                    <GitPullRequest
                        className="w-4 h-4"
                        style={{ color: "#A371F7" }}
                    />
                );
            case "Commit":
                return (
                    <GitCommit
                        className="w-4 h-4"
                        style={{ color: "var(--text-tertiary)" }}
                    />
                );
            case "Release":
                return (
                    <Tag
                        className="w-4 h-4"
                        style={{ color: "var(--accent)" }}
                    />
                );
            case "Discussion":
                return (
                    <MessageSquare
                        className="w-4 h-4"
                        style={{ color: "var(--accent)" }}
                    />
                );
            case "SecurityAdvisory":
                return (
                    <AlertTriangle
                        className="w-4 h-4"
                        style={{ color: "var(--warning)" }}
                    />
                );
            default:
                return (
                    <Bell
                        className="w-4 h-4"
                        style={{ color: "var(--text-tertiary)" }}
                    />
                );
        }
    };

    const reasonLabel = (reason: string) => {
        const map: Record<string, string> = {
            assign: "assigned",
            author: "author",
            comment: "comment",
            ci_activity: "CI",
            invitation: "invitation",
            manual: "manual",
            mention: "mentioned",
            review_requested: "review requested",
            security_alert: "security",
            state_change: "state change",
            subscribed: "subscribed",
            team_mention: "team mentioned",
        };
        return map[reason] || reason;
    };

    const navigateToNotif = (n: GitHubNotification) => {
        if (n.unread) markNotificationRead(n.id);
        const repo = n.repository;
        const url = n.subject.url;
        if (!url) {
            navigate(`/repos/${repo.full_name}`);
            return;
        }
        // Parse issue/PR number from API url
        const issueMatch = url.match(/\/issues\/(\d+)$/);
        if (issueMatch) {
            navigate(`/issue/${repo.full_name}/${issueMatch[1]}`);
            return;
        }
        const prMatch = url.match(/\/pulls\/(\d+)$/);
        if (prMatch) {
            navigate(`/pr/${repo.full_name}/${prMatch[1]}`);
            return;
        }
        const commitMatch = url.match(/\/commits\/([a-f0-9]+)$/);
        if (commitMatch) {
            navigate(`/commit/${repo.full_name}/${commitMatch[1]}`);
            return;
        }
        navigate(`/repos/${repo.full_name}`);
    };

    // Group by repo
    const grouped = notifications.reduce<Record<string, GitHubNotification[]>>(
        (acc, n) => {
            const key = n.repository.full_name;
            if (!acc[key]) acc[key] = [];
            acc[key].push(n);
            return acc;
        },
        {},
    );

    const unreadCount = notifications.filter((n) => n.unread).length;

    return (
        <div className="p-6 w-full">
            <header className="mb-6 flex items-center justify-between">
                <div>
                    <h1
                        className="text-xl font-semibold flex items-center gap-2"
                        style={{ color: "var(--text-primary)" }}
                    >
                        <Bell className="w-5 h-5" /> Notifications
                        {unreadCount > 0 && (
                            <span
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{
                                    background: "var(--accent)",
                                    color: "#fff",
                                }}
                            >
                                {unreadCount}
                            </span>
                        )}
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={load}
                        className="p-1.5 rounded-md hover:bg-[var(--bg-tertiary)]"
                        title="Refresh"
                    >
                        <RefreshCw
                            className="w-4 h-4"
                            style={{ color: "var(--text-secondary)" }}
                        />
                    </button>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            disabled={markingAll}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 border rounded-md hover:bg-[var(--bg-tertiary)]"
                            style={{
                                borderColor: "var(--border)",
                                color: "var(--text-secondary)",
                            }}
                        >
                            {markingAll ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <CheckCheck className="w-3 h-3" />
                            )}
                            Mark all read
                        </button>
                    )}
                </div>
            </header>

            <div className="flex gap-4">
                {/* Sidebar */}
                <div className="w-48 flex-shrink-0 space-y-4">
                    <div className="space-y-0.5">
                        <SideButton
                            active={category === "inbox"}
                            onClick={() => setCategory("inbox")}
                            icon={Inbox}
                            label="Inbox"
                            count={unreadCount}
                        />
                    </div>

                    <div>
                        <p
                            className="text-[10px] font-semibold uppercase mb-1 px-2.5"
                            style={{ color: "var(--text-tertiary)" }}
                        >
                            Filters
                        </p>
                        <div className="space-y-0.5">
                            {(
                                [
                                    "unread",
                                    "all",
                                    "participating",
                                ] as NotifFilter[]
                            ).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md transition-colors text-left"
                                    style={{
                                        background:
                                            filter === f
                                                ? "var(--bg-tertiary)"
                                                : "transparent",
                                        color:
                                            filter === f
                                                ? "var(--text-primary)"
                                                : "var(--text-secondary)",
                                        borderLeft:
                                            filter === f
                                                ? "2px solid var(--accent)"
                                                : "2px solid transparent",
                                    }}
                                >
                                    <Filter className="w-3 h-3" />
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Repos sidebar */}
                    {Object.keys(grouped).length > 0 && (
                        <div>
                            <p
                                className="text-[10px] font-semibold uppercase mb-1 px-2.5"
                                style={{ color: "var(--text-tertiary)" }}
                            >
                                Repositories
                            </p>
                            <div className="space-y-0.5">
                                {Object.entries(grouped).map(
                                    ([repo, notifs]) => (
                                        <div
                                            key={repo}
                                            className="flex items-center justify-between px-2.5 py-1 text-xs rounded-md"
                                            style={{
                                                color: "var(--text-secondary)",
                                            }}
                                        >
                                            <span className="truncate">
                                                {repo}
                                            </span>
                                            <span
                                                className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                                                style={{
                                                    background:
                                                        "var(--bg-tertiary)",
                                                }}
                                            >
                                                {notifs.length}
                                            </span>
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                    {/* Filter pills */}
                    <div className="flex items-center gap-2 mb-3">
                        <span
                            className="text-xs"
                            style={{ color: "var(--text-tertiary)" }}
                        >
                            {notifications.length} notification
                            {notifications.length !== 1 ? "s" : ""}
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-16">
                            <Loader2
                                className="w-6 h-6 animate-spin"
                                style={{ color: "var(--text-tertiary)" }}
                            />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Inbox
                                className="w-12 h-12 mb-3"
                                style={{ color: "var(--text-tertiary)" }}
                            />
                            <p
                                className="text-sm"
                                style={{ color: "var(--text-secondary)" }}
                            >
                                All caught up!
                            </p>
                            <p
                                className="text-xs"
                                style={{ color: "var(--text-tertiary)" }}
                            >
                                No notifications to show.
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
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className="px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
                                    onClick={() => navigateToNotif(n)}
                                >
                                    {/* Unread dot */}
                                    <div
                                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                                        style={{
                                            background: n.unread
                                                ? "var(--accent)"
                                                : "transparent",
                                        }}
                                    />
                                    {/* Subject icon */}
                                    <div className="mt-0.5 flex-shrink-0">
                                        {subjectIcon(n.subject.type)}
                                    </div>
                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="text-xs"
                                                style={{
                                                    color: "var(--text-tertiary)",
                                                }}
                                            >
                                                {n.repository.full_name}
                                            </span>
                                        </div>
                                        <p
                                            className="text-sm font-medium mt-0.5"
                                            style={{
                                                color: n.unread
                                                    ? "var(--text-primary)"
                                                    : "var(--text-secondary)",
                                            }}
                                        >
                                            {n.subject.title}
                                        </p>
                                        <div
                                            className="flex items-center gap-2 mt-1 text-xs"
                                            style={{
                                                color: "var(--text-tertiary)",
                                            }}
                                        >
                                            <span
                                                className="px-1.5 py-0.5 rounded-full text-[10px]"
                                                style={{
                                                    background:
                                                        "var(--bg-tertiary)",
                                                }}
                                            >
                                                {reasonLabel(n.reason)}
                                            </span>
                                            <span>{timeAgo(n.updated_at)}</span>
                                        </div>
                                    </div>
                                    {/* Actions */}
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        {n.unread && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMarkRead(n.id);
                                                }}
                                                className="p-1 rounded hover:bg-[var(--bg-tertiary)]"
                                                title="Mark as read"
                                            >
                                                <Check
                                                    className="w-3.5 h-3.5"
                                                    style={{
                                                        color: "var(--text-tertiary)",
                                                    }}
                                                />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMarkDone(n.id);
                                            }}
                                            className="p-1 rounded hover:bg-[var(--bg-tertiary)]"
                                            title="Done"
                                        >
                                            <CheckCheck
                                                className="w-3.5 h-3.5"
                                                style={{
                                                    color: "var(--text-tertiary)",
                                                }}
                                            />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const SideButton: React.FC<{
    active: boolean;
    onClick: () => void;
    icon: React.ElementType;
    label: string;
    count?: number;
}> = ({ active, onClick, icon: Icon, label, count }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md transition-colors text-left"
        style={{
            background: active ? "var(--bg-tertiary)" : "transparent",
            color: active ? "var(--text-primary)" : "var(--text-secondary)",
            borderLeft: active
                ? "2px solid var(--accent)"
                : "2px solid transparent",
        }}
    >
        <Icon className="w-3.5 h-3.5" />
        <span className="flex-1">{label}</span>
        {count !== undefined && count > 0 && (
            <span
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ background: "var(--accent)", color: "#fff" }}
            >
                {count}
            </span>
        )}
    </button>
);

export default Notifications;
