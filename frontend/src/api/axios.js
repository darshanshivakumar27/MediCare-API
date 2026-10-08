import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach access token to outgoing requests
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 and refresh token lifecycle
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors or server not reachable
    if (!error.response) {
      return Promise.reject(new Error('Network error: Unable to connect to server.'));
    }

    const { status, config } = error.response;
    const isAuthRoute =
      config.url.includes('/auth/login/') ||
      config.url.includes('/auth/refresh/') ||
      config.url.includes('/auth/register/');

    if (status === 401 && !originalRequest._retry && !isAuthRoute) {
      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = refreshResponse.data.access;
        localStorage.setItem('access_token', newAccessToken);

        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Extracts a user-friendly error message from DRF error responses.
 */
export const extractErrorMessage = (error, fallback = 'An unexpected error occurred.') => {
  if (!error) return fallback;

  if (typeof error === 'string') return error;

  const data = error.response?.data;
  if (!data) {
    if (error.message) return error.message;
    return fallback;
  }

  // Common DRF formats
  if (typeof data === 'string') return data;

  if (data.detail && typeof data.detail === 'string') {
    return data.detail;
  }

  if (data.error && typeof data.error === 'string') {
    return data.error;
  }

  if (data.message && typeof data.message === 'string') {
    return data.message;
  }

  if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
    return data.non_field_errors.join(' ');
  }

  // If object of field errors: { email: ["Invalid email"], name: ["This field is required"] }
  if (typeof data === 'object') {
    const messages = [];
    for (const [key, val] of Object.entries(data)) {
      const fieldName = key.replace(/_/g, ' ');
      const capitalized = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
      if (Array.isArray(val)) {
        messages.push(`${capitalized}: ${val.join(' ')}`);
      } else if (typeof val === 'string') {
        messages.push(`${capitalized}: ${val}`);
      } else if (typeof val === 'object' && val !== null) {
        messages.push(`${capitalized}: ${JSON.stringify(val)}`);
      }
    }
    if (messages.length > 0) {
      return messages.join(' | ');
    }
  }

  return fallback;
};

export default apiClient;
