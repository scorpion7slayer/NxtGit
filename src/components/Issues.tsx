import React, { useState, useEffect } from 'react';
import { CircleDot, Loader2, Search } from 'lucide-react';
import { fetchUserIssues, repoNameFromUrl, timeAgo, type GitHubIssue } from '../lib/github';

const Issues: React.FC = () => {
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('open');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUserIssues()
      .then(items => setIssues(items.filter(i => !i.pull_request)))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = issues
    .filter(i => filter === 'all' || i.state === filter)
    .filter(i => !search || i.title.toLowerCase().includes(search.toLowerCase()));

  const openCount = issues.filter(i => i.state === 'open').length;
  const closedCount = issues.filter(i => i.state === 'closed').length;

  return (
    <div className="p-6 max-w-5xl">
      <header className="mb-4">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Issues</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Your issues across all repositories
        </p>
      </header>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex gap-0 border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <FilterBtn active={filter === 'open'} onClick={() => setFilter('open')}>
            Open ({openCount})
          </FilterBtn>
          <FilterBtn active={filter === 'closed'} onClick={() => setFilter('closed')}>
            Closed ({closedCount})
          </FilterBtn>
          <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')}>
            All
          </FilterBtn>
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter issues..."
            className="input-glass pl-9 w-full text-sm py-2"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-tertiary)' }} />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-sm" style={{ color: 'var(--error)' }}>{error}</div>
      ) : filtered.length === 0 ? (
        <p className="text-center py-12 text-sm" style={{ color: 'var(--text-tertiary)' }}>No issues found.</p>
      ) : (
        <div className="border rounded-lg divide-y" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
          {filtered.map(issue => (
            <div key={issue.id} className="px-4 py-3">
              <div className="flex items-start gap-2">
                <CircleDot className="w-4 h-4 mt-0.5 flex-shrink-0"
                           style={{ color: issue.state === 'open' ? 'var(--success)' : 'var(--text-tertiary)' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {issue.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    <span>{repoNameFromUrl(issue.repository_url)}</span>
                    <span>#{issue.number}</span>
                    <span>{issue.user.login}</span>
                    <span>{timeAgo(issue.updated_at)}</span>
                    {issue.labels.map(l => (
                      <span key={l.name} className="px-1.5 py-0.5 rounded-full text-[10px]"
                            style={{ background: `#${l.color}30`, color: `#${l.color}` }}>
                        {l.name}
                      </span>
                    ))}
                  </div>
                </div>
                {issue.comments > 0 && (
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {issue.comments}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const FilterBtn: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className="px-3 py-1.5 text-xs font-medium transition-colors"
    style={{
      background: active ? 'var(--accent)' : 'var(--bg-secondary)',
      color: active ? 'white' : 'var(--text-secondary)',
    }}
  >
    {children}
  </button>
);

export default Issues;
