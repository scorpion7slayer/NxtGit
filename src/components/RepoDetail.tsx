import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Folder, File, GitBranch, Star, CircleDot,
  GitPullRequest, GitCommit, Loader2, ChevronRight, ChevronDown,
  PlayCircle, CheckCircle, XCircle, Clock, MinusCircle, Tag,
  Users, Shield, Package, Download,
  Pencil, Trash2, Eye, FilePlus, Image as ImageIcon,
} from 'lucide-react';
import hljs from 'highlight.js';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  fetchRepoDetail, fetchRepoContents, fetchFileContent, fetchFileInfo,
  fetchRepoIssues, fetchRepoPRs, fetchRepoCommits, fetchWorkflowRuns,
  fetchRepoReleases, fetchRepoBranches, fetchRepoContributors,
  createOrUpdateFile, deleteFile,
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
    <div className="p-6 w-full">
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

// --- Helpers ---

const IMAGE_EXTS = new Set(['png','jpg','jpeg','gif','svg','webp','ico','bmp','avif']);
const MARKDOWN_EXTS = new Set(['md','mdx','markdown']);
const HTML_EXTS = new Set(['html','htm']);
const isImageFile = (f: string) => IMAGE_EXTS.has(f.split('.').pop()?.toLowerCase() || '');
const isMarkdownFile = (f: string) => MARKDOWN_EXTS.has(f.split('.').pop()?.toLowerCase() || '');
const isHtmlFile = (f: string) => HTML_EXTS.has(f.split('.').pop()?.toLowerCase() || '');

// --- Code Tab with highlight.js + edit/commit/preview ---

const CodeTab: React.FC<{ owner: string; name: string; branch: string }> = ({ owner, name, branch }) => {
  const [contents, setContents] = useState<GitHubContent[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFileView, setIsFileView] = useState(false);
  const codeRef = useRef<HTMLElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [fileSha, setFileSha] = useState<string | null>(null);
  const [commitMsg, setCommitMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCommitDialog, setShowCommitDialog] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New file state
  const [creating, setCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [newFileCommitMsg, setNewFileCommitMsg] = useState('');

  // Markdown/HTML preview & delete
  const [showPreview, setShowPreview] = useState(false);
  const [resolvedHtml, setResolvedHtml] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setCurrentPath('');
    setFileContent(null);
    setEditing(false);
    setCreating(false);
    setIsFileView(false);
  }, [branch]);

  useEffect(() => {
    setLoading(true);
    setFileContent(null);
    setContents([]);
    setIsFileView(false);
    setFileSha(null);
    setEditing(false);
    setSaveSuccess(false);
    setSaveError(null);
    setShowPreview(false);
    setShowDeleteConfirm(false);

    fetchRepoContents(owner, name, currentPath, branch)
      .then(items => {
        setIsFileView(false);
        setContents([...items].sort((a, b) => {
          if (a.type === 'dir' && b.type !== 'dir') return -1;
          if (a.type !== 'dir' && b.type === 'dir') return 1;
          return a.name.localeCompare(b.name);
        }));
      })
      .catch(() => {
        setIsFileView(true);
        const fn = currentPath.split('/').pop() || '';
        if (!isImageFile(fn)) {
          fetchFileContent(owner, name, currentPath, branch).then(setFileContent).catch(() => {});
        }
        fetchFileInfo(owner, name, currentPath, branch).then(info => setFileSha(info.sha)).catch(() => {});
      })
      .finally(() => setLoading(false));
  }, [owner, name, currentPath, branch, refreshKey]);

  useEffect(() => {
    if (fileContent !== null && codeRef.current && !editing && !showPreview) {
      codeRef.current.removeAttribute('data-highlighted');
      hljs.highlightElement(codeRef.current);
    }
  }, [fileContent, currentPath, editing, showPreview]);

  const breadcrumbs = currentPath ? currentPath.split('/') : [];
  const fileName = breadcrumbs[breadcrumbs.length - 1] || '';
  const lang = detectLanguage(fileName);
  const isImage = isImageFile(fileName);
  const isMd = isMarkdownFile(fileName);
  const isHtml = isHtmlFile(fileName);

  // Resolve linked CSS/JS for HTML preview
  useEffect(() => {
    if (!showPreview || !isHtml || fileContent === null) {
      setResolvedHtml(null);
      return;
    }
    let cancelled = false;
    const dirPath = currentPath.split('/').slice(0, -1).join('/');
    const resolvePath = (href: string) => {
      if (/^https?:\/\/|^\/\//i.test(href)) return null; // absolute URL, skip
      return dirPath ? `${dirPath}/${href}` : href;
    };

    (async () => {
      let html = fileContent;

      // Inline linked stylesheets: <link href="style.css" rel="stylesheet" />
      const cssRegex = /<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["']stylesheet["'][^>]*\/?>|<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*\/?>/gi;
      const cssMatches = [...html.matchAll(cssRegex)];
      for (const match of cssMatches) {
        const href = match[1] || match[2];
        const repoPath = resolvePath(href);
        if (!repoPath) continue;
        try {
          const css = await fetchFileContent(owner, name, repoPath, branch);
          if (cancelled) return;
          html = html.replace(match[0], `<style>/* ${href} */\n${css}</style>`);
        } catch { /* skip if not found */ }
      }

      // Inline linked scripts: <script src="script.js"></script>
      const jsRegex = /<script\s+[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi;
      const jsMatches = [...html.matchAll(jsRegex)];
      for (const match of jsMatches) {
        const src = match[1];
        const repoPath = resolvePath(src);
        if (!repoPath) continue;
        try {
          const js = await fetchFileContent(owner, name, repoPath, branch);
          if (cancelled) return;
          html = html.replace(match[0], `<script>/* ${src} */\n${js}<\/script>`);
        } catch { /* skip if not found */ }
      }

      // Resolve relative image src to raw.githubusercontent.com
      const rawBase = `https://raw.githubusercontent.com/${owner}/${name}/${branch}/${dirPath ? dirPath + '/' : ''}`;
      html = html.replace(
        /(<img\s+[^>]*src=["'])(?!https?:\/\/|\/\/|data:)([^"']+)(["'])/gi,
        `$1${rawBase}$2$3`
      );

      // Inject anchor fix: intercept hash links to scroll instead of navigate
      const anchorFix = `<script>document.addEventListener('click',function(e){var a=e.target.closest('a');if(!a)return;var href=a.getAttribute('href');if(href&&href.startsWith('#')){e.preventDefault();var el=document.querySelector(href)||document.querySelector('[name="'+href.slice(1)+'"]');if(el)el.scrollIntoView({behavior:'smooth'});}});<\/script>`;
      if (/<\/body>/i.test(html)) {
        html = html.replace(/<\/body>/i, anchorFix + '</body>');
      } else {
        html += anchorFix;
      }

      if (!cancelled) setResolvedHtml(html);
    })();

    return () => { cancelled = true; };
  }, [showPreview, isHtml, fileContent, owner, name, currentPath, branch]);

  const handleSave = async () => {
    if (!commitMsg.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      await createOrUpdateFile(owner, name, currentPath, editContent, commitMsg, fileSha || undefined, branch);
      setFileContent(editContent);
      setEditing(false);
      setSaveSuccess(true);
      setShowCommitDialog(false);
      fetchFileInfo(owner, name, currentPath, branch).then(info => setFileSha(info.sha)).catch(() => {});
    } catch (e: any) {
      setSaveError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!fileSha) return;
    setDeleting(true);
    try {
      await deleteFile(owner, name, currentPath, fileSha, `Delete ${fileName}`, branch);
      const p = currentPath.split('/'); p.pop();
      setCurrentPath(p.join('/'));
      setShowDeleteConfirm(false);
    } catch (e: any) {
      setSaveError(e.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateFile = async () => {
    if (!newFileName.trim() || !newFileCommitMsg.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const fullPath = currentPath ? `${currentPath}/${newFileName}` : newFileName;
      await createOrUpdateFile(owner, name, fullPath, newFileContent, newFileCommitMsg, undefined, branch);
      setCreating(false);
      setNewFileName('');
      setNewFileContent('');
      setNewFileCommitMsg('');
      setRefreshKey(k => k + 1);
    } catch (e: any) {
      setSaveError(e.message || 'Failed to create file');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-tertiary)' }} /></div>;
  }

  // --- Creating new file ---
  if (creating) {
    return (
      <div>
        <Breadcrumbs parts={breadcrumbs} onNavigate={(p) => { setCreating(false); setCurrentPath(p); }} />
        <div className="border rounded-lg overflow-hidden mt-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
          <div className="px-4 py-3 border-b flex items-center gap-3"
               style={{ borderColor: 'var(--border)', background: 'var(--bg-tertiary)' }}>
            <FilePlus className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>New file in {currentPath || '/'}</span>
          </div>
          <div className="p-4 space-y-3">
            <input value={newFileName} onChange={e => setNewFileName(e.target.value)}
                   placeholder="filename.ext" className="input-glass" autoFocus />
            <textarea value={newFileContent} onChange={e => setNewFileContent(e.target.value)}
                      placeholder="File content..." className="input-glass font-mono text-sm"
                      style={{ minHeight: 200, resize: 'vertical' }} />
            <input value={newFileCommitMsg} onChange={e => setNewFileCommitMsg(e.target.value)}
                   placeholder="Commit message" className="input-glass" />
            {saveError && <p className="text-xs" style={{ color: 'var(--error)' }}>{saveError}</p>}
            <div className="flex gap-2">
              <button onClick={handleCreateFile} disabled={saving || !newFileName.trim() || !newFileCommitMsg.trim()}
                      className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <><GitCommit className="w-3 h-3" /> Commit new file</>}
              </button>
              <button onClick={() => { setCreating(false); setSaveError(null); }} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- File viewer (code, image, markdown) ---
  if (isFileView) {
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${name}/${branch}/${currentPath}`;

    return (
      <div>
        <Breadcrumbs parts={breadcrumbs} onNavigate={setCurrentPath} />

        {saveSuccess && (
          <div className="mt-2 px-3 py-2 rounded-lg text-xs flex items-center gap-2"
               style={{ background: 'rgba(52,199,89,0.1)', color: 'var(--success)' }}>
            <CheckCircle className="w-3.5 h-3.5" /> Changes committed successfully
          </div>
        )}

        <div className="border rounded-lg overflow-hidden mt-2" style={{ borderColor: 'var(--border)' }}>
          {/* File header toolbar */}
          <div className="px-4 py-2 text-xs border-b flex items-center justify-between gap-2"
               style={{ borderColor: 'var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
            <div className="flex items-center gap-2">
              {isImage && <ImageIcon className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />}
              <span>{fileName}</span>
              {lang && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-secondary)' }}>{lang}</span>}
            </div>
            <div className="flex items-center gap-1.5">
              {(isMd || isHtml) && !editing && (
                <button onClick={() => setShowPreview(!showPreview)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[11px] hover:bg-[var(--bg-secondary)] transition-colors"
                        style={{ color: showPreview ? 'var(--accent)' : 'var(--text-secondary)' }}>
                  <Eye className="w-3 h-3" /> {showPreview ? 'Code' : 'Preview'}
                </button>
              )}
              {!isImage && !editing && (
                <button onClick={() => { setEditContent(fileContent || ''); setEditing(true); setCommitMsg(`Update ${fileName}`); setSaveError(null); setSaveSuccess(false); }}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[11px] hover:bg-[var(--bg-secondary)] transition-colors"
                        style={{ color: 'var(--text-secondary)' }}>
                  <Pencil className="w-3 h-3" /> Edit
                </button>
              )}
              {!editing && fileSha && (
                <button onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[11px] hover:bg-[var(--bg-secondary)] transition-colors"
                        style={{ color: 'var(--error)' }}>
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              )}
            </div>
          </div>

          {/* Image preview */}
          {isImage && (
            <div className="p-6 flex justify-center" style={{ background: 'var(--bg-secondary)' }}>
              <img src={rawUrl} alt={fileName} style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8 }} />
            </div>
          )}

          {/* Markdown preview */}
          {!isImage && showPreview && isMd && fileContent !== null && (
            <div className="p-6 overflow-auto max-h-[65vh] changelog-content" style={{ background: 'var(--bg-secondary)' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{fileContent}</ReactMarkdown>
            </div>
          )}

          {/* HTML preview */}
          {!isImage && showPreview && isHtml && (
            resolvedHtml ? (
              <div style={{ background: 'var(--bg-secondary)' }}>
                <iframe
                  srcDoc={resolvedHtml}
                  sandbox="allow-scripts"
                  title={`Preview ${fileName}`}
                  style={{ width: '100%', height: '65vh', border: 'none', background: 'white' }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center py-12" style={{ background: 'var(--bg-secondary)' }}>
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-tertiary)' }} />
              </div>
            )
          )}

          {/* Edit mode */}
          {!isImage && editing && (
            <div style={{ background: 'var(--bg-secondary)' }}>
              <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
                        className="w-full p-4 text-[13px] leading-relaxed font-mono outline-none"
                        style={{ background: 'transparent', color: 'var(--text-primary)', minHeight: '50vh', resize: 'vertical', border: 'none' }} />
              <div className="px-4 py-3 border-t flex items-center gap-2 flex-wrap" style={{ borderColor: 'var(--border)' }}>
                {showCommitDialog ? (
                  <>
                    <input value={commitMsg} onChange={e => setCommitMsg(e.target.value)}
                           placeholder="Commit message" className="input-glass flex-1 text-xs" autoFocus />
                    <button onClick={handleSave} disabled={saving || !commitMsg.trim()}
                            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <><GitCommit className="w-3 h-3" /> Commit</>}
                    </button>
                  </>
                ) : (
                  <button onClick={() => setShowCommitDialog(true)} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                    <GitCommit className="w-3 h-3" /> Commit changes
                  </button>
                )}
                <button onClick={() => { setEditing(false); setSaveError(null); setShowCommitDialog(false); }} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                {saveError && <p className="text-xs w-full" style={{ color: 'var(--error)' }}>{saveError}</p>}
              </div>
            </div>
          )}

          {/* Code view (read-only) with line numbers */}
          {!isImage && !editing && !showPreview && fileContent !== null && (
            <div className="overflow-auto max-h-[65vh] flex" style={{ background: 'var(--bg-secondary)' }}>
              <div className="select-none text-right py-4 pl-3 pr-3 text-[13px] flex-shrink-0"
                   style={{ color: 'var(--text-tertiary)', userSelect: 'none', lineHeight: '1.625', borderRight: '1px solid var(--border)', fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace' }}>
                {fileContent.split('\n').map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <pre className="py-4 pl-4 pr-4 text-[13px] m-0 flex-1 min-w-0" style={{ lineHeight: '1.625' }}><code
                ref={codeRef}
                className={lang ? `language-${lang}` : ''}
                style={{ background: 'transparent' }}
              >{fileContent}</code></pre>
            </div>
          )}
        </div>

        {/* Delete confirmation dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}
               onClick={() => setShowDeleteConfirm(false)}>
            <div className="border rounded-xl p-5 max-w-sm w-full mx-4"
                 style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
                 onClick={e => e.stopPropagation()}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Delete {fileName}?</h3>
              <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
                This will create a commit that deletes this file. This action cannot be undone.
              </p>
              {saveError && <p className="text-xs mb-2" style={{ color: 'var(--error)' }}>{saveError}</p>}
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                <button onClick={handleDelete} disabled={deleting}
                        className="text-xs px-3 py-1.5 rounded-md font-medium transition-colors"
                        style={{ background: 'var(--error)', color: 'white' }}>
                  {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Delete file'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- Directory listing ---
  return (
    <div>
      {currentPath && <Breadcrumbs parts={breadcrumbs} onNavigate={setCurrentPath} />}
      <div className="flex justify-end mb-2 mt-1">
        <button onClick={() => { setCreating(true); setNewFileCommitMsg('Create new file'); setSaveError(null); }}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors hover:opacity-80"
                style={{ background: 'rgba(0,122,255,0.1)', color: 'var(--accent)' }}>
          <FilePlus className="w-3.5 h-3.5" /> New file
        </button>
      </div>
      <div className="border rounded-lg divide-y" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
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
              : isImageFile(item.name)
                ? <ImageIcon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--success)' }} />
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
