import React, { useState, useEffect } from "react";
import {
    GitPullRequest,
    GitBranch,
    GitCommit,
    GitFork,
    Star,
    CircleDot,
    MessageSquare,
    Eye,
    Trash2,
    Plus,
    Loader2,
    Bot,
    Send,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import {
    fetchRepos,
    fetchEvents,
    fetchStarCount,
    fetchUserPRs,
    timeAgo,
    type GitHubEvent,
} from "../lib/github";

function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
}

const Dashboard: React.FC = () => {
    const { user } = useAuthStore();
    const [repoCount, setRepoCount] = useState(0);
    const [starCount, setStarCount] = useState(0);
    const [events, setEvents] = useState<GitHubEvent[]>([]);
    const [openPRCount, setOpenPRCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetchRepos().then((r) => setRepoCount(r.length)),
            fetchStarCount().then(setStarCount),
            fetchEvents().then(setEvents),
            fetchUserPRs().then((prs) => {
                const open = prs.filter(
                    (p) => p.state === "open" && !p.pull_request?.merged_at,
                );
                setOpenPRCount(open.length);
            }),
        ])
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const recentEvents = events.slice(0, 12);

    return (
        <div className="p-6 max-w-5xl">
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2
                        className="w-6 h-6 animate-spin"
                        style={{ color: "var(--text-tertiary)" }}
                    />
                </div>
            ) : (
                <>
                    <ChatWidget username={user?.login || ""} />

                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <StatCard icon={GitBranch} label="Repositories" value={repoCount} />
                        <StatCard icon={Star} label="Total Stars" value={starCount} />
                        <StatCard icon={GitPullRequest} label="Open PRs" value={openPRCount} />
                    </div>

                    <div>
                        <h2 className="text-sm font-medium mb-3" style={{ color: "var(--text-secondary)" }}>
                            Recent Activity
                        </h2>
                        {recentEvents.length === 0 ? (
                            <p className="text-sm py-8 text-center" style={{ color: "var(--text-tertiary)" }}>
                                No recent activity.
                            </p>
                        ) : (
                            <div
                                className="border rounded-lg divide-y"
                                style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}
                            >
                                {recentEvents.map((event) => (
                                    <EventItem key={event.id} event={event} />
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

// --- Chat Widget ---

const ChatWidget: React.FC<{ username: string }> = ({ username }) => {
    const navigate = useNavigate();
    return (
        <div
            className="border rounded-xl mb-6"
            style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}
        >
            <div className="px-5 pt-5 pb-3 flex items-center gap-3">
                <Bot className="w-5 h-5" style={{ color: "var(--text-tertiary)" }} />
                <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                    {getGreeting()}, {username}!
                </h2>
            </div>
            <div className="px-5 pb-5">
                <div
                    className="w-full text-sm py-3 px-4 rounded-lg cursor-text flex items-center justify-between"
                    style={{ background: "var(--bg-tertiary)", color: "var(--text-tertiary)" }}
                    onClick={() => navigate("/chat")}
                >
                    <span>Ask anything...</span>
                    <Send className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
                </div>
            </div>
        </div>
    );
};

// --- Stat Card ---

const StatCard: React.FC<{ icon: React.ElementType; label: string; value: number }> = ({
    icon: Icon, label, value,
}) => (
    <div
        className="border rounded-lg p-4"
        style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}
    >
        <div className="flex items-center gap-2 mb-2">
            <Icon className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{label}</span>
        </div>
        <div className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>{value}</div>
    </div>
);

// --- Events ---

function eventIcon(type: string): React.ElementType {
    switch (type) {
        case "PushEvent": return GitCommit;
        case "PullRequestEvent": return GitPullRequest;
        case "PullRequestReviewEvent": return Eye;
        case "IssuesEvent": return CircleDot;
        case "IssueCommentEvent": return MessageSquare;
        case "CreateEvent": return Plus;
        case "DeleteEvent": return Trash2;
        case "WatchEvent": return Star;
        case "ForkEvent": return GitFork;
        default: return GitBranch;
    }
}

function eventColor(type: string): string {
    switch (type) {
        case "PushEvent": return "var(--accent)";
        case "PullRequestEvent": return "#A371F7";
        case "PullRequestReviewEvent": return "#A371F7";
        case "IssuesEvent": return "var(--success)";
        case "IssueCommentEvent": return "var(--text-secondary)";
        case "CreateEvent": return "var(--success)";
        case "DeleteEvent": return "var(--error)";
        case "WatchEvent": return "var(--warning)";
        case "ForkEvent": return "var(--accent)";
        default: return "var(--text-tertiary)";
    }
}

function eventDescription(event: GitHubEvent): string {
    switch (event.type) {
        case "PushEvent": {
            const count = event.payload.commits?.length || 0;
            const msg = event.payload.commits?.[0]?.message?.split("\n")[0] || "";
            return `Pushed ${count} commit${count !== 1 ? "s" : ""}${msg ? `: ${msg}` : ""}`;
        }
        case "PullRequestEvent":
            return `${capitalize(event.payload.action || "")} PR: ${event.payload.pull_request?.title || ""}`;
        case "PullRequestReviewEvent":
            return `Reviewed PR: ${event.payload.pull_request?.title || ""}`;
        case "CreateEvent":
            return `Created ${event.payload.ref_type || ""}${event.payload.ref ? ` ${event.payload.ref}` : ""}`;
        case "DeleteEvent":
            return `Deleted ${event.payload.ref_type || ""}${event.payload.ref ? ` ${event.payload.ref}` : ""}`;
        case "WatchEvent":
            return "Starred repository";
        case "ForkEvent":
            return "Forked repository";
        case "IssuesEvent":
            return `${capitalize(event.payload.action || "")} issue: ${event.payload.issue?.title || ""}`;
        case "IssueCommentEvent":
            return `Commented on: ${event.payload.issue?.title || "issue"}`;
        case "ReleaseEvent":
            return `${capitalize(event.payload.action || "")} release: ${event.payload.release?.tag_name || ""}`;
        case "MemberEvent":
            return `${capitalize(event.payload.action || "")} collaborator`;
        default:
            return event.type.replace("Event", "");
    }
}

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

const EventItem: React.FC<{ event: GitHubEvent }> = ({ event }) => {
    const Icon = eventIcon(event.type);
    const color = eventColor(event.type);

    return (
        <div className="flex items-center gap-3 px-4 py-3">
            <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}15` }}
            >
                <Icon className="w-3.5 h-3.5" style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm truncate" style={{ color: "var(--text-primary)" }}>
                    {eventDescription(event)}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                    {event.repo.name}
                </p>
            </div>
            <span className="text-xs flex-shrink-0" style={{ color: "var(--text-tertiary)" }}>
                {timeAgo(event.created_at)}
            </span>
        </div>
    );
};

export default Dashboard;
