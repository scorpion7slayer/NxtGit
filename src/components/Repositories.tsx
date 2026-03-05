import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, GitBranch, Lock, Loader2 } from 'lucide-react';
import { fetchRepos, langColor, timeAgo, type GitHubRepo } from '../lib/github';

const Repositories: React.FC = () => {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRepos()
      .then(setRepos)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = repos.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl">
      <header className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Repositories
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {repos.length} repositories
          </p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Find a repository..."
            className="input-glass pl-9 w-60 text-sm py-2"
          />
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-tertiary)' }} />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-sm" style={{ color: 'var(--error)' }}>{error}</div>
      ) : (
        <div className="border rounded-lg divide-y" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
          {filtered.map(repo => (
            <div
              key={repo.id}
              className="px-4 py-3 cursor-pointer transition-colors hover:bg-[var(--bg-tertiary)]"
              onClick={() => navigate(`/repos/${repo.owner.login}/${repo.name}`)}
            >
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                  {repo.owner.login}/{repo.name}
                </h3>
                {repo.private && (
                  <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                    <Lock className="w-2.5 h-2.5" /> Private
                  </span>
                )}
              </div>
              {repo.description && (
                <p className="text-sm mb-2 line-clamp-1" style={{ color: 'var(--text-secondary)' }}>
                  {repo.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {repo.language && (
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: langColor(repo.language) }} />
                    {repo.language}
                  </span>
                )}
                {repo.stargazers_count > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3" /> {repo.stargazers_count}
                  </span>
                )}
                {repo.forks_count > 0 && (
                  <span className="flex items-center gap-1">
                    <GitBranch className="w-3 h-3" /> {repo.forks_count}
                  </span>
                )}
                <span>Updated {timeAgo(repo.updated_at)}</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center py-8 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              No repositories found.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Repositories;
