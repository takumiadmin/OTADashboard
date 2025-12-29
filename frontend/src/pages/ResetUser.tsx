import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import axios from 'axios';

export function ResetUser() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      console.log("📤 Sending reset user request:", { username });
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/admin/reset-user`, {
        userid: username,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage('User reset successfully');
      setUsername('');
      setTimeout(() => setMessage(''), 3000); // Clear message after 3 seconds
    } catch (error: any) {
      console.error("❌ Error resetting user:", error.response?.data || error.message);
      setError(error.response?.data?.message || 'Failed to reset user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md transform transition-all duration-300 hover:shadow-xl">
        <div className="flex items-center justify-center mb-6">
          <span className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0-1.1.9-2 2-2s2.9 1 2 2c-.9 1-2 2-2 2s-1.9-1-2-2z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 17c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z"></path>
            </svg>
          </span>
          <h1 className="text-2xl font-bold text-gray-800 ml-4">Reset User</h1>
        </div>

        <form onSubmit={handleResetUser} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {message}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Select user to reset</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
              placeholder="Enter username"
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Resetting...' : 'Reset User'}
          </button>
        </form>
      </div>
    </div>
  );
}
