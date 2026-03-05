import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, GitPullRequest, GitMerge, Loader2, FileCode, Plus, Minus } from 'lucide-react';
import { fetchPRDetail, fetchPRFiles, fetchIssueComments, timeAgo, type GitHubPRDetail, type GitHubPRFile, type GitHubComment } from '../lib/github';

const PRDetailPage: React.FC = () => {
  const { owner, name, number } = useParams<{ owner: string; name: string; number: string }>();
  const navigate = useNavigate();
  const [pr, setPR] = useState<GitHubPRDetail | null>(null);
  const [files, setFiles] = useState<GitHubPRFile[]>([]);
  const [comments, setComments] = useState<GitHubComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'conversation' | 'files'>('conversation');

  useEffect(() => {
    if (!owner || !name || !number) return;
    const num = parseInt(number);
    Promise.all([
      fetchPRDetail(owner, name, num).then(setPR),
      fetchPRFiles(owner, name, num).then(setFiles),
      fetchIssueComments(owner, name, num).then(setComments),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [owner, name, number]);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-tertiary)' }} /></div>;
  }

  if (!pr) {
    return <div className="p-6"><p style={{ color: 'var(--text-tertiary)' }}>Pull request not found.</p></div>;
  }

  const status = pr.merged ? 'merged' : pr.state;
  const statusColor = status === 'merged' ? '#A371F7' : status === 'open' ? '#3FB950' : '#F85149';
  const StatusIcon = pr.merged ? GitMerge : GitPullRequest;

  return (
    <div className="p-6 max-w-5xl">
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
            <span>{pr.user.login} wants to merge <strong>{pr.head.ref}</strong> into <strong>{pr.base.ref}</strong></span>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            <span className="flex items-center gap-1"><Plus className="w-3 h-3" style={{ color: 'var(--success)' }} /> {pr.additions}</span>
            <span className="flex items-center gap-1"><Minus className="w-3 h-3" style={{ color: 'var(--error)' }} /> {pr.deletions}</span>
            <span>{pr.changed_files} files changed</span>
            <span>{timeAgo(pr.updated_at)}</span>
          </div>
        </div>
      </div>

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
            <div className="border rounded-lg p-4 text-sm whitespace-pre-wrap leading-relaxed"
                 style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
              {pr.body}
            </div>
          )}
          {comments.map(c => (
            <div key={c.id} className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <div className="px-4 py-2 text-xs flex items-center gap-2 border-b"
                   style={{ borderColor: 'var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                <img src={c.user.avatar_url} alt="" className="w-4 h-4 rounded-full" />
                <span className="font-medium">{c.user.login}</span>
                <span>{timeAgo(c.created_at)}</span>
              </div>
              <div className="px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed"
                   style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                {c.body}
              </div>
            </div>
          ))}
          {!pr.body && comments.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-tertiary)' }}>No comments yet.</p>
          )}
        </div>
      )}

      {activeTab === 'files' && (
        <div className="space-y-3">
          {files.map(file => (
            <div key={file.filename} className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <div className="px-4 py-2 text-xs flex items-center justify-between border-b"
                   style={{ borderColor: 'var(--border)', background: 'var(--bg-tertiary)' }}>
                <span className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{file.filename}</span>
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
