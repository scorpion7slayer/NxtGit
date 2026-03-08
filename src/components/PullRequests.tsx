import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitPullRequest, CheckCircle, XCircle, Loader2, MessageSquare } from 'lucide-react';
import { fetchUserPRs, repoNameFromUrl, parseRepoFromUrl, timeAgo, type GitHubPR } from '../lib/github';

const PullRequests: React.FC = () => {
  const [prs, setPrs] = useState<GitHubPR[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('open');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserPRs()
      .then(setPrs)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = prs.filter(pr => {
    if (filter === 'all') return true;
    if (filter === 'open') return pr.state === 'open';
    return pr.state === 'closed';
  });

  const openCount = prs.filter(p => p.state === 'open').length;
  const closedCount = prs.filter(p => p.state === 'closed').length;

  return (
    <div className="p-6 w-full">
      <header className="mb-4">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Pull Requests</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Your pull requests across all repositories</p>
      </header>

      <div className="flex gap-0 border rounded-lg overflow-hidden w-fit mb-4" style={{ borderColor: 'var(--border)' }}>
        <FilterBtn active={filter === 'open'} onClick={() => setFilter('open')}>Open ({openCount})</FilterBtn>
        <FilterBtn active={filter === 'closed'} onClick={() => setFilter('closed')}>Closed ({closedCount})</FilterBtn>
        <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')}>All</FilterBtn>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-tertiary)' }} /></div>
      ) : error ? (
        <div className="text-center py-20 text-sm" style={{ color: 'var(--error)' }}>{error}</div>
      ) : filtered.length === 0 ? (
        <p className="text-center py-12 text-sm" style={{ color: 'var(--text-tertiary)' }}>No pull requests found.</p>
      ) : (
        <div className="border rounded-lg divide-y" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
          {filtered.map(pr => {
            const repo = parseRepoFromUrl(pr.repository_url);
            return <PRRow key={pr.id} pr={pr} onClick={() => navigate(`/pr/${repo.owner}/${repo.name}/${pr.number}`)} />;
          })}
        </div>
      )}
    </div>
  );
};

const PRRow: React.FC<{ pr: GitHubPR; onClick: () => void }> = ({ pr, onClick }) => {
  const merged = pr.pull_request?.merged_at != null;
  const status = merged ? 'merged' : pr.state;
  const color = status === 'merged' ? '#A371F7' : status === 'open' ? '#3FB950' : '#F85149';
  const Icon = status === 'merged' ? CheckCircle : status === 'closed' ? XCircle : GitPullRequest;
  const repoName = repoNameFromUrl(pr.repository_url);

  return (
    <div className="px-4 py-3 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors" onClick={onClick}>
      <div className="flex items-start gap-2">
        <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{pr.title}</p>
          <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            <span>{repoName}</span>
            <span>#{pr.number}</span>
            <span className="flex items-center gap-1">
              <img src={pr.user.avatar_url} alt="" className="w-3.5 h-3.5 rounded-full" /> {pr.user.login}
            </span>
            <span>{timeAgo(pr.updated_at)}</span>
          </div>
        </div>
        {pr.comments > 0 && (
          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            <MessageSquare className="w-3 h-3" /> {pr.comments}
          </span>
        )}
      </div>
    </div>
  );
};

const FilterBtn: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button onClick={onClick} className="px-3 py-1.5 text-xs font-medium transition-colors"
          style={{ background: active ? 'var(--accent)' : 'var(--bg-secondary)', color: active ? 'white' : 'var(--text-secondary)' }}>
    {children}
  </button>
);

export default PullRequests;
