import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
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
import { useAuthStore } from "./stores/authStore";

function App() {
    const { isAuthenticated, loadAuth } = useAuthStore();

    useEffect(() => {
        loadAuth();
    }, [loadAuth]);

    if (!isAuthenticated) {
        return <Login />;
    }

    return (
        <Layout>
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
                <Route path="/settings" element={<Settings />} />
            </Routes>
        </Layout>
    );
}

export default App;
