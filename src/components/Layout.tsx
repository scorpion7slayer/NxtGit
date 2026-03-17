import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    GitBranch,
    GitPullRequest,
    CircleDot,
    MessageSquare,
    Bot,
    Activity,
    Settings,
    LogOut,
    Search,
    Sparkles,
    Bell,
    LifeBuoy,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import {
    DEFAULT_KEYBOARD_SHORTCUTS,
    type ShortcutId,
} from "../lib/preferences";
import logo from "../assets/logo.svg";
import UpdateBanner from "./UpdateBanner";
import WindowDragRegion from "./WindowDragRegion";

const PATH_TO_SHORTCUT: Record<string, ShortcutId> = {
    "/": "goDashboard",
    "/repos": "goRepositories",
    "/issues": "goIssues",
    "/prs": "goPullRequests",
    "/chat": "goChat",
    "/ai-review": "goAIReview",
    "/status": "goStatus",
    "/search": "goSearch",
    "/notifications": "goNotifications",
    "/settings": "goSettings",
    "/support": "goSupport",
};

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [showShortcuts, setShowShortcuts] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Meta" || e.key === "Control") {
                setShowShortcuts(true);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === "Meta" || e.key === "Control") {
                setShowShortcuts(false);
            }
        };
        const handleBlur = () => setShowShortcuts(false);
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        window.addEventListener("blur", handleBlur);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            window.removeEventListener("blur", handleBlur);
        };
    }, []);

    const isMac = navigator.userAgent.includes("Macintosh");
    const shortcutFor = (path: string): string | null => {
        if (!showShortcuts) return null;
        const id = PATH_TO_SHORTCUT[path];
        if (!id) return null;
        const raw = DEFAULT_KEYBOARD_SHORTCUTS[id];
        // Show only the key part (after Mod+), since Cmd/Ctrl is already held
        const parts = raw.split("+").filter(p => p !== "Mod");
        const display = parts.map(p => {
            if (p === "Shift") return isMac ? "⇧" : "Shift+";
            return p;
        }).join("");
        return display;
    };

    return (
        <div
            className="h-screen flex overflow-hidden layout-root"
            style={{ background: "var(--bg-primary)" }}
        >
            <WindowDragRegion className="macos-drag-bar" />
            <aside
                className="w-56 flex flex-col border-r layout-sidebar"
                style={{
                    borderColor: "var(--border)",
                    background: "var(--bg-secondary)",
                }}
            >
                {/* App header */}
                <WindowDragRegion
                    className="px-4 pb-4 border-b sidebar-header"
                    style={{ borderColor: "var(--border)" }}
                >
                    <div className="flex items-center gap-2.5">
                        <img
                            src={logo}
                            alt="NxtGit"
                            className="w-7 h-7 rounded-md"
                        />
                        <span
                            className="font-semibold text-[15px]"
                            style={{ color: "var(--text-primary)" }}
                        >
                            NxtGit
                        </span>
                    </div>
                </WindowDragRegion>

                {/* Navigation */}
                <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
                    <NavItem
                        to="/"
                        icon={LayoutDashboard}
                        label="Dashboard"
                        end
                        shortcutHint={shortcutFor("/")}
                        tourId="dashboard"
                    />
                    <NavItem
                        to="/repos"
                        icon={GitBranch}
                        label="Repositories"
                        shortcutHint={shortcutFor("/repos")}
                        tourId="repos"
                    />
                    <NavItem to="/issues" icon={CircleDot} label="Issues" shortcutHint={shortcutFor("/issues")} tourId="issues" />
                    <NavItem
                        to="/prs"
                        icon={GitPullRequest}
                        label="Pull Requests"
                        shortcutHint={shortcutFor("/prs")}
                        tourId="prs"
                    />
                    <NavItem to="/chat" icon={Bot} label="Chat" shortcutHint={shortcutFor("/chat")} tourId="chat" />
                    <NavItem
                        to="/ai-review"
                        icon={MessageSquare}
                        label="AI Review"
                        shortcutHint={shortcutFor("/ai-review")}
                        tourId="ai-review"
                    />
                    <NavItem
                        to="/status"
                        icon={Activity}
                        label="GitHub Status"
                        shortcutHint={shortcutFor("/status")}
                        tourId="status"
                    />
                    <NavItem to="/search" icon={Search} label="Search" shortcutHint={shortcutFor("/search")} tourId="search" />
                    <NavItem
                        to="/notifications"
                        icon={Bell}
                        label="Notifications"
                        shortcutHint={shortcutFor("/notifications")}
                        tourId="notifications"
                    />
                </nav>

                {/* User section */}
                <div
                    className="px-2 py-3 border-t"
                    style={{ borderColor: "var(--border)" }}
                >
                    <div
                        className="flex items-center gap-2.5 px-2.5 mb-3 cursor-pointer rounded-lg py-1.5 hover:bg-[var(--bg-tertiary)] transition-colors"
                        onClick={() => navigate(`/profile/${user?.login || ''}`)}
                    >
                        <img
                            src={
                                user?.avatar_url ||
                                "https://github.com/github.png"
                            }
                            alt="Avatar"
                            className="w-6 h-6 rounded-full"
                        />
                        <div className="flex-1 min-w-0">
                            <p
                                className="text-sm font-medium truncate"
                                style={{ color: "var(--text-primary)" }}
                            >
                                {user?.login || "User"}
                            </p>
                        </div>
                    </div>

                    <NavItem
                        to="/app-changelog"
                        icon={Sparkles}
                        label="Changelog"
                    />
                    <NavItem
                        to="/support"
                        icon={LifeBuoy}
                        label="Help & Feedback"
                        shortcutHint={shortcutFor("/support")}
                    />
                    <NavItem to="/settings" icon={Settings} label="Settings" shortcutHint={shortcutFor("/settings")} tourId="settings" />
                    <button
                        onClick={logout}
                        className="nav-item w-full text-left"
                        style={{ color: "var(--text-secondary)" }}
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Sign out</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 overflow-hidden">
                <div
                    className="h-full overflow-y-auto overflow-x-hidden layout-main"
                    style={{ background: "var(--bg-primary)" }}
                >
                    <UpdateBanner />
                    {children}
                </div>
            </main>
        </div>
    );
};

interface NavItemProps {
    to: string;
    icon: React.ElementType;
    label: string;
    end?: boolean;
    shortcutHint?: string | null;
    tourId?: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, end, shortcutHint, tourId }) => (
    <NavLink
        to={to}
        end={end}
        className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        {...(tourId ? { "data-tour": tourId } : {})}
    >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 truncate">{label}</span>
        {shortcutHint !== undefined && (
            <span
                className={`shortcut-hint text-[11px] px-1.5 py-0.5 rounded font-mono flex-shrink-0 min-w-[22px] text-center${shortcutHint ? "" : " invisible"}`}
                style={{
                    background: "var(--bg-tertiary)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border)",
                }}
            >
                {shortcutHint || "\u00A0"}
            </span>
        )}
    </NavLink>
);

export default Layout;
