// badminton-admin/src/pages/LoginView.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { toast } from "react-toastify";
import {
  Eye,
  EyeOff,
  KeyRound,
  Phone,
  Sun,
  Moon,
  ShieldCheck,
} from "lucide-react";

export default function LoginView() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setDarkMode(true);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post("/auth/login", { phone, password });
      if (res.data.success) {
        if (res.data.user.role === "user") {
          toast.error("Bạn không có quyền truy cập trang quản trị!");
          setLoading(false);
          return;
        }

        localStorage.setItem("adminToken", res.data.token);
        localStorage.setItem("adminUser", JSON.stringify(res.data.user));

        toast.success("Đăng nhập thành công!");
        navigate("/");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Đăng nhập thất bại, kiểm tra lại tài khoản!",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 transition-colors duration-200">
      {/* Nút chuyển đổi Sáng / Tối ở góc trên bên phải */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 shadow-sm hover:shadow transition cursor-pointer"
        title="Chuyển đổi giao diện"
      >
        {darkMode ? (
          <Sun size={20} className="text-amber-400" />
        ) : (
          <Moon size={20} className="text-slate-600" />
        )}
      </button>

      {/* Form Đăng Nhập bự và căn giữa */}
      <div className="bg-white dark:bg-slate-900 p-10 sm:p-12 rounded-[32px] shadow-2xl max-w-lg w-full border border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
        {/* Logo & Tiêu đề */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-violet-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30 text-2xl">
            🏸
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            Quản Lý Sân Cầu Lông
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-400 mt-2">
            Đăng nhập vào hệ thống quản trị Admin
          </p>
        </div>

        {/* Form chính */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Ô số điện thoại */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
              Số điện thoại
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Phone size={18} />
              </span>
              <input
                type="text"
                required
                placeholder="Nhập số điện thoại..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          {/* Ô mật khẩu */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Mật khẩu
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  toast.info(
                    "Vui lòng liên hệ Quản trị viên cấp cao để khôi phục mật khẩu!",
                  );
                }}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Quên mật khẩu?
              </a>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <KeyRound size={18} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Nút Đăng Nhập */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold py-3.5 px-4 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Đăng Nhập"
            )}
          </button>
        </form>

        {/* Footer Phiên bản */}
        <div className="mt-8 text-center border-t border-slate-100 dark:border-slate-800/80 pt-5">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Hệ thống quản lý sân cầu lông thông minh v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
