import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Bearer token if present
apiClient.interceptors.request.use(
  (config) => {
    const isSupportRoute =
      typeof window !== 'undefined' && window.location.pathname.startsWith('/support');
    const supportToken = localStorage.getItem('support_token');
    const defaultToken = localStorage.getItem('token');

    const token = isSupportRoute && supportToken ? supportToken : (defaultToken || supportToken);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: normalize error messages and clear stale tokens on 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (error.config?.headers?.Authorization) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }

    let message = 'An unexpected error occurred';
    if (Array.isArray(error.response?.data?.errors) && error.response.data.errors.length > 0) {
      const fieldList = error.response.data.errors
        .map((e: any) => `${e.field ? `${e.field}: ` : ''}${e.message}`)
        .join(', ');
      message = `Validation failed — ${fieldList}`;
      error.fieldErrors = error.response.data.errors.reduce((acc: Record<string, string>, curr: any) => {
        const key = curr.field ? curr.field.replace(/^(body|query|params)\./, '') : 'general';
        acc[key] = curr.message;
        return acc;
      }, {});
      error.errors = error.response.data.errors;
    } else if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.response?.data?.error) {
      message = error.response.data.error;
    } else if (error.message) {
      message = error.message;
    }

    error.friendlyMessage = message;
    return Promise.reject(error);
  }
);
