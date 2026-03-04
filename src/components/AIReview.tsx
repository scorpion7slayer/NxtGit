import React, { useState } from 'react';
import { Bot, Send, Code, AlertCircle, Lightbulb, CheckCircle } from 'lucide-react';

const AIReview: React.FC = () => {
  const [input, setInput] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const handleReview = () => {
    if (!input.trim()) return;
    setReviewing(true);
    // AI review logic here
    setTimeout(() => setReviewing(false), 3000);
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #007AFF, #5856D6)' }}>
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              AI Code Review
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Get intelligent code reviews powered by OpenRouter
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Input Panel */}
        <div className="flex-1 flex flex-col">
          <div className="glass-panel flex-1 flex flex-col p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Paste your code or diff
              </span>
              <select className="input-glass py-1 px-3 text-sm w-auto">
                <option>JavaScript</option>
                <option>TypeScript</option>
                <option>Python</option>
                <option>Rust</option>
                <option>PHP</option>
              </select>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="// Paste your code here..."
              className="flex-1 w-full p-4 rounded-xl font-mono text-sm resize-none outline-none"
              style={{ 
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid transparent'
              }}
            />
            <button
              onClick={handleReview}
              disabled={reviewing || !input.trim()}
              className="btn-primary mt-4 flex items-center justify-center gap-2 py-3"
            >
              {reviewing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Get AI Review
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="flex-1 glass-panel p-6 overflow-auto">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Review Results
          </h3>
          
          {reviewing ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Bot className="w-12 h-12 mx-auto mb-4 animate-pulse" style={{ color: 'var(--accent)' }} />
                <p style={{ color: 'var(--text-secondary)' }}>Analyzing your code...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <ReviewItem 
                type="suggestion"
                title="Consider using async/await"
                description="The callback pattern can be replaced with async/await for better readability and error handling."
                line={42}
              />
              <ReviewItem 
                type="issue"
                title="Potential memory leak"
                description="Event listener is added but never removed. Consider using useEffect cleanup."
                line={28}
              />
              <ReviewItem 
                type="praise"
                title="Good use of TypeScript"
                description="Proper type definitions improve code maintainability."
                line={15}
              />
              <ReviewItem 
                type="suggestion"
                title="Add error boundary"
                description="Consider wrapping async operations in try-catch blocks."
                line={56}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ReviewItemProps {
  type: 'suggestion' | 'issue' | 'praise';
  title: string;
  description: string;
  line: number;
}

const ReviewItem: React.FC<ReviewItemProps> = ({ type, title, description, line }) => {
  const config = {
    suggestion: { icon: Lightbulb, color: '#FF9500', bg: '#FF950020' },
    issue: { icon: AlertCircle, color: '#FF3B30', bg: '#FF3B3020' },
    praise: { icon: CheckCircle, color: '#34C759', bg: '#34C75920' }
  };

  const Icon = config[type].icon;

  return (
    <div className="p-4 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
             style={{ background: config[type].bg }}>
          <Icon className="w-4 h-4" style={{ color: config[type].color }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h4>
            <span className="text-xs px-2 py-0.5 rounded"
                  style={{ 
                    background: config[type].bg,
                    color: config[type].color
                  }}>
              Line {line}
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIReview;
