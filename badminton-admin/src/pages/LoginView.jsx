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
  const [phone, setPhone] = useState("0767376931");
  const [password, setPassword] = useState("0767376931");

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
        if (res.data.user.role === "admin") {
          navigate("/");
        } else if (res.data.user.role === "staff") {
          navigate("/bookings");
        }
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
    <div className="relative min-h-screen bg-slate-900 dark:bg-slate-950 flex items-center justify-center p-6 transition-colors duration-300 overflow-hidden">
      {/* Hiệu ứng nền trang trí ánh sáng mờ */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Nút chuyển đổi Sáng / Tối */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 rounded-2xl bg-white/10 dark:bg-slate-900/80 backdrop-blur-md border border-white/10 dark:border-slate-800 text-slate-200 dark:text-slate-300 shadow-lg hover:scale-105 transition cursor-pointer"
        title="Chuyển đổi giao diện"
      >
        {darkMode ? (
          <Sun size={18} className="text-amber-400" />
        ) : (
          <Moon size={18} className="text-blue-400" />
        )}
      </button>

      {/* Card Đăng Nhập */}
      <div className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl max-w-md w-full border border-slate-200/80 dark:border-slate-800 transition-all duration-300">
        {/* Phần Logo & Tiêu đề được thiết kế lại bắt mắt hơn */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25 text-2xl">
            🏸
          </div>
          <p className="text-xs font-semibold tracking-wider text-blue-600 dark:text-blue-400 uppercase mb-1">
            Hệ Thống Quản Lý Sân Cầu Lông
          </p>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            TONO BADMINTON
          </h1>
        </div>

        {/* Form chính */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          {/* Ô số điện thoại */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Số điện thoại
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Phone size={16} />
              </span>
              <input
                type="text"
                required
                placeholder="Nhập số điện thoại của bạn..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Ô mật khẩu */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
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
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Quên mật khẩu?
              </a>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <KeyRound size={16} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Nút Đăng Nhập */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Đăng Nhập Quản Trị"
            )}
          </button>
        </form>

        {/* Footer Phiên bản */}
        <div className="mt-8 text-center border-t border-slate-100 dark:border-slate-800 pt-4">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            Tono Badminton Management v1.4.0 • Secured Portal
          </p>
        </div>
      </div>
    </div>
  );
}
