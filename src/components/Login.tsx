import React, { useState } from 'react';
import { Github, Sparkles, Zap, Shield } from 'lucide-react';

const Login: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    // OAuth flow will be handled here
    // For now, open GitHub OAuth in browser
    const clientId = 'YOUR_GITHUB_CLIENT_ID';
    const redirectUri = 'http://localhost:1420/auth/callback';
    const scope = 'repo read:user read:org';
    
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
    
    window.open(authUrl, '_blank');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8"
         style={{ background: 'var(--bg-primary)' }}>
      <div className="glass-panel max-w-md w-full p-8 text-center">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
               style={{ 
                 background: 'linear-gradient(135deg, #007AFF, #5856D6)',
                 boxShadow: '0 8px 32px rgba(0, 122, 255, 0.3)'
               }}>
            <Github className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            NxtGit
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            AI-native Git client
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <Feature icon={Sparkles} text="AI-powered PR descriptions" />
          <Feature icon={Zap} text="Smart code reviews" />
          <Feature icon={Shield} text="Secure GitHub integration" />
        </div>

        <button
          onClick={handleGitHubLogin}
          disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-lg"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Github className="w-5 h-5" />
              Continue with GitHub
            </>
          )}
        </button>

        <p className="mt-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

interface FeatureProps {
  icon: React.ElementType;
  text: string;
}

const Feature: React.FC<FeatureProps> = ({ icon: Icon, text }) => (
  <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
       style={{ background: 'var(--bg-tertiary)' }}>
    <Icon className="w-5 h-5" style={{ color: 'var(--accent)' }} />
    <span style={{ color: 'var(--text-secondary)' }}>{text}</span>
  </div>
);

export default Login;
