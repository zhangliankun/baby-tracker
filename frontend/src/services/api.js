import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// 请求拦截器 — 自动携带 JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器 — 统一错误处理
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        // token 无效，清除登录状态
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // 不是登录页的话跳转到登录页
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(data?.error || '请求失败');
    }
    if (error.code === 'ECONNABORTED') {
      return Promise.reject('请求超时，请检查网络');
    }
    return Promise.reject('网络错误，请检查网络连接');
  }
);

// --- Auth API ---
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

// --- Baby API ---
export const babyAPI = {
  get: () => api.get('/baby'),
  update: (data) => api.put('/baby', data),
};

// --- Records API ---
export const recordsAPI = {
  getByDate: (date) => api.get('/records', { params: { date } }),
  getByRange: (startDate, endDate) => api.get('/records', { params: { startDate, endDate } }),
  create: (data) => api.post('/records', data),
  update: (id, data) => api.put(`/records/${id}`, data),
  delete: (id) => api.delete(`/records/${id}`),
  deleteAll: (confirm = true) => api.delete('/records/all', { data: { confirm } }),
};

// --- Sleep Timer API ---
export const sleepTimerAPI = {
  start: () => api.post('/sleep-timer/start'),
  stop: () => api.post('/sleep-timer/stop'),
  status: () => api.get('/sleep-timer/status'),
};

// --- Statistics API ---
export const statisticsAPI = {
  get: (params) => api.get('/statistics', { params }),
};

// --- Export API ---
export const exportAPI = {
  get: () => api.get('/export'),
};

export default api;
