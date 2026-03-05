import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { AI_PROVIDERS } from '../lib/ai';

const AIReview: React.FC = () => {
  const [input, setInput] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(AI_PROVIDERS[0].id);
  const [result, setResult] = useState('');

  const handleReview = () => {
    if (!input.trim()) return;
    setReviewing(true);
    setResult('');
    // TODO: actual API call to selected provider
    setTimeout(() => {
      setResult('AI review functionality will be connected when API keys are configured in Settings.');
      setReviewing(false);
    }, 1500);
  };

  return (
    <div className="p-6 h-full flex flex-col max-w-5xl">
      <header className="mb-4">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>AI Code Review</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Paste code or a diff to get an AI-powered review
        </p>
      </header>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Input */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <select
              value={selectedProvider}
              onChange={e => setSelectedProvider(e.target.value)}
              className="input-glass py-1.5 px-3 text-sm w-auto"
            >
              {AI_PROVIDERS.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select className="input-glass py-1.5 px-3 text-sm w-auto">
              <option>JavaScript</option>
              <option>TypeScript</option>
              <option>Python</option>
              <option>Rust</option>
              <option>Go</option>
              <option>Java</option>
              <option>PHP</option>
              <option>C++</option>
            </select>
          </div>

          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="// Paste your code here..."
            className="flex-1 w-full p-4 rounded-lg font-mono text-sm resize-none outline-none border"
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border)',
            }}
          />

          <button
            onClick={handleReview}
            disabled={reviewing || !input.trim()}
            className="btn-primary mt-3 flex items-center justify-center gap-2 py-2.5 text-sm"
          >
            {reviewing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Review Code
              </>
            )}
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 border rounded-lg p-4 overflow-auto"
             style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
          <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
            Review Results
          </h3>

          {reviewing ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-tertiary)' }} />
            </div>
          ) : result ? (
            <div className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
              {result}
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Submit code to see review results here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIReview;
