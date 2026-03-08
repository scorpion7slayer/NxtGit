import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Building, Link as LinkIcon, Twitter,
  GitBranch, GitFork, Star, Users, Loader2, Lock, Calendar,
} from 'lucide-react';
import {
  fetchUserProfile, fetchUserRepos, langColor, timeAgo,
  type GitHubUserProfile, type GitHubRepo,
} from '../lib/github';

const UserProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<GitHubUserProfile | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    setError('');
    Promise.all([
      fetchUserProfile(username).then(setProfile),
      fetchUserRepos(username).then(setRepos),
    ])
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-tertiary)' }} />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <p style={{ color: 'var(--error)' }}>{error || 'User not found'}</p>
      </div>
    );
  }

  const joined = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric',
  });

  return (
    <div className="p-6 w-full">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm mb-4 hover:underline" style={{ color: 'var(--text-secondary)' }}>
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Profile header */}
      <div className="border rounded-xl p-6 mb-6 flex items-start gap-6"
           style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
        <img src={profile.avatar_url} alt={profile.login}
             className="w-24 h-24 rounded-full border-2" style={{ borderColor: 'var(--border)' }} />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {profile.name || profile.login}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>@{profile.login}</p>
          {profile.bio && (
            <p className="text-sm mt-2" style={{ color: 'var(--text-primary)' }}>{profile.bio}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {profile.company && (
              <span className="flex items-center gap-1"><Building className="w-3 h-3" /> {profile.company}</span>
            )}
            {profile.location && (
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {profile.location}</span>
            )}
            {profile.blog && (
              <a href={profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}`}
                 target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-1 hover:underline" style={{ color: 'var(--accent)' }}>
                <LinkIcon className="w-3 h-3" /> {profile.blog}
              </a>
            )}
            {profile.twitter_username && (
              <a href={`https://twitter.com/${profile.twitter_username}`}
                 target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-1 hover:underline" style={{ color: 'var(--accent)' }}>
                <Twitter className="w-3 h-3" /> @{profile.twitter_username}
              </a>
            )}
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Joined {joined}</span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-5 mt-4">
            <StatBadge icon={Users} label="Followers" value={profile.followers} />
            <StatBadge icon={Users} label="Following" value={profile.following} />
            <StatBadge icon={GitBranch} label="Repos" value={profile.public_repos} />
          </div>
        </div>
      </div>

      {/* Repositories */}
      <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
        Repositories ({repos.length})
      </h2>
      {repos.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
          No public repositories.
        </p>
      ) : (
        <div className="border rounded-lg divide-y"
             style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
          {repos.map(repo => (
            <div key={repo.id}
                 className="px-4 py-3 cursor-pointer transition-colors hover:bg-[var(--bg-tertiary)]"
                 onClick={() => navigate(`/repos/${repo.owner.login}/${repo.name}`)}>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
                  {repo.name}
                </h3>
                {repo.fork && (
                  <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-tertiary)' }}>
                    <GitFork className="w-2.5 h-2.5" /> Fork
                  </span>
                )}
                {repo.private && (
                  <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                    <Lock className="w-2.5 h-2.5" /> Private
                  </span>
                )}
              </div>
              {repo.fork && repo.parent && (
                <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
                  forked from <span style={{ color: 'var(--accent)' }}>{repo.parent.full_name}</span>
                </p>
              )}
              {repo.description && (
                <p className="text-sm mb-2 line-clamp-1" style={{ color: 'var(--text-secondary)' }}>
                  {repo.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {repo.language && (
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: langColor(repo.language) }} />
                    {repo.language}
                  </span>
                )}
                {repo.stargazers_count > 0 && (
                  <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {repo.stargazers_count}</span>
                )}
                {repo.forks_count > 0 && (
                  <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> {repo.forks_count}</span>
                )}
                <span>Updated {timeAgo(repo.updated_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const StatBadge: React.FC<{ icon: React.ElementType; label: string; value: number }> = ({
  icon: Icon, label, value,
}) => (
  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
    <Icon className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</span>
    <span>{label}</span>
  </div>
);

export default UserProfile;
