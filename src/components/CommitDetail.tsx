import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, GitCommit, Plus, Minus, Loader2 } from 'lucide-react';
import { fetchCommitDetail, timeAgo, type GitHubCommitDetail } from '../lib/github';

const CommitDetail: React.FC = () => {
  const { owner, name, sha } = useParams<{ owner: string; name: string; sha: string }>();
  const navigate = useNavigate();
  const [commit, setCommit] = useState<GitHubCommitDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!owner || !name || !sha) return;
    fetchCommitDetail(owner, name, sha)
      .then(setCommit)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load commit'))
      .finally(() => setLoading(false));
  }, [owner, name, sha]);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-tertiary)' }} /></div>;
  }

  if (error || !commit) {
    return (
      <div className="p-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm mb-4 hover:underline" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <p style={{ color: 'var(--error)' }}>{error || 'Commit not found'}</p>
      </div>
    );
  }

  const messageLines = commit.commit.message.split('\n');
  const title = messageLines[0];
  const body = messageLines.slice(1).join('\n').trim();

  return (
    <div className="p-6 w-full">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm mb-4 hover:underline" style={{ color: 'var(--text-secondary)' }}>
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      {/* Commit header */}
      <div className="border rounded-xl p-5 mb-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
        <div className="flex items-start gap-3">
          <GitCommit className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h1>
            {body && (
              <pre className="text-sm mt-2 whitespace-pre-wrap font-sans" style={{ color: 'var(--text-secondary)' }}>{body}</pre>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {commit.author ? (
                <span className="flex items-center gap-1.5 cursor-pointer hover:underline"
                      onClick={() => navigate(`/profile/${commit.author!.login}`)}>
                  <img src={commit.author.avatar_url} alt="" className="w-4 h-4 rounded-full" />
                  {commit.author.login}
                </span>
              ) : (
                <span>{commit.commit.author.name}</span>
              )}
              <span className="font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>{commit.sha.substring(0, 7)}</span>
              <span>{timeAgo(commit.commit.author.date)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
        <span>{commit.files.length} file{commit.files.length !== 1 ? 's' : ''} changed</span>
        <span className="flex items-center gap-1" style={{ color: 'var(--success)' }}>
          <Plus className="w-3 h-3" /> {commit.stats.additions} additions
        </span>
        <span className="flex items-center gap-1" style={{ color: 'var(--error)' }}>
          <Minus className="w-3 h-3" /> {commit.stats.deletions} deletions
        </span>
      </div>

      {/* Files diff */}
      <div className="space-y-3">
        {commit.files.map(file => (
          <div key={file.filename} className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <div className="px-4 py-2 text-xs flex items-center justify-between border-b"
                 style={{ borderColor: 'var(--border)', background: 'var(--bg-tertiary)' }}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{
                        background: file.status === 'added' ? 'rgba(52,199,89,0.15)' :
                                    file.status === 'removed' ? 'rgba(255,59,48,0.15)' :
                                    file.status === 'renamed' ? 'rgba(0,122,255,0.15)' : 'rgba(255,149,0,0.15)',
                        color: file.status === 'added' ? 'var(--success)' :
                               file.status === 'removed' ? 'var(--error)' :
                               file.status === 'renamed' ? 'var(--accent)' : 'var(--warning)',
                      }}>
                  {file.status}
                </span>
                <span className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
                  {file.filename}
                </span>
              </div>
              <div className="flex items-center gap-3">
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
    </div>
  );
};

export default CommitDetail;
