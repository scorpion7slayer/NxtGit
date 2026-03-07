import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CircleDot, CheckCircle2, MessageSquare, Loader2, Send } from 'lucide-react';
import {
  fetchIssueDetail, fetchIssueComments, createComment, updateIssueState,
  timeAgo, type GitHubIssue, type GitHubComment,
} from '../lib/github';
import MarkdownRenderer from './MarkdownRenderer';

const IssueDetail: React.FC = () => {
  const { owner, name, number } = useParams<{ owner: string; name: string; number: string }>();
  const navigate = useNavigate();
  const [issue, setIssue] = useState<GitHubIssue | null>(null);
  const [comments, setComments] = useState<GitHubComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const load = () => {
    if (!owner || !name || !number) return;
    const num = parseInt(number);
    Promise.all([
      fetchIssueDetail(owner, name, num).then(setIssue),
      fetchIssueComments(owner, name, num).then(setComments),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [owner, name, number]);

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

  const handleToggleState = async () => {
    if (!owner || !name || !number || !issue) return;
    setToggling(true);
    try {
      const newState = issue.state === 'open' ? 'closed' : 'open';
      const updated = await updateIssueState(owner, name, parseInt(number), newState);
      setIssue(updated);
    } catch {}
    setToggling(false);
  };

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
        {issue.state === 'open'
          ? <CircleDot className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: 'var(--success)' }} />
          : <CheckCircle2 className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
        }
        <div className="flex-1">
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {issue.title} <span className="font-normal" style={{ color: 'var(--text-tertiary)' }}>#{issue.number}</span>
          </h1>
          <div className="flex items-center gap-3 mt-1 text-xs flex-wrap" style={{ color: 'var(--text-tertiary)' }}>
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
        <div className="border rounded-lg p-4 mb-4 text-sm leading-relaxed"
             style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
          <MarkdownRenderer content={issue.body} />
        </div>
      )}

      {/* Comments */}
      {comments.length > 0 && (
        <div className="mb-4">
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
                <div className="px-4 py-3 text-sm leading-relaxed"
                     style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  <MarkdownRenderer content={c.body} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New comment form */}
      <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <textarea
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          className="input-glass w-full resize-none"
          style={{ borderRadius: 0, border: 'none', borderBottom: '1px solid var(--border)' }}
        />
        <div className="flex items-center justify-between px-3 py-2" style={{ background: 'var(--bg-tertiary)' }}>
          <button
            onClick={handleToggleState}
            disabled={toggling}
            className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
          >
            {toggling ? <Loader2 className="w-3 h-3 animate-spin" /> :
              issue.state === 'open'
                ? <><CheckCircle2 className="w-3 h-3" /> Close issue</>
                : <><CircleDot className="w-3 h-3" /> Reopen issue</>
            }
          </button>
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
  );
};

export default IssueDetail;
