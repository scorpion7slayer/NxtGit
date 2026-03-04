import React from 'react';
import { Search, Filter, Star, GitBranch } from 'lucide-react';

const Repositories: React.FC = () => {
  return (
    <div className="p-8">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Repositories
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage and explore your GitHub repositories
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2" 
                    style={{ color: 'var(--text-tertiary)' }} />
            <input 
              type="text" 
              placeholder="Search repositories..."
              className="input-glass pl-10 w-64"
            />
          </div>
          <button className="btn-secondary flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </header>

      <div className="space-y-3">
        <RepoCard 
          name="NxtGit"
          description="AI-native Git client for macOS with Liquid Glass UI"
          language="TypeScript"
          languageColor="#3178C6"
          stars={42}
          forks={8}
          updated="2 hours ago"
          isPrivate={false}
        />
        <RepoCard 
          name="market-plier"
          description="E-commerce platform built with PHP and MySQL"
          language="PHP"
          languageColor="#4F5D95"
          stars={12}
          forks={3}
          updated="1 day ago"
          isPrivate={false}
        />
        <RepoCard 
          name="openclaw-workspace"
          description="Personal AI agent workspace configuration"
          language="Shell"
          languageColor="#89E051"
          stars={5}
          forks={1}
          updated="3 days ago"
          isPrivate={true}
        />
      </div>
    </div>
  );
};

interface RepoCardProps {
  name: string;
  description: string;
  language: string;
  languageColor: string;
  stars: number;
  forks: number;
  updated: string;
  isPrivate: boolean;
}

const RepoCard: React.FC<RepoCardProps> = ({ 
  name, description, language, languageColor, stars, forks, updated, isPrivate 
}) => (
  <div className="glass-panel p-5 hover:bg-white/5 transition-colors cursor-pointer">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {name}
          </h3>
          {isPrivate && (
            <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
              Private
            </span>
          )}
        </div>
        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
          {description}
        </p>
        <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ background: languageColor }} />
            {language}
          </span>
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4" />
            {stars}
          </span>
          <span className="flex items-center gap-1">
            <GitBranch className="w-4 h-4" />
            {forks}
          </span>
          <span>Updated {updated}</span>
        </div>
      </div>
    </div>
  </div>
);

export default Repositories;
