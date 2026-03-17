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
    version: '1.1.0',
    date: 'March 2026',
    changes: [
      { type: 'feature', text: 'Guided onboarding tour for first-time users — walks you through every section of the app. Replay it anytime from Settings.' },
      { type: 'feature', text: 'Built-in Help & Feedback page — submit bugs, feature requests, questions and feedback without leaving the app' },
      { type: 'feature', text: 'Thinking mode for AI chat — toggle extended reasoning on compatible models with Low, Medium and High depth levels' },
      { type: 'feature', text: 'Repository filters — filter by type (public, private, forks, archived, mirrors, templates), by language, and sort by last update, name or stars' },
      { type: 'feature', text: 'Keyboard shortcut hints — hold Cmd/Ctrl to reveal shortcuts next to each sidebar item' },
      { type: 'improvement', text: 'Global search now filters repos locally as you type, then enriches with the GitHub API in the background' },
      { type: 'improvement', text: 'Pages, cards, lists and dropdowns now animate in smoothly — all respecting the reduce-motion accessibility setting' },
      { type: 'improvement', text: 'Dropdowns on macOS Tahoe now get the Liquid Glass frosted look' },
      { type: 'improvement', text: 'Back button in the file browser now goes up one folder instead of jumping back to the repo list' },
      { type: 'improvement', text: 'OAuth flow no longer opens the browser automatically — a clear button lets you go when you\'re ready' },
      { type: 'improvement', text: 'Repo list now fetches all your repositories using full pagination instead of stopping at 50' },
      { type: 'fix', text: 'Links in release notes (like "Full Changelog") now open in your browser instead of getting stuck inside the app' },
      { type: 'fix', text: 'Markdown links in the file viewer also open externally now' },
    ],
  },
  {
    version: '1.0.9',
    date: 'March 2026',
    changes: [
      { type: 'fix', text: 'PR status now refreshes right after a merge — no more stale "Open" badge' },
      { type: 'improvement', text: 'Stale cached PR data is cleared after merging so the sidebar stays in sync' },
      { type: 'improvement', text: 'Merge errors now show human-readable messages for conflicts, blocked methods and branch protection' },
    ],
  },
  {
    version: '1.0.8',
    date: 'March 2026',
    changes: [
      { type: 'feature', text: 'Customizable keyboard shortcuts — remap every navigation shortcut from Settings' },
      { type: 'feature', text: 'Offline caching — repos, workflow runs, notifications and GitHub status work without internet' },
      { type: 'feature', text: 'GitHub Pages flow — create, open, rebuild and disable Pages right from the file browser' },
      { type: 'improvement', text: 'HTML preview shows the exact URL before opening it' },
    ],
  },
  {
    version: '1.0.8-fix',
    date: 'March 2026',
    changes: [
      { type: 'fix', text: 'Windows ARM64 now ships a proper native MSI and NSIS installer' },
      { type: 'fix', text: 'Release pipeline enforces both .msi/.exe on Windows ARM64 and .deb/.AppImage on Linux ARM64' },
      { type: 'fix', text: 'Updated quinn-proto to 0.11.14 to patch a published security advisory' },
    ],
  },
  {
    version: '1.0.5-fix',
    date: 'March 2026',
    changes: [
      { type: 'feature', text: 'Interactive HTML preview mode — optionally runs repo JavaScript in a sandboxed iframe' },
      { type: 'improvement', text: 'Better HTML preview support for @import, inline style URLs, srcset and asset references' },
    ],
  },
  {
    version: '1.0.5',
    date: 'March 2026',
    changes: [
      { type: 'fix', text: 'Updater fallback so v1.0.4 builds can detect and install patch releases' },
    ],
  },
  {
    version: '1.0.4-fix',
    date: 'March 2026',
    changes: [
      { type: 'fix', text: 'HTML preview works in packaged builds again (switched to blob URL)' },
      { type: 'fix', text: 'Regional flags use native emoji on macOS and a fallback on Windows' },
      { type: 'improvement', text: 'HTML preview sandboxed so repo JavaScript can\'t run inside the app' },
      { type: 'fix', text: 'Stylesheets load correctly again in HTML preview after sanitization changes' },
    ],
  },
  {
    version: '1.0.4',
    date: 'March 2026',
    changes: [
      { type: 'improvement', text: 'Hardened HTML preview sanitization — no more accidental script execution' },
    ],
  },
  {
    version: '1.0.3',
    date: 'March 2026',
    changes: [
      { type: 'fix', text: 'HTML preview now renders linked CSS, JS and relative assets correctly' },
      { type: 'fix', text: 'Regional flags display properly on Windows and other platforms' },
    ],
  },
  {
    version: '1.0.2',
    date: 'March 2026',
    changes: [
      { type: 'fix', text: 'GitHub Changelog videos and embeds now play in the app' },
      { type: 'fix', text: 'No more login screen flash when restoring a saved session' },
      { type: 'improvement', text: 'App version consistent everywhere — updater, settings, API requests' },
    ],
  },
  {
    version: '1.0.1',
    date: 'March 2026',
    changes: [
      { type: 'feature', text: 'In-app update banner when a new version is available' },
      { type: 'feature', text: 'Manual check, download, install and restart update flow in Settings' },
      { type: 'fix', text: 'macOS window dragging works properly again' },
      { type: 'improvement', text: 'Better error handling when release metadata is missing' },
    ],
  },
  {
    version: '1.0.0',
    date: 'March 2026',
    changes: [
      { type: 'feature', text: 'In-app file editor with commit & push' },
      { type: 'feature', text: 'Image preview in the file browser (PNG, JPG, GIF, SVG, WebP)' },
      { type: 'feature', text: 'Markdown preview toggle in the file viewer' },
      { type: 'feature', text: 'Create and delete files with commit directly from the app' },
      { type: 'feature', text: 'GitHub Changelog with full content, images & videos in-app' },
      { type: 'feature', text: 'Branch creation support' },
      { type: 'improvement', text: 'Multi-platform builds: macOS, Windows (x64/x86/ARM), Linux' },
    ],
  },
  {
    version: '0.1.0',
    date: 'March 2026',
    changes: [
      { type: 'feature', text: 'Initial release of NxtGit' },
      { type: 'feature', text: 'GitHub OAuth with device flow' },
      { type: 'feature', text: 'Repo browsing with file viewer and syntax highlighting' },
      { type: 'feature', text: 'Issues and Pull Requests management' },
      { type: 'feature', text: 'AI-powered code review (Copilot, OpenRouter, Anthropic, OpenAI, Ollama)' },
      { type: 'feature', text: 'Chat with AI about your code' },
      { type: 'feature', text: 'GitHub Status monitoring with regional breakdown' },
      { type: 'feature', text: 'Workflow runs viewer' },
      { type: 'feature', text: 'Global search for repos and users' },
      { type: 'feature', text: 'User profile pages' },
      { type: 'feature', text: 'Liquid Glass UI on macOS Tahoe' },
      { type: 'feature', text: 'Dark and light mode' },
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
