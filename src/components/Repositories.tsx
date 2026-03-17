import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, GitBranch, GitFork, Lock, Loader2, ChevronDown, X } from 'lucide-react';
import { fetchRepos, langColor, timeAgo, type GitHubRepo } from '../lib/github';

type TypeFilter = 'all' | 'public' | 'private' | 'sources' | 'forks' | 'archived' | 'mirrors' | 'templates';
type SortOption = 'updated' | 'name' | 'stars';

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'sources', label: 'Sources' },
  { value: 'forks', label: 'Forks' },
  { value: 'archived', label: 'Archived' },
  { value: 'mirrors', label: 'Mirrors' },
  { value: 'templates', label: 'Templates' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'updated', label: 'Last updated' },
  { value: 'name', label: 'Name' },
  { value: 'stars', label: 'Stars' },
];

function FilterDropdown<T extends string>({
  label,
  value,
  defaultValue,
  options,
  onChange,
}: {
  label: string;
  value: T;
  defaultValue?: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.value === value);
  const isDefault = value === (defaultValue ?? options[0].value);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border transition-colors"
        style={{
          borderColor: 'var(--border)',
          color: 'var(--text-secondary)',
          background: 'var(--bg-tertiary)',
        }}
      >
        {label}{!isDefault ? `: ${selected?.label}` : ''}
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div
          className="glass-dropdown absolute top-full left-0 mt-1 w-48 rounded-lg border shadow-lg z-50"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
              Select {label.toLowerCase()}
            </span>
            <button onClick={() => setOpen(false)}>
              <X className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
            </button>
          </div>
          <div className="py-1 max-h-72 overflow-y-auto">
            {options.map(opt => (
              <button
                key={opt.value}
                className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 transition-colors rounded-md mx-0 hover:bg-[var(--bg-tertiary)]"
                style={{ color: opt.value === value ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                onClick={() => { onChange(opt.value); setOpen(false); }}
              >
                <span className="w-4 text-center" style={{ color: 'var(--accent)' }}>
                  {opt.value === value ? '✓' : ''}
                </span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const Repositories: React.FC = () => {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('sources');
  const [langFilter, setLangFilter] = useState('all');
  const [sort, setSort] = useState<SortOption>('updated');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRepos()
      .then(setRepos)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Apply type filter first (used for language options + final results)
  const typeFiltered = useMemo(() => {
    let list = repos;
    switch (typeFilter) {
      case 'public': list = list.filter(r => !r.private); break;
      case 'private': list = list.filter(r => r.private); break;
      case 'sources': list = list.filter(r => !r.fork && !r.mirror_url); break;
      case 'forks': list = list.filter(r => r.fork); break;
      case 'archived': list = list.filter(r => r.archived); break;
      case 'mirrors': list = list.filter(r => !!r.mirror_url); break;
      case 'templates': list = list.filter(r => r.is_template); break;
    }
    return list;
  }, [repos, typeFilter]);

  // Languages derived from type-filtered repos (like GitHub)
  const langOptions = useMemo(() => {
    const langs = new Set<string>();
    typeFiltered.forEach(r => { if (r.language) langs.add(r.language); });
    return [
      { value: 'all', label: 'All' },
      ...Array.from(langs).sort().map(l => ({ value: l, label: l })),
    ];
  }, [typeFiltered]);

  // Reset language filter if current selection no longer exists
  useEffect(() => {
    if (langFilter !== 'all' && !langOptions.some(o => o.value === langFilter)) {
      setLangFilter('all');
    }
  }, [langOptions, langFilter]);

  const filtered = useMemo(() => {
    let list = typeFiltered.filter(r =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(search.toLowerCase())
    );

    // Language filter
    if (langFilter !== 'all') {
      list = list.filter(r => r.language === langFilter);
    }

    // Sort
    switch (sort) {
      case 'updated':
        list.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        break;
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'stars':
        list.sort((a, b) => b.stargazers_count - a.stargazers_count);
        break;
    }

    return list;
  }, [typeFiltered, search, langFilter, sort]);

  return (
    <div className="p-6 w-full">
      <header className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Repositories
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {filtered.length} repositories
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

      <div className="flex items-center gap-2 mb-4">
        <FilterDropdown label="Type" value={typeFilter} defaultValue="sources" options={TYPE_OPTIONS} onChange={setTypeFilter} />
        <FilterDropdown label="Language" value={langFilter} options={langOptions} onChange={setLangFilter} />
        <FilterDropdown label="Sort" value={sort} options={SORT_OPTIONS} onChange={setSort} />
        {(typeFilter !== 'sources' || langFilter !== 'all' || sort !== 'updated') && (
          <button
            onClick={() => { setTypeFilter('sources'); setLangFilter('all'); setSort('updated'); }}
            className="text-xs px-2 py-1 rounded transition-colors"
            style={{ color: 'var(--accent)' }}
          >
            Clear filters
          </button>
        )}
      </div>

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
                {repo.fork && (
                  <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-tertiary)' }}>
                    <GitFork className="w-2.5 h-2.5" /> Fork
                  </span>
                )}
                {repo.archived && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full border"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-tertiary)' }}>
                    Archived
                  </span>
                )}
                {repo.is_template && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full border"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-tertiary)' }}>
                    Template
                  </span>
                )}
              </div>
              {repo.fork && repo.parent && (
                <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
                  forked from <span style={{ color: 'var(--accent)' }}>{repo.parent.full_name}</span>
                </p>
              )}
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
