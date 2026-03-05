import React, { useState, useEffect } from 'react';
import { GitPullRequest, GitBranch, Star, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { fetchRepos, fetchEvents, fetchStarCount, fetchUserPRs, timeAgo, type GitHubEvent } from '../lib/github';

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [repoCount, setRepoCount] = useState(0);
  const [starCount, setStarCount] = useState(0);
  const [events, setEvents] = useState<GitHubEvent[]>([]);
  const [openPRCount, setOpenPRCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchRepos().then(repos => setRepoCount(repos.length)),
      fetchStarCount().then(setStarCount),
      fetchEvents().then(setEvents),
      fetchUserPRs().then(prs => {
        const open = prs.filter(p => p.state === 'open' && !p.pull_request?.merged_at);
        setOpenPRCount(open.length);
      }),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const recentEvents = events.slice(0, 12);

  return (
    <div className="p-6 max-w-5xl">
      <header className="mb-6">
        <h1 className="text-xl font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
          Welcome back{user?.name ? `, ${user.name}` : ''}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Here's what's happening with your repositories
        </p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-tertiary)' }} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatCard icon={GitBranch} label="Repositories" value={repoCount} />
            <StatCard icon={Star} label="Total Stars" value={starCount} />
            <StatCard icon={GitPullRequest} label="Open PRs" value={openPRCount} />
          </div>

          <div>
            <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
              Recent Activity
            </h2>
            {recentEvents.length === 0 ? (
              <p className="text-sm py-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
                No recent activity.
              </p>
            ) : (
              <div className="border rounded-lg divide-y" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
                {recentEvents.map(event => (
                  <EventItem key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ElementType; label: string; value: number }> = ({ icon: Icon, label, value }) => (
  <div className="border rounded-lg p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</span>
    </div>
    <div className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</div>
  </div>
);

function eventDescription(event: GitHubEvent): string {
  switch (event.type) {
    case 'PushEvent': {
      const count = event.payload.commits?.length || 0;
      const msg = event.payload.commits?.[0]?.message || '';
      return `Pushed ${count} commit${count !== 1 ? 's' : ''}: ${msg}`;
    }
    case 'PullRequestEvent':
      return `${event.payload.action} PR: ${event.payload.pull_request?.title || ''}`;
    case 'CreateEvent':
      return `Created ${event.payload.ref || 'repository'}`;
    case 'DeleteEvent':
      return `Deleted ${event.payload.ref || 'branch'}`;
    case 'WatchEvent':
      return 'Starred repository';
    case 'ForkEvent':
      return 'Forked repository';
    case 'IssuesEvent':
      return `${event.payload.action} issue`;
    case 'IssueCommentEvent':
      return 'Commented on issue';
    case 'PullRequestReviewEvent':
      return 'Reviewed pull request';
    default:
      return event.type.replace('Event', '');
  }
}

const EventItem: React.FC<{ event: GitHubEvent }> = ({ event }) => (
  <div className="flex items-center gap-3 px-4 py-3">
    <div className="flex-1 min-w-0">
      <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
        {eventDescription(event)}
      </p>
      <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
        {event.repo.name}
      </p>
    </div>
    <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
      {timeAgo(event.created_at)}
    </span>
  </div>
);

export default Dashboard;
