import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { Sparkles, Bug, Wrench, Rocket, Newspaper, ExternalLink, Loader2, ArrowLeft } from 'lucide-react';
import { fetchGitHubChangelog, timeAgo, type GitHubChangelogEntry } from '../lib/github';

type ChangelogTab = 'app' | 'github';

interface ChangelogVersion {
  version: string;
  date: string;
  changes: { type: 'feature' | 'fix' | 'improvement' | 'breaking'; text: string }[];
}

const CHANGELOG: ChangelogVersion[] = [
  {
    version: '1.0.7',
    date: 'March 2026',
    changes: [
      { type: 'fix', text: 'Restored CDN stylesheet loading in HTML preview, including Bootstrap and other external CSS links' },
      { type: 'fix', text: 'Rebuilt HTML preview styles from the source document so stylesheet links and inline styles render reliably again' },
      { type: 'fix', text: 'Added a safer external stylesheet fallback by inlining remote CDN CSS during HTML preview rendering' },
    ],
  },
  {
    version: '1.0.5-fix',
    date: 'March 2026',
    changes: [
      { type: 'fix', text: 'Added an optional interactive HTML preview mode that can run repository JavaScript inside a sandboxed iframe' },
      { type: 'fix', text: 'Improved packaged HTML preview support for @import, inline style URLs, srcset, and additional asset references' },
    ],
  },
  {
    version: '1.0.5',
    date: 'March 2026',
    changes: [
      { type: 'fix', text: 'Added updater fallback logic so builds on 1.0.4 can detect and install 1.0.4-fix releases' },
    ],
  },
  {
    version: '1.0.4-fix',
    date: 'March 2026',
    changes: [
      { type: 'fix', text: 'Fixed HTML preview in packaged builds by switching the preview iframe to a blob URL flow' },
      { type: 'fix', text: 'Adjusted regional flags to use native emoji on macOS and a built-in fallback on platforms with poor flag emoji support' },
      { type: 'improvement', text: 'Hardened HTML preview sanitization to avoid executing repository JavaScript inside the app' },
      { type: 'fix', text: 'Restored stylesheet loading in the packaged HTML preview after preserving document head and link tags during sanitization' },
    ],
  },
  {
    version: '1.0.3',
    date: 'March 2026',
    changes: [
      { type: 'fix', text: 'Fixed HTML preview so linked CSS, JavaScript, and relative assets render correctly in the app' },
      { type: 'fix', text: 'Fixed regional flags rendering on platforms without native flag emoji support, including Windows' },
    ],
  },
  {
    version: '1.0.2',
    date: 'March 2026',
    changes: [
      { type: 'fix', text: 'Fixed GitHub Changelog videos and embeds in the app WebView' },
      { type: 'fix', text: 'Prevented the login screen from flashing before restoring a saved session on startup' },
      { type: 'improvement', text: 'Aligned app version metadata across updater, settings, and outbound API requests' },
    ],
  },
  {
    version: '1.0.1',
    date: 'March 2026',
    changes: [
      { type: 'fix', text: 'Fixed macOS window dragging without relying on the resize border hit area' },
      { type: 'feature', text: 'Added in-app update banner when a newer version is available' },
      { type: 'feature', text: 'Added manual check, download, install, and restart update flow in Settings' },
      { type: 'improvement', text: 'Improved updater error handling when release metadata is missing or incomplete' },
    ],
  },
  {
    version: '1.0.0',
    date: 'March 2026',
    changes: [
      { type: 'feature', text: 'In-app file editor with commit & push' },
      { type: 'feature', text: 'Image preview in file browser (PNG, JPG, GIF, SVG, WebP)' },
      { type: 'feature', text: 'Markdown preview toggle in file viewer' },
      { type: 'feature', text: 'Create new files directly from the app' },
      { type: 'feature', text: 'Delete files with commit' },
      { type: 'feature', text: 'GitHub Changelog with full content, images & videos in-app' },
      { type: 'feature', text: 'Branch creation support' },
      { type: 'improvement', text: 'Multi-platform builds: macOS, Windows (x64/x86/ARM), Linux' },
      { type: 'improvement', text: 'Enhanced DOMPurify config for rich changelog content' },
    ],
  },
  {
    version: '0.1.0',
    date: 'March 2026',
    changes: [
      { type: 'feature', text: 'Initial release of NxtGit' },
      { type: 'feature', text: 'GitHub OAuth authentication' },
      { type: 'feature', text: 'Repository browsing with file viewer and syntax highlighting' },
      { type: 'feature', text: 'Issues and Pull Requests management' },
      { type: 'feature', text: 'AI-powered code review with multiple providers' },
      { type: 'feature', text: 'Chat with AI about your codebase' },
      { type: 'feature', text: 'GitHub Status monitoring with regional breakdown' },
      { type: 'feature', text: 'GitHub Actions workflow runs viewer' },
      { type: 'feature', text: 'Global search for repositories and users' },
      { type: 'feature', text: 'User profile pages' },
      { type: 'feature', text: 'Liquid Glass UI design on macOS' },
      { type: 'feature', text: 'Dark and light mode support' },
      { type: 'improvement', text: 'GitHub Copilot integration via device flow' },
      { type: 'improvement', text: 'Support for OpenRouter, Anthropic, OpenAI, and Ollama' },
    ],
  },
];

function changeIcon(type: string) {
  switch (type) {
    case 'feature': return <Sparkles className="w-3 h-3" style={{ color: 'var(--accent)' }} />;
    case 'fix': return <Bug className="w-3 h-3" style={{ color: 'var(--error)' }} />;
    case 'improvement': return <Wrench className="w-3 h-3" style={{ color: 'var(--warning)' }} />;
    case 'breaking': return <Rocket className="w-3 h-3" style={{ color: 'var(--error)' }} />;
    default: return <Sparkles className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />;
  }
}

function changeColor(type: string): string {
  switch (type) {
    case 'feature': return 'var(--accent)';
    case 'fix': return 'var(--error)';
    case 'improvement': return 'var(--warning)';
    case 'breaking': return 'var(--error)';
    default: return 'var(--text-tertiary)';
  }
}

const AppChangelog: React.FC = () => {
  const [tab, setTab] = useState<ChangelogTab>('app');
  const [ghChangelog, setGhChangelog] = useState<GitHubChangelogEntry[]>([]);
  const [ghLoading, setGhLoading] = useState(false);
  const [ghLoaded, setGhLoaded] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<GitHubChangelogEntry | null>(null);

  useEffect(() => {
    if (tab === 'github' && !ghLoaded) {
      setGhLoading(true);
      fetchGitHubChangelog()
        .then(setGhChangelog)
        .catch(() => {})
        .finally(() => { setGhLoading(false); setGhLoaded(true); });
    }
  }, [tab, ghLoaded]);

  return (
    <div className="p-6 w-full">
      <header className="mb-6">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Changelog
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          What's new
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-0 border-b mb-6" style={{ borderColor: 'var(--border)' }}>
        <button onClick={() => setTab('app')}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
          style={{
            borderColor: tab === 'app' ? 'var(--accent)' : 'transparent',
            color: tab === 'app' ? 'var(--text-primary)' : 'var(--text-secondary)',
          }}>
          <Sparkles className="w-3.5 h-3.5" /> NxtGit
        </button>
        <button onClick={() => setTab('github')}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
          style={{
            borderColor: tab === 'github' ? 'var(--accent)' : 'transparent',
            color: tab === 'github' ? 'var(--text-primary)' : 'var(--text-secondary)',
          }}>
          <Newspaper className="w-3.5 h-3.5" /> GitHub Changelog
        </button>
      </div>

      {tab === 'app' && (
        <div className="space-y-6">
          {CHANGELOG.map(release => (
            <div key={release.version}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(0, 122, 255, 0.1)', color: 'var(--accent)' }}>
                  v{release.version}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {release.date}
                </span>
              </div>
              <div className="border rounded-lg divide-y"
                   style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
                {release.changes.map((change, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                         style={{ background: `${changeColor(change.type)}15` }}>
                      {changeIcon(change.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                        {change.text}
                      </span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 capitalize"
                          style={{ background: `${changeColor(change.type)}12`, color: changeColor(change.type) }}>
                      {change.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'github' && (
        <div>
          {selectedEntry ? (
            <div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="flex items-center gap-1.5 text-sm mb-4 hover:opacity-80 transition-opacity"
                style={{ color: 'var(--accent)' }}>
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="border rounded-lg p-5" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
                <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {selectedEntry.title}
                </h2>
                <div className="flex items-center gap-3 mb-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {selectedEntry.pubDate && <span>{timeAgo(new Date(selectedEntry.pubDate).toISOString())}</span>}
                  <a href={selectedEntry.link} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                     style={{ color: 'var(--accent)' }}>
                    Open on GitHub <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div
                  className="changelog-content"
                  style={{ color: 'var(--text-primary)' }}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedEntry.contentHtml, {
                    ADD_TAGS: ['iframe', 'video', 'source', 'picture', 'figure', 'figcaption'],
                    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'srcset', 'sizes', 'media', 'type', 'autoplay', 'controls', 'muted', 'loop', 'poster', 'width', 'height', 'loading', 'style'],
                  }) }}
                />
              </div>
            </div>
          ) : ghLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-tertiary)' }} />
            </div>
          ) : ghChangelog.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Failed to load GitHub changelog.
            </p>
          ) : (
            <div className="border rounded-lg divide-y"
                 style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
              {ghChangelog.map((entry, i) => (
                <button key={i}
                   onClick={() => setSelectedEntry(entry)}
                   className="block w-full text-left px-4 py-3 hover:bg-[var(--bg-tertiary)] transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                         style={{ background: 'rgba(0,122,255,0.1)' }}>
                      <Newspaper className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {entry.title}
                      </p>
                      {entry.description && (
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                          {DOMPurify.sanitize(entry.description, { ALLOWED_TAGS: [] }).substring(0, 200)}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {entry.pubDate && <span>{timeAgo(new Date(entry.pubDate).toISOString())}</span>}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AppChangelog;
