import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CircleDot, MessageSquare, Loader2 } from 'lucide-react';
import { fetchIssueDetail, fetchIssueComments, timeAgo, type GitHubIssue, type GitHubComment } from '../lib/github';

const IssueDetail: React.FC = () => {
  const { owner, name, number } = useParams<{ owner: string; name: string; number: string }>();
  const navigate = useNavigate();
  const [issue, setIssue] = useState<GitHubIssue | null>(null);
  const [comments, setComments] = useState<GitHubComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!owner || !name || !number) return;
    const num = parseInt(number);
    Promise.all([
      fetchIssueDetail(owner, name, num).then(setIssue),
      fetchIssueComments(owner, name, num).then(setComments),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [owner, name, number]);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-tertiary)' }} /></div>;
  }

  if (!issue) {
    return <div className="p-6"><p style={{ color: 'var(--text-tertiary)' }}>Issue not found.</p></div>;
  }

  return (
    <div className="p-6 max-w-4xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm mb-4 hover:underline" style={{ color: 'var(--text-secondary)' }}>
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <div className="flex items-start gap-3 mb-4">
        <CircleDot className="w-5 h-5 mt-1 flex-shrink-0"
                   style={{ color: issue.state === 'open' ? 'var(--success)' : 'var(--text-tertiary)' }} />
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {issue.title} <span className="font-normal" style={{ color: 'var(--text-tertiary)' }}>#{issue.number}</span>
          </h1>
          <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                  style={{
                    background: issue.state === 'open' ? 'rgba(52, 199, 89, 0.15)' : 'var(--bg-tertiary)',
                    color: issue.state === 'open' ? 'var(--success)' : 'var(--text-secondary)',
                  }}>
              {issue.state}
            </span>
            <span>{owner}/{name}</span>
            <span>{issue.user.login} opened {timeAgo(issue.created_at)}</span>
            {issue.labels.map(l => (
              <span key={l.name} className="px-1.5 py-0.5 rounded-full text-[10px]"
                    style={{ background: `#${l.color}30`, color: `#${l.color}` }}>{l.name}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      {issue.body && (
        <div className="border rounded-lg p-4 mb-4 text-sm whitespace-pre-wrap leading-relaxed"
             style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
          {issue.body}
        </div>
      )}

      {/* Comments */}
      {comments.length > 0 && (
        <div>
          <h2 className="text-sm font-medium mb-3 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
            <MessageSquare className="w-3.5 h-3.5" /> {comments.length} comment{comments.length !== 1 ? 's' : ''}
          </h2>
          <div className="space-y-3">
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
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueDetail;
