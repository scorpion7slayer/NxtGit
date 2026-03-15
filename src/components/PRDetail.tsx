import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, GitPullRequest, GitMerge, Loader2, FileCode, Plus, Minus, Send, Check } from 'lucide-react';
import {
  fetchPRDetail, fetchPRFiles, fetchIssueComments, createComment, mergePR, fetchRepoDetail,
  timeAgo, type GitHubPRDetail, type GitHubPRFile, type GitHubComment, type GitHubRepo,
} from '../lib/github';
import MarkdownRenderer from './MarkdownRenderer';

function formatMergeError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Merge failed';

  if (message.includes('GitHub API error 404')) {
    return 'GitHub could not find a merge endpoint for this pull request. This usually means your account can view the repository but does not have write access to merge into it.';
  }

  if (message.includes('GitHub API error 405')) {
    return 'GitHub does not allow the selected merge method for this pull request right now.';
  }

  if (message.includes('GitHub API error 409')) {
    return 'GitHub reported a merge conflict or an out-of-date branch. Update the pull request branch and try again.';
  }

  if (message.includes('GitHub API error 422')) {
    return 'GitHub rejected the merge. Required checks, required reviews, or branch protection rules may still be blocking it.';
  }

  return message;
}

const PRDetailPage: React.FC = () => {
  const { owner, name, number } = useParams<{ owner: string; name: string; number: string }>();
  const navigate = useNavigate();
  const [pr, setPR] = useState<GitHubPRDetail | null>(null);
  const [repo, setRepo] = useState<GitHubRepo | null>(null);
  const [files, setFiles] = useState<GitHubPRFile[]>([]);
  const [comments, setComments] = useState<GitHubComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'conversation' | 'files'>('conversation');
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [merging, setMerging] = useState(false);
  const [mergeMethod, setMergeMethod] = useState<'merge' | 'squash' | 'rebase'>('merge');
  const [mergeError, setMergeError] = useState('');

  useEffect(() => {
    if (!owner || !name || !number) return;
    const num = parseInt(number);
    Promise.allSettled([
      fetchPRDetail(owner, name, num),
      fetchPRFiles(owner, name, num),
      fetchIssueComments(owner, name, num),
      fetchRepoDetail(owner, name),
    ])
      .then(([prResult, filesResult, commentsResult, repoResult]) => {
        if (prResult.status === 'fulfilled') setPR(prResult.value);
        if (filesResult.status === 'fulfilled') setFiles(filesResult.value);
        if (commentsResult.status === 'fulfilled') setComments(commentsResult.value);
        if (repoResult.status === 'fulfilled') setRepo(repoResult.value);
      })
      .finally(() => setLoading(false));
  }, [owner, name, number]);

  const handleComment = async () => {
    if (!owner || !name || !number || !newComment.trim()) return;
    setPosting(true);
    try {
      const c = await createComment(owner, name, parseInt(number), newComment.trim());
      setComments(prev => [...prev, c]);
      setNewComment('');
    } catch {}
    setPosting(false);
  };

  const handleMerge = async () => {
    if (!owner || !name || !number) return;
    if (!canAttemptMerge) return;
    setMerging(true);
    setMergeError('');
    try {
      await mergePR(owner, name, parseInt(number), mergeMethod);
      const updated = await fetchPRDetail(owner, name, parseInt(number), { force: true });
      setPR(updated);
    } catch (e) {
      setMergeError(formatMergeError(e));
    }
    setMerging(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-tertiary)' }} /></div>;
  }

  if (!pr) {
    return <div className="p-6"><p style={{ color: 'var(--text-tertiary)' }}>Pull request not found.</p></div>;
  }

  const status = pr.merged ? 'merged' : pr.state;
  const statusColor = status === 'merged' ? '#A371F7' : status === 'open' ? '#3FB950' : '#F85149';
  const StatusIcon = pr.merged ? GitMerge : GitPullRequest;
  const repoPermissions = repo?.permissions;
  const hasMergePermission = !!(
    repoPermissions?.admin ||
    repoPermissions?.maintain ||
    repoPermissions?.push
  );
  const mergePermissionKnown = !!repoPermissions;
  const selectedMethodAllowed =
    mergeMethod === 'merge'
      ? repo?.allow_merge_commit !== false
      : mergeMethod === 'squash'
        ? repo?.allow_squash_merge !== false
        : repo?.allow_rebase_merge !== false;
  const mergeMethodLabel =
    mergeMethod === 'merge'
      ? 'merge commits'
      : mergeMethod === 'squash'
        ? 'squash merges'
        : 'rebase merges';
  const canAttemptMerge =
    pr.state === 'open' &&
    !pr.merged &&
    (!mergePermissionKnown || hasMergePermission) &&
    selectedMethodAllowed;

  return (
    <div className="p-6 w-full">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm mb-4 hover:underline" style={{ color: 'var(--text-secondary)' }}>
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <div className="flex items-start gap-3 mb-4">
        <StatusIcon className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: statusColor }} />
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {pr.title} <span className="font-normal" style={{ color: 'var(--text-tertiary)' }}>#{pr.number}</span>
          </h1>
          <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                  style={{ background: `${statusColor}20`, color: statusColor }}>
              {status}
            </span>
            <span className="cursor-pointer hover:underline" onClick={() => navigate(`/profile/${pr.user.login}`)}>{pr.user.login}</span>
            <span> wants to merge <strong>{pr.head.ref}</strong> into <strong>{pr.base.ref}</strong></span>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            <span className="flex items-center gap-1"><Plus className="w-3 h-3" style={{ color: 'var(--success)' }} /> {pr.additions}</span>
            <span className="flex items-center gap-1"><Minus className="w-3 h-3" style={{ color: 'var(--error)' }} /> {pr.deletions}</span>
            <span>{pr.changed_files} files changed</span>
            <span>{timeAgo(pr.updated_at)}</span>
          </div>
        </div>
      </div>

      {/* Merge panel */}
      {pr.state === 'open' && !pr.merged && !mergePermissionKnown && (
        <div className="border rounded-lg p-4 mb-4 flex items-center gap-3 flex-wrap"
             style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
          <select
            value={mergeMethod}
            onChange={e => setMergeMethod(e.target.value as 'merge' | 'squash' | 'rebase')}
            className="input-glass text-xs py-1.5 px-2"
            style={{ width: 'auto' }}
          >
            <option value="merge">Merge commit</option>
            <option value="squash">Squash and merge</option>
            <option value="rebase">Rebase and merge</option>
          </select>
          <button
            onClick={handleMerge}
            disabled={merging}
            className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-4"
            style={{ background: '#238636' }}
          >
            {merging ? <Loader2 className="w-3 h-3 animate-spin" /> : <><GitMerge className="w-3 h-3" /> Merge pull request</>}
          </button>
          {mergeError && <span className="text-xs" style={{ color: 'var(--error)' }}>{mergeError}</span>}
        </div>
      )}

      {pr.state === 'open' && !pr.merged && mergePermissionKnown && !hasMergePermission && (
        <div
          className="border rounded-lg p-4 mb-4 text-sm"
          style={{
            borderColor: 'rgba(255, 149, 0, 0.28)',
            background: 'rgba(255, 149, 0, 0.08)',
            color: 'var(--text-primary)',
          }}
        >
          You can view this pull request, but GitHub only allows merging for users with write access to the base repository.
        </div>
      )}

      {pr.state === 'open' && !pr.merged && mergePermissionKnown && hasMergePermission && !selectedMethodAllowed && (
        <div
          className="border rounded-lg p-4 mb-4 text-sm"
          style={{
            borderColor: 'rgba(255, 149, 0, 0.28)',
            background: 'rgba(255, 149, 0, 0.08)',
            color: 'var(--text-primary)',
          }}
        >
          This repository has disabled {mergeMethodLabel}, so the selected merge method is not available.
        </div>
      )}

      {pr.state === 'open' && !pr.merged && canAttemptMerge && (
        <div className="border rounded-lg p-4 mb-4 flex items-center gap-3 flex-wrap"
             style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
          <select
            value={mergeMethod}
            onChange={e => setMergeMethod(e.target.value as 'merge' | 'squash' | 'rebase')}
            className="input-glass text-xs py-1.5 px-2"
            style={{ width: 'auto' }}
          >
            <option value="merge">Merge commit</option>
            <option value="squash">Squash and merge</option>
            <option value="rebase">Rebase and merge</option>
          </select>
          <button
            onClick={handleMerge}
            disabled={merging}
            className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-4"
            style={{ background: '#238636' }}
          >
            {merging ? <Loader2 className="w-3 h-3 animate-spin" /> : <><GitMerge className="w-3 h-3" /> Merge pull request</>}
          </button>
          {mergeError && <span className="text-xs" style={{ color: 'var(--error)' }}>{mergeError}</span>}
        </div>
      )}

      {pr.merged && (
        <div className="border rounded-lg p-3 mb-4 flex items-center gap-2 text-sm"
             style={{ borderColor: 'rgba(163, 113, 247, 0.3)', background: 'rgba(163, 113, 247, 0.08)', color: '#A371F7' }}>
          <Check className="w-4 h-4" /> This pull request has been merged.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 border-b mb-4" style={{ borderColor: 'var(--border)' }}>
        <button onClick={() => setActiveTab('conversation')}
                className="px-3 py-2 text-sm font-medium border-b-2 -mb-px"
                style={{ borderColor: activeTab === 'conversation' ? 'var(--accent)' : 'transparent', color: activeTab === 'conversation' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
          Conversation
        </button>
        <button onClick={() => setActiveTab('files')}
                className="px-3 py-2 text-sm font-medium border-b-2 -mb-px flex items-center gap-1.5"
                style={{ borderColor: activeTab === 'files' ? 'var(--accent)' : 'transparent', color: activeTab === 'files' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
          <FileCode className="w-3.5 h-3.5" /> Files ({files.length})
        </button>
      </div>

      {activeTab === 'conversation' && (
        <div className="space-y-3">
          {pr.body && (
            <div className="border rounded-lg p-4 text-sm leading-relaxed"
                 style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
              <MarkdownRenderer content={pr.body} />
            </div>
          )}
          {comments.map(c => (
            <div key={c.id} className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <div className="px-4 py-2 text-xs flex items-center gap-2 border-b"
                   style={{ borderColor: 'var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                <img src={c.user.avatar_url} alt="" className="w-4 h-4 rounded-full cursor-pointer" onClick={() => navigate(`/profile/${c.user.login}`)} />
                <span className="font-medium cursor-pointer hover:underline" onClick={() => navigate(`/profile/${c.user.login}`)}>{c.user.login}</span>
                <span>{timeAgo(c.created_at)}</span>
              </div>
              <div className="px-4 py-3 text-sm leading-relaxed"
                   style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                <MarkdownRenderer content={c.body} />
              </div>
            </div>
          ))}

          {/* Comment form */}
          <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              className="input-glass w-full resize-none"
              style={{ borderRadius: 0, border: 'none', borderBottom: '1px solid var(--border)' }}
            />
            <div className="flex items-center justify-end px-3 py-2" style={{ background: 'var(--bg-tertiary)' }}>
              <button
                onClick={handleComment}
                disabled={posting || !newComment.trim()}
                className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3"
              >
                {posting ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Send className="w-3 h-3" /> Comment</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'files' && (
        <div className="space-y-3">
          {files.map(file => (
            <div key={file.filename} className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <div className="px-4 py-2 text-xs flex items-center justify-between border-b"
                   style={{ borderColor: 'var(--border)', background: 'var(--bg-tertiary)' }}>
                <span className="font-mono font-medium cursor-pointer hover:underline"
                      style={{ color: 'var(--accent)' }}
                      onClick={() => navigate(`/repos/${owner}/${name}`)}>
                  {file.filename}
                </span>
                <div className="flex items-center gap-3" style={{ color: 'var(--text-tertiary)' }}>
                  <span style={{ color: 'var(--success)' }}>+{file.additions}</span>
                  <span style={{ color: 'var(--error)' }}>-{file.deletions}</span>
                </div>
              </div>
              {file.patch && (
                <pre className="p-3 text-[12px] font-mono leading-relaxed overflow-auto max-h-80"
                     style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', margin: 0 }}>
                  {file.patch.split('\n').map((line, i) => (
                    <div key={i} style={{
                      background: line.startsWith('+') ? 'rgba(52, 199, 89, 0.1)' :
                                  line.startsWith('-') ? 'rgba(255, 59, 48, 0.1)' :
                                  line.startsWith('@@') ? 'rgba(0, 122, 255, 0.08)' : 'transparent',
                      color: line.startsWith('+') ? 'var(--success)' :
                             line.startsWith('-') ? 'var(--error)' :
                             line.startsWith('@@') ? 'var(--accent)' : 'var(--text-primary)',
                    }}>
                      {line}
                    </div>
                  ))}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PRDetailPage;
