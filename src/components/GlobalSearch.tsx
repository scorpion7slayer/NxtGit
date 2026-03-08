import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, GitBranch, Star, Lock, Users, Loader2, TrendingUp, Clock,
} from 'lucide-react';
import {
  searchRepos, searchUsers, fetchTrendingRepos, langColor, timeAgo,
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

  // Auto-complete
  const [suggestions, setSuggestions] = useState<GitHubRepo[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Trending repos
  const [trending, setTrending] = useState<GitHubRepo[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Load trending repos on mount + handle ?q= param
  useEffect(() => {
    fetchTrendingRepos()
      .then(setTrending)
      .catch(() => {})
      .finally(() => setTrendingLoading(false));

    const initialQuery = searchParams.get('q');
    if (initialQuery) {
      setQuery(initialQuery);
      setLoading(true);
      setSearched(true);
      Promise.all([searchRepos(initialQuery), searchUsers(initialQuery)])
        .then(([r, u]) => { setRepos(r); setUsers(u); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, []);

  // Debounced autocomplete
  const fetchSuggestions = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim() || q.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const results = await searchRepos(q);
        setSuggestions(results.slice(0, 8));
        setShowSuggestions(true);
        setSelectedIdx(-1);
      } catch {
        setSuggestions([]);
      }
      setSuggestionsLoading(false);
    }, 300);
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = async () => {
    if (!query.trim()) return;
    setShowSuggestions(false);
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
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx(prev => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx(prev => prev <= 0 ? suggestions.length - 1 : prev - 1);
        return;
      }
      if (e.key === 'Enter' && selectedIdx >= 0) {
        e.preventDefault();
        const selected = suggestions[selectedIdx];
        navigate(`/repos/${selected.owner.login}/${selected.name}`);
        return;
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        return;
      }
    }
    if (e.key === 'Enter') doSearch();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    fetchSuggestions(val);
  };

  return (
    <div className="p-6 w-full">
      <header className="mb-6">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Search
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Find repositories and users on GitHub
        </p>
      </header>

      {/* Search bar with autocomplete */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-tertiary)' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
            placeholder="Search repositories, users..."
            className="input-glass pl-9 w-full text-sm py-2.5"
            autoFocus
          />
          {/* Autocomplete dropdown */}
          {showSuggestions && (suggestions.length > 0 || suggestionsLoading) && (
            <div ref={suggestionsRef}
                 className="absolute top-full left-0 right-0 mt-1 z-50 border rounded-lg shadow-lg overflow-hidden backdrop-blur-none"
                 style={{ borderColor: 'var(--border)', background: 'var(--bg-primary)', backdropFilter: 'none', WebkitBackdropFilter: 'none' }}>
              {suggestionsLoading && suggestions.length === 0 ? (
                <div className="flex items-center justify-center py-3">
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--text-tertiary)' }} />
                </div>
              ) : (
                suggestions.map((repo, idx) => (
                  <div
                    key={repo.id}
                    className="px-3 py-2 cursor-pointer transition-colors flex items-center gap-2"
                    style={{
                      background: idx === selectedIdx ? 'var(--bg-tertiary)' : 'transparent',
                    }}
                    onMouseEnter={() => setSelectedIdx(idx)}
                    onClick={() => {
                      setShowSuggestions(false);
                      navigate(`/repos/${repo.owner.login}/${repo.name}`);
                    }}
                  >
                    <img src={repo.owner.avatar_url} alt="" className="w-5 h-5 rounded-full flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                        {repo.owner.login}/{repo.name}
                      </span>
                      {repo.description && (
                        <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                          {repo.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                      <Star className="w-3 h-3" />
                      {repo.stargazers_count >= 1000
                        ? `${(repo.stargazers_count / 1000).toFixed(1)}k`
                        : repo.stargazers_count}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <button onClick={doSearch} className="btn-primary text-sm px-5 py-2.5"
                disabled={loading || !query.trim()}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
        </button>
      </div>

      {/* Search results */}
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

      {/* Trending repos when no search */}
      {!searched && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Trending this week
            </h2>
          </div>
          {trendingLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-tertiary)' }} />
            </div>
          ) : trending.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Could not load trending repositories.
            </p>
          ) : (
            <div className="border rounded-lg divide-y"
                 style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
              {trending.map((repo, idx) => (
                <div key={repo.id}
                     className="px-4 py-3 cursor-pointer transition-colors hover:bg-[var(--bg-tertiary)]"
                     onClick={() => navigate(`/repos/${repo.owner.login}/${repo.name}`)}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold w-5 text-center" style={{ color: 'var(--text-tertiary)' }}>
                      {idx + 1}
                    </span>
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
                    <p className="text-sm mb-2 line-clamp-2 pl-7" style={{ color: 'var(--text-secondary)' }}>
                      {repo.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs pl-7" style={{ color: 'var(--text-tertiary)' }}>
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: langColor(repo.language) }} />
                        {repo.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1"><Star className="w-3 h-3" />
                      {repo.stargazers_count >= 1000
                        ? `${(repo.stargazers_count / 1000).toFixed(1)}k`
                        : repo.stargazers_count}
                    </span>
                    {repo.forks_count > 0 && (
                      <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> {repo.forks_count}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {timeAgo(repo.created_at)}
                    </span>
                  </div>
                  {repo.topics && repo.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 pl-7">
                      {repo.topics.slice(0, 5).map(t => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full"
                              style={{ background: 'rgba(0,122,255,0.1)', color: 'var(--accent)' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
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
          {repo.topics && repo.topics.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {repo.topics.slice(0, 5).map(t => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(0,122,255,0.1)', color: 'var(--accent)' }}>
                  {t}
                </span>
              ))}
            </div>
          )}
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
