import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Repositories from './components/Repositories';
import PullRequests from './components/PullRequests';
import AIReview from './components/AIReview';
import Settings from './components/Settings';
import Login from './components/Login';
import { useAuthStore } from './stores/authStore';

function App() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/repos" element={<Repositories />} />
        <Route path="/prs" element={<PullRequests />} />
        <Route path="/ai-review" element={<AIReview />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}

export default App;
