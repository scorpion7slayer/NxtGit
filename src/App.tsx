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
import Login from "./components/Login";
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
                <Route path="/issues" element={<Issues />} />
                <Route
                    path="/issue/:owner/:name/:number"
                    element={<IssueDetail />}
                />
                <Route path="/prs" element={<PullRequests />} />
                <Route path="/pr/:owner/:name/:number" element={<PRDetail />} />
                <Route path="/ai-review" element={<AIReview />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/settings" element={<Settings />} />
            </Routes>
        </Layout>
    );
}

export default App;
