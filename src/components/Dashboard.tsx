import React from 'react';
import { GitPullRequest, GitCommit, Star, Activity } from 'lucide-react';

const Dashboard: React.FC = () => {
  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Welcome back
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Here's what's happening with your repositories
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard 
          icon={GitPullRequest} 
          label="Open PRs" 
          value="12" 
          trend="+3 this week" 
          trendUp={true}
        />
        <StatCard 
          icon={GitCommit} 
          label="Commits" 
          value="48" 
          trend="+12 today" 
          trendUp={true}
        />
        <StatCard 
          icon={Star} 
          label="Stars Earned" 
          value="156" 
          trend="+8 this month" 
          trendUp={true}
        />
        <StatCard 
          icon={Activity} 
          label="AI Reviews" 
          value="24" 
          trend="Pending: 3" 
          trendUp={false}
        />
      </div>

      {/* Recent Activity */}
      <div className="glass-panel p-6">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Recent Activity
        </h2>
        <div className="space-y-3">
          <ActivityItem 
            type="pr"
            title="feat: add AI-generated PR descriptions"
            repo="scorpion7slayer/NxtGit"
            time="2 hours ago"
          />
          <ActivityItem 
            type="commit"
            title="fix: resolve merge conflicts"
            repo="scorpion7slayer/market-plier"
            time="5 hours ago"
          />
          <ActivityItem 
            type="review"
            title="AI reviewed #42 - Approved with suggestions"
            repo="flavortown/hackclub"
            time="1 day ago"
          />
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, trend, trendUp }) => (
  <div className="glass-panel p-5">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center"
           style={{ background: 'var(--bg-tertiary)' }}>
        <Icon className="w-5 h-5" style={{ color: 'var(--accent)' }} />
      </div>
      <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </span>
    </div>
    <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
      {value}
    </div>
    <div className="text-xs" style={{ color: trendUp ? 'var(--success)' : 'var(--text-tertiary)' }}>
      {trend}
    </div>
  </div>
);

interface ActivityItemProps {
  type: 'pr' | 'commit' | 'review';
  title: string;
  repo: string;
  time: string;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ type, title, repo, time }) => {
  const typeColors = {
    pr: '#007AFF',
    commit: '#34C759',
    review: '#5856D6'
  };

  const typeLabels = {
    pr: 'PR',
    commit: 'Commit',
    review: 'Review'
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl transition-colors hover:bg-white/5">
      <div className="w-2 h-2 rounded-full" style={{ background: typeColors[type] }} />
      <div className="flex-1">
        <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
          {title}
        </p>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          {repo}
        </p>
      </div>
      <div className="text-right">
        <span className="text-xs px-2 py-1 rounded-full"
              style={{ 
                background: `${typeColors[type]}20`,
                color: typeColors[type]
              }}>
          {typeLabels[type]}
        </span>
        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
          {time}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
