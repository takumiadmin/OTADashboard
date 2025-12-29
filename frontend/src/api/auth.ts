import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const login = async (username: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      username,
      password
    });
    return response.data;
  } catch (error) {
    throw new Error('Invalid credentials');
  }
};

export const changePassword = async (username: string, currentPassword: string, newPassword: string) => {
  try {
    const response = await axios.post(`${API_URL}/users/change-password`, {
      username,
      currentPassword,
      newPassword
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to change password');
  }
};