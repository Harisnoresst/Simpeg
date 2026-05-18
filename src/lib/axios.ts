import axios from 'axios';

const api = axios.create({
  // Sesuaikan port dengan port Laravel Anda (biasanya 8000)
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Otomatis menyisipkan Token ke setiap request jika user sudah login
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;