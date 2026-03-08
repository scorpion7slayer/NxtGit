import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, CheckCircle, XCircle, Clock,
  MinusCircle, GitBranch, PlayCircle, ChevronDown, ChevronRight,
} from 'lucide-react';
import {
  fetchWorkflowRunDetail, fetchWorkflowRunJobs, timeAgo,
  type GitHubWorkflowRunDetail, type GitHubWorkflowJob,
} from '../lib/github';

function statusIcon(conclusion: string | null, status: string, size = 'w-4 h-4') {
  if (status === 'in_progress' || status === 'queued' || status === 'waiting') {
    return <Clock className={size} style={{ color: 'var(--warning)' }} />;
  }
  switch (conclusion) {
    case 'success': return <CheckCircle className={size} style={{ color: 'var(--success)' }} />;
    case 'failure': return <XCircle className={size} style={{ color: 'var(--error)' }} />;
    case 'cancelled': return <MinusCircle className={size} style={{ color: 'var(--text-tertiary)' }} />;
    case 'skipped': return <MinusCircle className={size} style={{ color: 'var(--text-tertiary)' }} />;
    default: return <Clock className={size} style={{ color: 'var(--text-tertiary)' }} />;
  }
}

function statusColor(conclusion: string | null, status: string): string {
  if (status === 'in_progress' || status === 'queued' || status === 'waiting') return 'var(--warning)';
  switch (conclusion) {
    case 'success': return 'var(--success)';
    case 'failure': return 'var(--error)';
    default: return 'var(--text-tertiary)';
  }
}

const WorkflowRunDetail: React.FC = () => {
  const { owner, name, runId } = useParams<{ owner: string; name: string; runId: string }>();
  const navigate = useNavigate();
  const [run, setRun] = useState<GitHubWorkflowRunDetail | null>(null);
  const [jobs, setJobs] = useState<GitHubWorkflowJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedJobs, setExpandedJobs] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!owner || !name || !runId) return;
    const id = parseInt(runId);
    Promise.all([
      fetchWorkflowRunDetail(owner, name, id).then(setRun),
      fetchWorkflowRunJobs(owner, name, id).then(setJobs),
    ])
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load workflow run'))
      .finally(() => setLoading(false));
  }, [owner, name, runId]);

  const toggleJob = (jobId: number) => {
    setExpandedJobs(prev => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-tertiary)' }} /></div>;
  }

  if (error || !run) {
    return (
      <div className="p-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm mb-4 hover:underline" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <p style={{ color: 'var(--error)' }}>{error || 'Workflow run not found'}</p>
      </div>
    );
  }

  const color = statusColor(run.conclusion, run.status);

  return (
    <div className="p-6 max-w-5xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm mb-4 hover:underline" style={{ color: 'var(--text-secondary)' }}>
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      {/* Run header */}
      <div className="border rounded-xl p-5 mb-6" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
        <div className="flex items-start gap-3">
          <PlayCircle className="w-5 h-5 mt-1 flex-shrink-0" style={{ color }} />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{run.name}</h1>
            <div className="flex items-center gap-3 mt-2 text-xs flex-wrap" style={{ color: 'var(--text-tertiary)' }}>
              <span className="font-medium px-2 py-0.5 rounded-full"
                    style={{ background: `${color}15`, color }}>
                {run.status === 'in_progress' ? 'Running' : (run.conclusion || run.status)}
              </span>
              <span>#{run.run_number}</span>
              <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> {run.head_branch}</span>
              <span className="font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>
                {run.head_sha.substring(0, 7)}
              </span>
              <span>Triggered by {run.event}</span>
              {run.actor && (
                <span className="flex items-center gap-1 cursor-pointer hover:underline"
                      onClick={() => navigate(`/profile/${run.actor!.login}`)}>
                  <img src={run.actor.avatar_url} alt="" className="w-3.5 h-3.5 rounded-full" />
                  {run.actor.login}
                </span>
              )}
              <span>{timeAgo(run.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs */}
      <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
        Jobs ({jobs.length})
      </h2>
      {jobs.length === 0 ? (
        <p className="text-center py-8 text-sm" style={{ color: 'var(--text-tertiary)' }}>No jobs found.</p>
      ) : (
        <div className="border rounded-lg divide-y" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
          {jobs.map(job => {
            const expanded = expandedJobs.has(job.id);
            const jColor = statusColor(job.conclusion, job.status);
            const duration = job.completed_at && job.started_at
              ? Math.round((new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 1000)
              : null;
            return (
              <div key={job.id}>
                <div className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
                     onClick={() => toggleJob(job.id)}>
                  {expanded
                    ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                    : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                  }
                  {statusIcon(job.conclusion, job.status)}
                  <span className="text-sm font-medium flex-1" style={{ color: 'var(--text-primary)' }}>{job.name}</span>
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                        style={{ background: `${jColor}15`, color: jColor }}>
                    {job.status === 'in_progress' ? 'Running' : (job.conclusion || job.status)}
                  </span>
                  {duration !== null && (
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {duration < 60 ? `${duration}s` : `${Math.floor(duration / 60)}m ${duration % 60}s`}
                    </span>
                  )}
                </div>
                {expanded && job.steps && job.steps.length > 0 && (
                  <div className="border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg-tertiary)' }}>
                    {job.steps.map(step => (
                      <div key={step.number} className="flex items-center gap-2.5 px-6 py-1.5 text-xs">
                        {statusIcon(step.conclusion, step.status, 'w-3 h-3')}
                        <span className="font-mono" style={{ color: 'var(--text-tertiary)' }}>{step.number}</span>
                        <span style={{ color: 'var(--text-primary)' }}>{step.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WorkflowRunDetail;
