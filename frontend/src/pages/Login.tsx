import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import axios from 'axios';

interface LoginProps {
  onLogin: (defaultPasswordChanged: boolean) => void;
  onChangePassword: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.addEventListener('ended', () => {
        video.currentTime = 0;
        video.play();
      });
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, {
        username,
        password,
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('username', username);

      const userResponse = await axios.get(`${import.meta.env.VITE_API_URL}/auth/user`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      const defaultpasswordchanged = userResponse.data.defaultpasswordchanged;
      const loggedInUsername = localStorage.getItem('username');

      if (loggedInUsername === 'admin') {
        onLogin(true);
      } else if (defaultpasswordchanged === undefined) {
        onLogin(false);
      } else {
        const defaultPasswordChanged = defaultpasswordchanged === 'true';
        if (defaultPasswordChanged) {
          onLogin(true);
        } else {
          onLogin(false);
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Invalid username or password';
      setError(errorMessage);
      if (error.response?.data?.remainingAttempts !== undefined) {
        setRemainingAttempts(error.response.data.remainingAttempts);
      } else if (errorMessage === 'Contact admin. Your account has been locked') {
        setRemainingAttempts(0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="w-full md:w-1/2 flex items-center justify-center px-10 py-16 bg-gradient-to-br from-red-700 to-red-400 animate-infinite-flow">
        <div className="w-full max-w-md space-y-8 text-white">
          <div className="text-center">
            <h2 className="text-5xl font-bold animate-pulse">Welcome</h2>
            <p className="text-sm text-white/80 mt-2">Please login to your account</p>
          </div>

          {error && (
            <div className="bg-white bg-opacity-10 text-red-200 p-3 rounded-lg flex flex-col gap-1 animate-fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
              {remainingAttempts === 0 && (
                <span className="text-xs">Please contact admin to unlock your account.</span>
              )}
            </div>
          )}

          <div className="bg-white bg-opacity-20 p-6 rounded-lg shadow-lg animate-slide-up">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-white">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  disabled={isLoading || remainingAttempts === 0}
                  className="w-full p-3 mt-1 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-md focus:ring-2 focus:ring-white focus:outline-none text-white placeholder-white/70"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-white">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  disabled={isLoading || remainingAttempts === 0}
                  className="w-full p-3 mt-1 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-md focus:ring-2 focus:ring-white focus:outline-none text-white placeholder-white/70"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || remainingAttempts === 0}
                className="w-full py-2 bg-white text-red-600 hover:bg-red-100 rounded-md transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-white">
        <div className="absolute inset-0 flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            loop
            className="h-full w-full object-contain"
          >
            <source 
              src="/images/Takumi-Motion-Controls-Logo-Animation-1.mp4" 
              type="video/mp4" 
            />
            Your browser does not support the video tag.
          </video>
        </div>
        <div className="absolute bottom-10 left-0 right-0 text-center text-gray-800 text-xl font-semibold">
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 1s ease-in-out;
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slideUp 0.5s ease-out;
        }
        @keyframes infiniteFlow {
          0% { background-position: 0% 0%; }
          25% { background-position: 50% 50%; }
          50% { background-position: 100% 100%; }
          75% { background-position: 50% 50%; }
          100% { background-position: 0% 0%; }
        }
        .animate-infinite-flow {
          animation: infiniteFlow 10s linear infinite;
          background-size: 200% 200%;
        }
      `}</style>
    </div>
  );
}
