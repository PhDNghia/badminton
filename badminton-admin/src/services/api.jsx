// badminton-admin/src/services/api.js
import axios from "axios";
import { toast } from "react-toastify"; // Import thêm toast để hiện thông báo

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// 1. Interceptor Request: Tự động gắn Token vào header
API.interceptors.request.use(
  (config) => {
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

// 2. Interceptor Response: Bắt lỗi 401 để thông báo và tự động đăng xuất
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Nếu lỗi trả về là 401 (Unauthorized) do hết hạn hoặc sai Token
    if (error.response && error.response.status === 401) {
      // Xóa toàn bộ token và thông tin user hiện tại
      localStorage.removeItem("adminToken");
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("adminUser");

      // Bắn thông báo Toast màu cam/đỏ báo hiệu hết hạn
      toast.warning("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!");

      // Đợi 1.5 giây để người dùng kịp đọc thông báo rồi mới đẩy ra trang login
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    }
    return Promise.reject(error);
  },
);

export default API;
