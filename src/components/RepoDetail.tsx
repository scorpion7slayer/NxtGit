import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Folder, File, GitBranch, Star, CircleDot,
  GitPullRequest, GitCommit, Loader2, ChevronRight, ChevronDown,
  PlayCircle, CheckCircle, XCircle, Clock, MinusCircle, Tag,
  Users, Shield, Package, Download,
} from 'lucide-react';
import hljs from 'highlight.js';
import {
  fetchRepoDetail, fetchRepoContents, fetchFileContent,
  fetchRepoIssues, fetchRepoPRs, fetchRepoCommits, fetchWorkflowRuns,
  fetchRepoReleases, fetchRepoBranches, fetchRepoContributors,
  langColor, timeAgo, detectLanguage,
  type GitHubRepo, type GitHubContent, type GitHubIssue,
  type GitHubRepoPR, type GitHubCommit, type GitHubWorkflowRun,
  type GitHubRelease, type GitHubBranch, type GitHubContributor,
} from '../lib/github';

type Tab = 'code' | 'issues' | 'prs' | 'commits' | 'actions' | 'releases' | 'branches' | 'contributors';

const RepoDetail: React.FC = () => {
  const { owner, name } = useParams<{ owner: string; name: string }>();
  const navigate = useNavigate();
  const [repo, setRepo] = useState<GitHubRepo | null>(null);
  const [tab, setTab] = useState<Tab>('code');
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [branchOpen, setBranchOpen] = useState(false);

  useEffect(() => {
    if (!owner || !name) return;
    fetchRepoDetail(owner, name)
      .then(r => {
        setRepo(r);
        setSelectedBranch(r.default_branch);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    fetchRepoBranches(owner, name)
      .then(setBranches)
      .catch(() => {});
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
    { id: 'actions', label: 'Actions', icon: PlayCircle },
    { id: 'releases', label: 'Releases', icon: Tag },
    { id: 'branches', label: 'Branches', icon: GitBranch },
    { id: 'contributors', label: 'Contributors', icon: Users },
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
          {repo.fork && repo.parent && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              forked from{' '}
              <span className="cursor-pointer hover:underline" style={{ color: 'var(--accent)' }}
                    onClick={() => navigate(`/repos/${repo.parent!.full_name}`)}>
                {repo.parent.full_name}
              </span>
            </p>
          )}
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

      {/* Branch selector */}
      {branches.length > 1 && (
        <div className="relative mb-4 inline-block">
          <button
            onClick={() => setBranchOpen(!branchOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-[var(--bg-tertiary)] transition-colors"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
          >
            <GitBranch className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
            <span className="font-mono">{selectedBranch}</span>
            <ChevronDown className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
          </button>
          {branchOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 border rounded-lg shadow-lg overflow-auto max-h-64 min-w-[200px]"
                 style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
              {branches.map(b => (
                <button key={b.name}
                  className="w-full text-left px-3 py-2 text-xs font-mono hover:bg-[var(--bg-tertiary)] transition-colors flex items-center gap-2"
                  style={{ color: b.name === selectedBranch ? 'var(--accent)' : 'var(--text-primary)' }}
                  onClick={() => { setSelectedBranch(b.name); setBranchOpen(false); }}
                >
                  <GitBranch className="w-3 h-3 flex-shrink-0" style={{ color: b.name === selectedBranch ? 'var(--accent)' : 'var(--text-tertiary)' }} />
                  {b.name}
                  {b.name === repo.default_branch && (
                    <span className="text-[9px] px-1 py-0.5 rounded-full ml-auto"
                          style={{ background: 'rgba(0,122,255,0.1)', color: 'var(--accent)' }}>default</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-0 border-b mb-4" style={{ borderColor: 'var(--border)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px"
            style={{ borderColor: tab === t.id ? 'var(--accent)' : 'transparent', color: tab === t.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'code' && <CodeTab owner={owner} name={name} branch={selectedBranch} />}
      {tab === 'issues' && <IssuesTab owner={owner} name={name} />}
      {tab === 'prs' && <PRsTab owner={owner} name={name} />}
      {tab === 'commits' && <CommitsTab owner={owner} name={name} branch={selectedBranch} />}
      {tab === 'actions' && <ActionsTab owner={owner} name={name} />}
      {tab === 'releases' && <ReleasesTab owner={owner} name={name} />}
      {tab === 'branches' && <BranchesTab owner={owner} name={name} defaultBranch={repo.default_branch} />}
      {tab === 'contributors' && <ContributorsTab owner={owner} name={name} />}
    </div>
  );
};

// --- Code Tab with highlight.js ---

const CodeTab: React.FC<{ owner: string; name: string; branch: string }> = ({ owner, name, branch }) => {
  const [contents, setContents] = useState<GitHubContent[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setCurrentPath('');
    setFileContent(null);
  }, [branch]);

  useEffect(() => {
    setLoading(true);
    setFileContent(null);
    fetchRepoContents(owner, name, currentPath, branch)
      .then(items => {
        setContents([...items].sort((a, b) => {
          if (a.type === 'dir' && b.type !== 'dir') return -1;
          if (a.type !== 'dir' && b.type === 'dir') return 1;
          return a.name.localeCompare(b.name);
        }));
      })
      .catch(() => {
        fetchFileContent(owner, name, currentPath, branch).then(setFileContent).catch(() => {});
      })
      .finally(() => setLoading(false));
  }, [owner, name, currentPath, branch]);

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

// --- Commits Tab (clickable) ---
const CommitsTab: React.FC<{ owner: string; name: string; branch: string }> = ({ owner, name, branch }) => {
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { fetchRepoCommits(owner, name, branch).then(setCommits).catch(() => {}).finally(() => setLoading(false)); }, [owner, name, branch]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-tertiary)' }} /></div>;
  if (commits.length === 0) return <p className="text-center py-8 text-sm" style={{ color: 'var(--text-tertiary)' }}>No commits.</p>;

  return (
    <div className="border rounded-lg divide-y" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
      {commits.map(c => (
        <div key={c.sha} className="px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
             onClick={() => navigate(`/commit/${owner}/${name}/${c.sha}`)}>
          <GitCommit className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{c.commit.message.split('\n')[0]}</p>
            <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {c.author ? (
                <span className="flex items-center gap-1 hover:underline"
                      onClick={e => { e.stopPropagation(); navigate(`/profile/${c.author!.login}`); }}>
                  <img src={c.author.avatar_url} alt="" className="w-3.5 h-3.5 rounded-full" />{c.author.login}
                </span>
              ) : <span>{c.commit.author.name}</span>}
              <span className="font-mono">{c.sha.substring(0, 7)}</span>
              <span>{timeAgo(c.commit.author.date)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- Actions Tab ---
function runIcon(conclusion: string | null, status: string) {
  if (status === 'in_progress' || status === 'queued' || status === 'waiting') {
    return <Clock className="w-4 h-4" style={{ color: 'var(--warning)' }} />;
  }
  switch (conclusion) {
    case 'success': return <CheckCircle className="w-4 h-4" style={{ color: 'var(--success)' }} />;
    case 'failure': return <XCircle className="w-4 h-4" style={{ color: 'var(--error)' }} />;
    case 'cancelled': return <MinusCircle className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />;
    case 'skipped': return <MinusCircle className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />;
    default: return <Clock className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />;
  }
}

function runColor(conclusion: string | null, status: string): string {
  if (status === 'in_progress' || status === 'queued' || status === 'waiting') return 'var(--warning)';
  switch (conclusion) {
    case 'success': return 'var(--success)';
    case 'failure': return 'var(--error)';
    default: return 'var(--text-tertiary)';
  }
}

const ActionsTab: React.FC<{ owner: string; name: string }> = ({ owner, name }) => {
  const [runs, setRuns] = useState<GitHubWorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkflowRuns(owner, name).then(setRuns).catch(() => {}).finally(() => setLoading(false));
  }, [owner, name]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-tertiary)' }} /></div>;
  if (runs.length === 0) return <p className="text-center py-8 text-sm" style={{ color: 'var(--text-tertiary)' }}>No workflow runs found.</p>;

  return (
    <div className="border rounded-lg divide-y" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
      {runs.map(run => {
        const color = runColor(run.conclusion, run.status);
        return (
          <div key={run.id} className="px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
               onClick={() => navigate(`/run/${owner}/${name}/${run.id}`)}>
            <div className="mt-0.5 flex-shrink-0">{runIcon(run.conclusion, run.status)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{run.name}</p>
              <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                <span className="font-medium px-1.5 py-0.5 rounded-full text-[10px]"
                      style={{ background: `${color}15`, color }}>
                  {run.status === 'in_progress' ? 'Running' : (run.conclusion || run.status)}
                </span>
                <span>#{run.run_number}</span>
                <span>{run.event}</span>
                {run.head_branch && <span className="font-mono">{run.head_branch}</span>}
                {run.actor && (
                  <span className="flex items-center gap-1 hover:underline"
                        onClick={e => { e.stopPropagation(); navigate(`/profile/${run.actor!.login}`); }}>
                    <img src={run.actor.avatar_url} alt="" className="w-3.5 h-3.5 rounded-full" />
                    {run.actor.login}
                  </span>
                )}
                <span>{timeAgo(run.created_at)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// --- Releases Tab ---
const ReleasesTab: React.FC<{ owner: string; name: string }> = ({ owner, name }) => {
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { fetchRepoReleases(owner, name).then(setReleases).catch(() => {}).finally(() => setLoading(false)); }, [owner, name]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-tertiary)' }} /></div>;
  if (releases.length === 0) return <p className="text-center py-8 text-sm" style={{ color: 'var(--text-tertiary)' }}>No releases.</p>;

  return (
    <div className="space-y-3">
      {releases.map((rel, idx) => (
        <div key={rel.id} className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <div className="px-4 py-3" style={{ background: 'var(--bg-secondary)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Tag className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {rel.name || rel.tag_name}
              </span>
              {idx === 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: 'rgba(52,199,89,0.15)', color: 'var(--success)' }}>Latest</span>
              )}
              {rel.prerelease && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: 'rgba(255,149,0,0.15)', color: 'var(--warning)' }}>Pre-release</span>
              )}
              {rel.draft && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>Draft</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              <span className="font-mono">{rel.tag_name}</span>
              <span className="flex items-center gap-1 cursor-pointer hover:underline"
                    onClick={() => navigate(`/profile/${rel.author.login}`)}>
                <img src={rel.author.avatar_url} alt="" className="w-3.5 h-3.5 rounded-full" />
                {rel.author.login}
              </span>
              <span>{rel.published_at ? timeAgo(rel.published_at) : timeAgo(rel.created_at)}</span>
            </div>
            {rel.body && (
              <p className="text-sm mt-2 line-clamp-3 whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                {rel.body}
              </p>
            )}
          </div>
          {rel.assets.length > 0 && (
            <div className="border-t px-4 py-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-tertiary)' }}>
              <p className="text-[10px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Assets</p>
              {rel.assets.map(asset => (
                <a key={asset.name} href={asset.browser_download_url} target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-2 py-1 text-xs hover:underline" style={{ color: 'var(--accent)' }}>
                  <Package className="w-3 h-3" />
                  <span>{asset.name}</span>
                  <span style={{ color: 'var(--text-tertiary)' }}>({(asset.size / 1024 / 1024).toFixed(1)} MB)</span>
                  <span className="flex items-center gap-0.5" style={{ color: 'var(--text-tertiary)' }}>
                    <Download className="w-2.5 h-2.5" /> {asset.download_count}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// --- Branches Tab ---
const BranchesTab: React.FC<{ owner: string; name: string; defaultBranch: string }> = ({ owner, name, defaultBranch }) => {
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRepoBranches(owner, name).then(setBranches).catch(() => {}).finally(() => setLoading(false)); }, [owner, name]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-tertiary)' }} /></div>;
  if (branches.length === 0) return <p className="text-center py-8 text-sm" style={{ color: 'var(--text-tertiary)' }}>No branches.</p>;

  const sorted = [...branches].sort((a, b) => {
    if (a.name === defaultBranch) return -1;
    if (b.name === defaultBranch) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="border rounded-lg divide-y" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
      {sorted.map(branch => (
        <div key={branch.name} className="px-4 py-3 flex items-center gap-3">
          <GitBranch className="w-4 h-4 flex-shrink-0" style={{ color: branch.name === defaultBranch ? 'var(--accent)' : 'var(--text-tertiary)' }} />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{branch.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {branch.name === defaultBranch && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: 'rgba(0,122,255,0.1)', color: 'var(--accent)' }}>default</span>
            )}
            {branch.protected && (
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(255,149,0,0.1)', color: 'var(--warning)' }}>
                <Shield className="w-2.5 h-2.5" /> protected
              </span>
            )}
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>{branch.commit.sha.substring(0, 7)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- Contributors Tab ---
const ContributorsTab: React.FC<{ owner: string; name: string }> = ({ owner, name }) => {
  const [contributors, setContributors] = useState<GitHubContributor[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { fetchRepoContributors(owner, name).then(setContributors).catch(() => {}).finally(() => setLoading(false)); }, [owner, name]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-tertiary)' }} /></div>;
  if (contributors.length === 0) return <p className="text-center py-8 text-sm" style={{ color: 'var(--text-tertiary)' }}>No contributors.</p>;

  return (
    <div className="border rounded-lg divide-y" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
      {contributors.map(c => (
        <div key={c.login} className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
             onClick={() => navigate(`/profile/${c.login}`)}>
          <img src={c.avatar_url} alt={c.login} className="w-8 h-8 rounded-full" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{c.login}</span>
          </div>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {c.contributions} commit{c.contributions !== 1 ? 's' : ''}
          </span>
        </div>
      ))}
    </div>
  );
};

export default RepoDetail;
