import apiClient from './axios';

/**
 * Logs in the user, persists tokens and profile data to localStorage.
 */
export const loginUser = async ({ email, password }) => {
  const response = await apiClient.post('/auth/login/', { email, password });
  const { access, refresh, user } = response.data;

  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  }
  return response.data;
};

/**
 * Registers a new user account.
 */
export const registerUser = async ({ name, email, password }) => {
  const response = await apiClient.post('/auth/register/', {
    name,
    email,
    password,
  });
  return response.data;
};

/**
 * Clears authentication tokens and local user data.
 */
export const logoutUser = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

/**
 * Retrieves the currently logged-in user profile from localStorage.
 */
export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Checks whether an active access token exists.
 */
export const isAuthenticated = () => {
  return Boolean(localStorage.getItem('access_token'));
};
