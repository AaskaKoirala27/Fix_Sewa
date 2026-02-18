import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ── Refresh interceptor ────────────────────────────────────────────────────────

let isRefreshing = false;
let refreshQueue: Array<(value: void) => void> = [];

function flushQueue() {
  refreshQueue.forEach(resolve => resolve());
  refreshQueue = [];
}

api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      if (original.url?.includes('/auth/refresh/') || original.url?.includes('/auth/login/')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise<void>(resolve => {
          refreshQueue.push(resolve);
        }).then(() => api(original));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        await axios.post(
          'http://localhost:8000/api/auth/refresh/',
          {},
          { withCredentials: true }
        );
        flushQueue();
        return api(original);
      } catch {
        refreshQueue = [];
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
