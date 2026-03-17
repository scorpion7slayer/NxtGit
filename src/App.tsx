import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { LazyStore } from "@tauri-apps/plugin-store";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import Repositories from "./components/Repositories";
import RepoDetail from "./components/RepoDetail";
import Issues from "./components/Issues";
import IssueDetail from "./components/IssueDetail";
import PullRequests from "./components/PullRequests";
import PRDetail from "./components/PRDetail";
import AIReview from "./components/AIReview";
import Chat from "./components/Chat";
import Settings from "./components/Settings";
import GitHubStatus from "./components/GitHubStatus";
import Login from "./components/Login";
import UserProfile from "./components/UserProfile";
import GlobalSearch from "./components/GlobalSearch";
import AppChangelog from "./components/AppChangelog";
import CommitDetail from "./components/CommitDetail";
import WorkflowRunDetail from "./components/WorkflowRunDetail";
import Notifications from "./components/Notifications";
import CodeWiki from "./components/CodeWiki";
import WindowDragRegion from "./components/WindowDragRegion";
import AppKeyboardShortcuts from "./components/AppKeyboardShortcuts";
import Support from "./components/Support";
import Onboarding from "./components/Onboarding";
import { useAuthStore } from "./stores/authStore";

const appStore = new LazyStore("app.json");

function App() {
    const { authLoaded, isAuthenticated, loadAuth } = useAuthStore();
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        loadAuth();
    }, [loadAuth]);

    // Show onboarding on first login (versioned so existing users see new tours)
    const ONBOARDING_VERSION = 1;
    useEffect(() => {
        if (!isAuthenticated) return;
        appStore
            .get<number>("onboardingVersion")
            .then((v) => {
                if (!v || v < ONBOARDING_VERSION) setShowOnboarding(true);
            })
            .catch(() => setShowOnboarding(true));
    }, [isAuthenticated]);

    const completeOnboarding = async () => {
        setShowOnboarding(false);
        await appStore.set("onboardingVersion", ONBOARDING_VERSION);
        await appStore.save();
    };

    // Listen for "restart-onboarding" event from Settings
    useEffect(() => {
        const handler = () => setShowOnboarding(true);
        window.addEventListener("restart-onboarding", handler);
        return () => window.removeEventListener("restart-onboarding", handler);
    }, []);

    if (!authLoaded) {
        return <div className="h-screen" style={{ background: "var(--bg-primary)" }} />;
    }

    if (!isAuthenticated) {
        return (
            <>
                <WindowDragRegion className="macos-drag-bar" />
                <Login />
            </>
        );
    }

    return (
        <>
            <Layout>
                <AppKeyboardShortcuts />
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/repos" element={<Repositories />} />
                    <Route path="/repos/:owner/:name" element={<RepoDetail />} />
                    <Route path="/wiki/:owner/:name" element={<CodeWiki />} />
                    <Route path="/issues" element={<Issues />} />
                    <Route
                        path="/issue/:owner/:name/:number"
                        element={<IssueDetail />}
                    />
                    <Route path="/prs" element={<PullRequests />} />
                    <Route path="/pr/:owner/:name/:number" element={<PRDetail />} />
                    <Route path="/ai-review" element={<AIReview />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/status" element={<GitHubStatus />} />
                    <Route path="/commit/:owner/:name/:sha" element={<CommitDetail />} />
                    <Route path="/run/:owner/:name/:runId" element={<WorkflowRunDetail />} />
                    <Route path="/profile/:username" element={<UserProfile />} />
                    <Route path="/search" element={<GlobalSearch />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/app-changelog" element={<AppChangelog />} />
                    <Route path="/support" element={<Support />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
            </Layout>
            {showOnboarding && <Onboarding onComplete={completeOnboarding} />}
        </>
    );
}

export default App;
