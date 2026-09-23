import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { toast } from "react-toastify";
import { Eye, EyeOff, KeyRound, Phone, Sun, Moon } from "lucide-react";

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
        if (res.data.user.role === "admin") {
          navigate("/"); // Admin vào trang Thống kê số liệu
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
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 transition-colors duration-200">
      {/* Nút chuyển đổi Sáng / Tối ở góc trên bên phải */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 shadow-xs hover:shadow transition cursor-pointer"
        title="Chuyển đổi giao diện"
      >
        {darkMode ? (
          <Sun size={18} className="text-amber-400" />
        ) : (
          <Moon size={18} className="text-slate-600" />
        )}
      </button>

      {/* Form Đăng Nhập bự và căn giữa */}
      <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-2xl shadow-xl max-w-md w-full border border-slate-200 dark:border-slate-800 transition-colors duration-200">
        {/* Logo & Tiêu đề */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md shadow-emerald-500/20 text-2xl">
            🏸
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
            Quản Lý Sân Cầu Lông
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Đăng nhập vào hệ thống quản trị Admin
          </p>
        </div>

        {/* Form chính */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          {/* Ô số điện thoại */}
          <div>
            <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
              Số điện thoại
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Phone size={16} />
              </span>
              <input
                type="text"
                required
                placeholder="Nhập số điện thoại..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* Ô mật khẩu */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-medium text-slate-600 dark:text-slate-300">
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
                className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
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
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
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
            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-xl shadow-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Đăng Nhập"
            )}
          </button>
        </form>

        {/* Footer Phiên bản */}
        <div className="mt-8 text-center border-t border-slate-100 dark:border-slate-800 pt-4">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            Hệ thống quản lý sân cầu lông thông minh v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
