import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function HomeView() {
  const navigate = useNavigate();
  const [courts, setCourts] = useState([]);
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

  useEffect(() => {
    API.get("/courts")
      .then((res) => {
        if (res.data.success) {
          setCourts(res.data.data);
        }
      })
      .catch((err) => console.error("Lỗi tải danh sách sân:", err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white flex flex-col justify-between transition-colors duration-300">
      <div>
        {/* Header */}
        <header className="bg-green-700 dark:bg-green-900 p-4 px-6 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏸</span>
            <h1 className="text-xl font-bold tracking-wide text-white">
              Sân Cầu Lông TONO
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition shadow cursor-pointer"
            >
              {darkMode ? "☀️ Sáng" : "🌙 Tối"}
            </button>
            <button
              onClick={() => navigate("/login")}
              className="bg-white text-green-800 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 transition shadow cursor-pointer"
            >
              Đăng nhập / Đăng ký
            </button>
          </div>
        </header>

        {/* Banner Chính */}
        <div className="relative bg-green-600 dark:bg-green-800 py-16 px-6 text-center shadow-lg text-white">
          <div className="max-w-3xl mx-auto space-y-4">
            <span className="bg-amber-400 text-gray-950 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow">
              Hệ thống đặt sân chuẩn thi đấu
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight">
              Đặt Lịch Nhanh Chóng - Tiện Lợi
            </h2>
            <p className="text-gray-100 text-sm max-w-xl mx-auto">
              Không cần tài khoản rườm rà! Chỉ cần nhập Tên và Số điện thoại là
              có thể đặt sân ngay lập tức.
            </p>
            <div className="pt-4">
              <button
                onClick={() => navigate("/booking")}
                className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold px-8 py-3.5 rounded-xl text-base shadow-xl transition transform hover:scale-105 cursor-pointer"
              >
                🏸 ĐẶT LỊCH NGAY
              </button>
            </div>
          </div>
        </div>

        {/* Danh Sách Sân Tại Cụm */}
        <div className="max-w-6xl mx-auto p-6 my-8">
          <h3 className="text-2xl font-bold mb-6 text-green-600 dark:text-green-400 border-b border-gray-200 dark:border-gray-800 pb-2">
            Danh Sách Sân Tại Cụm
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courts.map((court) => (
              <div
                key={court._id}
                className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-md flex flex-col justify-between hover:border-green-500 transition"
              >
                <div>
                  <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                    {court.name}
                  </h4>
                  <p className="text-xs text-green-600 dark:text-green-400 mb-3">
                    {court.type || "Sân tiêu chuẩn"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Trạng thái:{" "}
                    <span className="text-green-600 dark:text-green-400 font-semibold">
                      Đang hoạt động
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => navigate("/booking")}
                  className="mt-6 w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-semibold text-sm transition shadow cursor-pointer"
                >
                  Chọn Sân Này
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 py-8 px-6 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div>
            <h4 className="text-gray-900 dark:text-white font-bold text-base mb-1 flex items-center justify-center md:justify-start gap-2">
              <span>🏸</span> Sân Cầu Lông TONO
            </h4>
            <p className="text-xs text-gray-500">
              Hệ thống quản lý và đặt sân cầu lông chuyên nghiệp, nhanh chóng.
            </p>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>📍 Địa chỉ: Quận 1, TP. Hồ Chí Minh</p>
            <p>📞 Hotline đặt sân: 0909.123.456</p>
            <p>© 2026 TONO Badminton. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
