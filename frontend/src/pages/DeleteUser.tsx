import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import axios from 'axios';

export function DeleteUser() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      console.log("📤 Sending delete user request:", { username });
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/admin/delete-user`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { userid: username },
      });

      setMessage('User deleted successfully');
      setUsername('');
      setTimeout(() => setMessage(''), 3000); // Clear message after 3 seconds
    } catch (error: any) {
      console.error("❌ Error deleting user:", error.response?.data || error.message);
      setError(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md transform transition-all duration-300 hover:shadow-xl">
        <div className="flex items-center justify-center mb-6">
          <span className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </span>
          <h1 className="text-2xl font-bold text-gray-800 ml-4">Delete User</h1>
        </div>

        <form onSubmit={handleDeleteUser} className="space-y-4">
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
            <label className="text-sm font-medium text-gray-700">Select user to delete</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              placeholder="Enter username"
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete User'}
          </button>
        </form>
      </div>
    </div>
  );
}
