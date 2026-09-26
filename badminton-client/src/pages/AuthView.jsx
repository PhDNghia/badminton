import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { toast } from "react-toastify";

export default function AuthView() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") !== "light";
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const res = await API.post("/auth/login", {
          phone: formData.phone,
          password: formData.password,
        });
        if (res.data.success) {
          localStorage.setItem("token", res.data.token);
          toast.success("Đăng nhập thành công!");
          navigate("/");
        }
      } else {
        const res = await API.post("/auth/register", {
          name: formData.name,
          phone: formData.phone,
          password: formData.password,
        });
        if (res.data.success) {
          toast.success("Đăng ký thành công! Đã tự động đăng nhập.");
          localStorage.setItem("token", res.data.token);
          navigate("/");
        }
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại!",
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white flex flex-col justify-center items-center p-4 transition-colors duration-300">
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-bold transition shadow"
        >
          {darkMode ? "☀️ Sáng" : "🌙 Tối"}
        </button>
      </div>

      <div className="max-w-md w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <span className="text-4xl">🏸</span>
          <h1 className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
            Sân Cầu Lông TONO
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isLogin
              ? "Đăng nhập để quản lý lịch đặt sân của bạn"
              : "Đăng ký tài khoản để tích điểm và nhận ưu đãi"}
          </p>
        </div>

        <div className="flex bg-gray-100 dark:bg-gray-950 p-1 rounded-xl border border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
              isLogin
                ? "bg-green-600 text-white shadow"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
              !isLogin
                ? "bg-green-600 text-white shadow"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Đăng Ký
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                Họ và tên *
              </label>
              <input
                type="text"
                required
                placeholder="Nhập họ tên của bạn"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl p-3 text-sm text-gray-900 dark:text-white outline-none focus:border-green-500 transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Số điện thoại *
            </label>
            <input
              type="text"
              required
              placeholder="Nhập số điện thoại đăng nhập"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl p-3 text-sm text-gray-900 dark:text-white outline-none focus:border-green-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Mật khẩu *
            </label>
            <input
              type="password"
              required
              placeholder="Nhập mật khẩu của bạn"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl p-3 text-sm text-gray-900 dark:text-white outline-none focus:border-green-500 transition"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold py-3 rounded-xl text-sm shadow-lg transition transform hover:scale-[1.02] cursor-pointer"
          >
            {isLogin ? "ĐĂNG NHẬP" : "ĐĂNG KÝ TÀI KHOẢN"}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={() => navigate("/")}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition cursor-pointer"
          >
            ← Quay về trang chủ (Đặt lịch vãng lai)
          </button>
        </div>
      </div>
    </div>
  );
}
