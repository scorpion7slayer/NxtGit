import React, { useState } from 'react';
import { GitPullRequest, Plus, Sparkles, MessageSquare, CheckCircle, XCircle } from 'lucide-react';

const PullRequests: React.FC = () => {
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const handleGenerateDescription = (id: string) => {
    setGeneratingId(id);
    // AI generation logic here
    setTimeout(() => setGeneratingId(null), 2000);
  };

  return (
    <div className="p-8">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Pull Requests
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage and review your pull requests
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New PR
        </button>
      </header>

      <div className="space-y-4">
        <PRCard 
          id="1"
          title="feat: integrate OpenRouter API for AI reviews"
          repo="scorpion7slayer/NxtGit"
          author="scorpion7slayer"
          avatar="https://github.com/scorpion7slayer.png"
          status="open"
          comments={3}
          checks={{ passed: 4, total: 5 }}
          branch="feature/ai-integration"
          base="main"
          updated="2 hours ago"
          onGenerate={() => handleGenerateDescription('1')}
          isGenerating={generatingId === '1'}
        />
        <PRCard 
          id="2"
          title="fix: resolve auth token refresh issue"
          repo="scorpion7slayer/market-plier"
          author="dev-contributor"
          avatar="https://github.com/github.png"
          status="open"
          comments={1}
          checks={{ passed: 5, total: 5 }}
          branch="fix/auth-refresh"
          base="devh"
          updated="5 hours ago"
          onGenerate={() => handleGenerateDescription('2')}
          isGenerating={generatingId === '2'}
        />
        <PRCard 
          id="3"
          title="docs: update README with installation steps"
          repo="flavortown/hackclub"
          author="contributor-42"
          avatar="https://github.com/octocat.png"
          status="merged"
          comments={0}
          checks={{ passed: 3, total: 3 }}
          branch="docs/readme-update"
          base="main"
          updated="2 days ago"
        />
      </div>
    </div>
  );
};

interface PRCardProps {
  id: string;
  title: string;
  repo: string;
  author: string;
  avatar: string;
  status: 'open' | 'closed' | 'merged';
  comments: number;
  checks: { passed: number; total: number };
  branch: string;
  base: string;
  updated: string;
  onGenerate?: () => void;
  isGenerating?: boolean;
}

const PRCard: React.FC<PRCardProps> = ({ 
  title, repo, author, avatar, status, comments, checks, branch, base, updated,
  onGenerate, isGenerating
}) => {
  const statusConfig = {
    open: { icon: GitPullRequest, color: '#3FB950', bg: '#3FB95020' },
    closed: { icon: XCircle, color: '#F85149', bg: '#F8514920' },
    merged: { icon: CheckCircle, color: '#A371F7', bg: '#A371F720' }
  };

  const StatusIcon = statusConfig[status].icon;
  const allChecksPassed = checks.passed === checks.total;

  return (
    <div className="glass-panel p-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center"
             style={{ background: statusConfig[status].bg }}>
          <StatusIcon className="w-5 h-5" style={{ color: statusConfig[status].color }} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
                {title}
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                {repo} • {branch} → {base}
              </p>
            </div>
            
            {status === 'open' && onGenerate && (
              <button 
                onClick={onGenerate}
                disabled={isGenerating}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{ 
                  background: 'linear-gradient(135deg, #007AFF, #5856D6)',
                  color: 'white'
                }}
              >
                {isGenerating ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isGenerating ? 'Generating...' : 'AI Description'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-tertiary)' }}>
            <span className="flex items-center gap-1.5">
              <img src={avatar} alt={author} className="w-5 h-5 rounded-full" />
              {author}
            </span>
            
            {comments > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                {comments}
              </span>
            )}
            
            <span className="flex items-center gap-1"
                  style={{ color: allChecksPassed ? 'var(--success)' : 'var(--warning)' }}>
              <CheckCircle className="w-4 h-4" />
              {checks.passed}/{checks.total} checks
            </span>
            
            <span>{updated}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PullRequests;
