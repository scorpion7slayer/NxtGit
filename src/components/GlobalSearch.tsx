import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, GitBranch, Star, Lock, Users, Loader2,
} from 'lucide-react';
import {
  searchRepos, searchUsers, langColor, timeAgo,
  type GitHubRepo, type GitHubUserProfile,
} from '../lib/github';

type SearchTab = 'repos' | 'users';

const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<SearchTab>('repos');
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [users, setUsers] = useState<GitHubUserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const doSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const [r, u] = await Promise.all([
        searchRepos(query),
        searchUsers(query),
      ]);
      setRepos(r);
      setUsers(u);
    } catch {
      // silently fail
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') doSearch();
  };

  return (
    <div className="p-6 max-w-5xl">
      <header className="mb-6">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Search
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Find repositories and users on GitHub
        </p>
      </header>

      {/* Search bar */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search repositories, users..."
            className="input-glass pl-9 w-full text-sm py-2.5"
            autoFocus
          />
        </div>
        <button onClick={doSearch} className="btn-primary text-sm px-5 py-2.5"
                disabled={loading || !query.trim()}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
        </button>
      </div>

      {/* Tabs */}
      {searched && (
        <>
          <div className="flex gap-0 border-b mb-4" style={{ borderColor: 'var(--border)' }}>
            <button onClick={() => setTab('repos')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
              style={{
                borderColor: tab === 'repos' ? 'var(--accent)' : 'transparent',
                color: tab === 'repos' ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}>
              <GitBranch className="w-3.5 h-3.5" /> Repositories ({repos.length})
            </button>
            <button onClick={() => setTab('users')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
              style={{
                borderColor: tab === 'users' ? 'var(--accent)' : 'transparent',
                color: tab === 'users' ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}>
              <Users className="w-3.5 h-3.5" /> Users ({users.length})
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-tertiary)' }} />
            </div>
          ) : tab === 'repos' ? (
            <RepoResults repos={repos} navigate={navigate} />
          ) : (
            <UserResults users={users} navigate={navigate} />
          )}
        </>
      )}
    </div>
  );
};

const RepoResults: React.FC<{ repos: GitHubRepo[]; navigate: ReturnType<typeof useNavigate> }> = ({ repos, navigate }) => {
  if (repos.length === 0) {
    return <p className="text-center py-8 text-sm" style={{ color: 'var(--text-tertiary)' }}>No repositories found.</p>;
  }
  return (
    <div className="border rounded-lg divide-y"
         style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
      {repos.map(repo => (
        <div key={repo.id}
             className="px-4 py-3 cursor-pointer transition-colors hover:bg-[var(--bg-tertiary)]"
             onClick={() => navigate(`/repos/${repo.owner.login}/${repo.name}`)}>
          <div className="flex items-center gap-2 mb-1">
            <img src={repo.owner.avatar_url} alt="" className="w-5 h-5 rounded-full" />
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
              <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {repo.stargazers_count}</span>
            )}
            {repo.forks_count > 0 && (
              <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> {repo.forks_count}</span>
            )}
            <span>Updated {timeAgo(repo.updated_at)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

const UserResults: React.FC<{ users: GitHubUserProfile[]; navigate: ReturnType<typeof useNavigate> }> = ({ users, navigate }) => {
  if (users.length === 0) {
    return <p className="text-center py-8 text-sm" style={{ color: 'var(--text-tertiary)' }}>No users found.</p>;
  }
  return (
    <div className="border rounded-lg divide-y"
         style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
      {users.map(user => (
        <div key={user.id}
             className="px-4 py-3 cursor-pointer transition-colors hover:bg-[var(--bg-tertiary)] flex items-center gap-3"
             onClick={() => navigate(`/profile/${user.login}`)}>
          <img src={user.avatar_url} alt={user.login} className="w-10 h-10 rounded-full" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {user.login}
            </h3>
            {user.bio && (
              <p className="text-xs line-clamp-1" style={{ color: 'var(--text-secondary)' }}>
                {user.bio}
              </p>
            )}
            {user.type && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>
                {user.type}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default GlobalSearch;
