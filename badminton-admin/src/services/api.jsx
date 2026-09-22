// badminton-admin/src/services/api.js
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Tự động gắn Token vào header của mọi request gửi đi
API.interceptors.request.use(
  (config) => {
    // Kiểm tra tất cả các tên key phổ biến có thể được dùng khi lưu token
    const token =
      localStorage.getItem("adminToken") ||
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default API;
