import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Folder, File, GitBranch, Star, CircleDot,
  GitPullRequest, GitCommit, Loader2, ChevronRight
} from 'lucide-react';
import hljs from 'highlight.js';
import {
  fetchRepoDetail, fetchRepoContents, fetchFileContent,
  fetchRepoIssues, fetchRepoPRs, fetchRepoCommits,
  langColor, timeAgo, detectLanguage,
  type GitHubRepo, type GitHubContent, type GitHubIssue,
  type GitHubRepoPR, type GitHubCommit,
} from '../lib/github';

type Tab = 'code' | 'issues' | 'prs' | 'commits';

const RepoDetail: React.FC = () => {
  const { owner, name } = useParams<{ owner: string; name: string }>();
  const navigate = useNavigate();
  const [repo, setRepo] = useState<GitHubRepo | null>(null);
  const [tab, setTab] = useState<Tab>('code');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!owner || !name) return;
    fetchRepoDetail(owner, name)
      .then(setRepo)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [owner, name]);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-tertiary)' }} /></div>;
  }

  if (!repo || !owner || !name) {
    return <div className="p-6"><p style={{ color: 'var(--text-tertiary)' }}>Repository not found.</p></div>;
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'code', label: 'Code', icon: File },
    { id: 'issues', label: 'Issues', icon: CircleDot },
    { id: 'prs', label: 'Pull Requests', icon: GitPullRequest },
    { id: 'commits', label: 'Commits', icon: GitCommit },
  ];

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/repos')} className="p-1 rounded hover:bg-[var(--bg-tertiary)]">
          <ArrowLeft className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
        </button>
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{owner} / </span>{name}
          </h1>
          {repo.description && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{repo.description}</p>}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
        {repo.language && (
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: langColor(repo.language) }} /> {repo.language}
          </span>
        )}
        <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {repo.stargazers_count}</span>
        <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> {repo.forks_count}</span>
        <span className="flex items-center gap-1"><CircleDot className="w-3 h-3" /> {repo.open_issues_count} issues</span>
      </div>

      <div className="flex gap-0 border-b mb-4" style={{ borderColor: 'var(--border)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px"
            style={{ borderColor: tab === t.id ? 'var(--accent)' : 'transparent', color: tab === t.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'code' && <CodeTab owner={owner} name={name} />}
      {tab === 'issues' && <IssuesTab owner={owner} name={name} />}
      {tab === 'prs' && <PRsTab owner={owner} name={name} />}
      {tab === 'commits' && <CommitsTab owner={owner} name={name} />}
    </div>
  );
};

// --- Code Tab with highlight.js ---

const CodeTab: React.FC<{ owner: string; name: string }> = ({ owner, name }) => {
  const [contents, setContents] = useState<GitHubContent[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setLoading(true);
    setFileContent(null);
    fetchRepoContents(owner, name, currentPath)
      .then(items => {
        setContents([...items].sort((a, b) => {
          if (a.type === 'dir' && b.type !== 'dir') return -1;
          if (a.type !== 'dir' && b.type === 'dir') return 1;
          return a.name.localeCompare(b.name);
        }));
      })
      .catch(() => {
        fetchFileContent(owner, name, currentPath).then(setFileContent).catch(() => {});
      })
      .finally(() => setLoading(false));
  }, [owner, name, currentPath]);

  useEffect(() => {
    if (fileContent !== null && codeRef.current) {
      codeRef.current.removeAttribute('data-highlighted');
      hljs.highlightElement(codeRef.current);
    }
  }, [fileContent, currentPath]);

  const breadcrumbs = currentPath ? currentPath.split('/') : [];
  const fileName = breadcrumbs[breadcrumbs.length - 1] || '';
  const lang = detectLanguage(fileName);

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-tertiary)' }} /></div>;
  }

  if (fileContent !== null) {
    return (
      <div>
        <Breadcrumbs parts={breadcrumbs} onNavigate={setCurrentPath} />
        <div className="border rounded-lg overflow-hidden mt-2" style={{ borderColor: 'var(--border)' }}>
          <div className="px-4 py-2 text-xs border-b flex items-center justify-between"
               style={{ borderColor: 'var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
            <span>{fileName}</span>
            {lang && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-secondary)' }}>{lang}</span>}
          </div>
          <div className="overflow-auto max-h-[65vh]" style={{ background: 'var(--bg-secondary)' }}>
            <pre className="p-4 text-[13px] leading-relaxed m-0"><code
              ref={codeRef}
              className={lang ? `language-${lang}` : ''}
              style={{ background: 'transparent' }}
            >{fileContent}</code></pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {currentPath && <Breadcrumbs parts={breadcrumbs} onNavigate={setCurrentPath} />}
      <div className="border rounded-lg divide-y mt-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
        {currentPath && (
          <div className="px-4 py-2 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors flex items-center gap-2 text-sm"
               onClick={() => { const p = currentPath.split('/'); p.pop(); setCurrentPath(p.join('/')); }}
               style={{ color: 'var(--text-secondary)' }}>..</div>
        )}
        {contents.map(item => (
          <div key={item.sha} className="px-4 py-2 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors flex items-center gap-2 text-sm"
               onClick={() => setCurrentPath(item.path)}>
            {item.type === 'dir'
              ? <Folder className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent)' }} />
              : <File className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />}
            <span style={{ color: 'var(--text-primary)' }}>{item.name}</span>
          </div>
        ))}
        {contents.length === 0 && <p className="text-center py-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>Empty directory</p>}
      </div>
    </div>
  );
};

const Breadcrumbs: React.FC<{ parts: string[]; onNavigate: (path: string) => void }> = ({ parts, onNavigate }) => (
  <div className="flex items-center gap-1 text-sm flex-wrap">
    <button onClick={() => onNavigate('')} className="font-medium" style={{ color: 'var(--accent)' }}>root</button>
    {parts.map((part, i) => (
      <React.Fragment key={i}>
        <ChevronRight className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
        <button onClick={() => onNavigate(parts.slice(0, i + 1).join('/'))} className="font-medium"
                style={{ color: i === parts.length - 1 ? 'var(--text-primary)' : 'var(--accent)' }}>{part}</button>
      </React.Fragment>
    ))}
  </div>
);

// --- Issues Tab (clickable) ---
const IssuesTab: React.FC<{ owner: string; name: string }> = ({ owner, name }) => {
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRepoIssues(owner, name).then(items => setIssues(items.filter(i => !i.pull_request))).catch(() => {}).finally(() => setLoading(false));
  }, [owner, name]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-tertiary)' }} /></div>;
  if (issues.length === 0) return <p className="text-center py-8 text-sm" style={{ color: 'var(--text-tertiary)' }}>No issues.</p>;

  return (
    <div className="border rounded-lg divide-y" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
      {issues.map(issue => (
        <div key={issue.id} className="px-4 py-3 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
             onClick={() => navigate(`/issue/${owner}/${name}/${issue.number}`)}>
          <div className="flex items-start gap-2">
            <CircleDot className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: issue.state === 'open' ? 'var(--success)' : 'var(--text-tertiary)' }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{issue.title}</p>
              <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                <span>#{issue.number}</span><span>{issue.user.login}</span><span>{timeAgo(issue.updated_at)}</span>
                {issue.labels.map(l => (
                  <span key={l.name} className="px-1.5 py-0.5 rounded-full text-[10px]" style={{ background: `#${l.color}30`, color: `#${l.color}` }}>{l.name}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- PRs Tab (clickable) ---
const PRsTab: React.FC<{ owner: string; name: string }> = ({ owner, name }) => {
  const [prs, setPRs] = useState<GitHubRepoPR[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { fetchRepoPRs(owner, name).then(setPRs).catch(() => {}).finally(() => setLoading(false)); }, [owner, name]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-tertiary)' }} /></div>;
  if (prs.length === 0) return <p className="text-center py-8 text-sm" style={{ color: 'var(--text-tertiary)' }}>No pull requests.</p>;

  return (
    <div className="border rounded-lg divide-y" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
      {prs.map(pr => {
        const status = pr.merged_at ? 'merged' : pr.state;
        const color = status === 'merged' ? '#A371F7' : status === 'open' ? '#3FB950' : '#F85149';
        return (
          <div key={pr.id} className="px-4 py-3 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
               onClick={() => navigate(`/pr/${owner}/${name}/${pr.number}`)}>
            <div className="flex items-start gap-2">
              <GitPullRequest className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{pr.title}</p>
                <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  <span>#{pr.number}</span><span>{pr.user.login}</span><span>{timeAgo(pr.updated_at)}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// --- Commits Tab ---
const CommitsTab: React.FC<{ owner: string; name: string }> = ({ owner, name }) => {
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRepoCommits(owner, name).then(setCommits).catch(() => {}).finally(() => setLoading(false)); }, [owner, name]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-tertiary)' }} /></div>;
  if (commits.length === 0) return <p className="text-center py-8 text-sm" style={{ color: 'var(--text-tertiary)' }}>No commits.</p>;

  return (
    <div className="border rounded-lg divide-y" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
      {commits.map(c => (
        <div key={c.sha} className="px-4 py-3 flex items-start gap-3">
          <GitCommit className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{c.commit.message.split('\n')[0]}</p>
            <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {c.author ? <span className="flex items-center gap-1"><img src={c.author.avatar_url} alt="" className="w-3.5 h-3.5 rounded-full" />{c.author.login}</span> : <span>{c.commit.author.name}</span>}
              <span className="font-mono">{c.sha.substring(0, 7)}</span>
              <span>{timeAgo(c.commit.author.date)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RepoDetail;
