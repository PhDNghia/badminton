// badminton-admin/src/components/AdminLayout.jsx
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Grid,
  Users,
  LogOut,
  Sun,
  Moon,
  Calendar,
  ShoppingBasket,
  ShoppingCart,
  Receipt,
  KeyRound,
  Info,
  Settings,
  ShieldCheck,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import API from "../services/api";
import { toast } from "react-toastify";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [darkMode, setDarkMode] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // States quản lý ẩn/hiện mật khẩu cho 3 input trong modal đổi mật khẩu
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const menuRef = useRef(null);

  const adminUser = JSON.parse(localStorage.getItem("adminUser")) || {
    name: "Quản Trị Viên",
    role: "Admin",
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/login");
  };

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Xác nhận mật khẩu mới không khớp!");
      return;
    }

    // Lấy ID từ adminUser đang lưu trong localStorage
    const adminUser = JSON.parse(localStorage.getItem("adminUser")) || {};
    const userId = adminUser._id || adminUser.id;

    if (!userId) {
      toast.error(
        "Không tìm thấy thông tin tài khoản, vui lòng đăng nhập lại!",
      );
      return;
    }

    try {
      const response = await API.put("/users/change-password", {
        userId, // Gửi kèm userId này lên server
        oldPassword,
        newPassword,
      });

      if (response.data.success) {
        toast.success(response.data.message || "Đổi mật khẩu thành công!");
        setShowChangePasswordModal(false);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message ||
          "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ!",
      );
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Sidebar bên trái: Cố định chiều cao màn hình, chữ to rõ, không có thanh cuộn */}
      <aside className="w-64 h-screen sticky top-0 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 flex flex-col p-4 shadow-xl border-r border-slate-200 dark:border-slate-800 transition-colors duration-200 select-none overflow-hidden">
        {/* 1. Logo / Tiêu đề */}
        <div className="text-lg font-bold text-slate-800 dark:text-white mb-4 px-2 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            🏸 <span className="tracking-wide">Admin Portal</span>
          </div>
        </div>

        {/* 2. Danh sách menu chính */}
        <nav className="space-y-4 flex-1 overflow-y-auto pr-0.5 [&::-webkit-scrollbar]:w-0">
          <div>
            <div className="px-3 mb-1.5 text-xs font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              Tổng Quan
            </div>
            <Link
              to="/"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition text-sm ${
                location.pathname === "/"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <LayoutDashboard size={19} />
              <span>Thống Kê Số Liệu</span>
            </Link>
          </div>

          <div>
            <div className="px-3 mb-1.5 text-xs font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              Quản Lý Chung
            </div>
            <div className="space-y-1">
              <Link
                to="/courts"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition text-sm ${
                  location.pathname === "/courts"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Grid size={19} />
                <span>Quản Lý Sân</span>
              </Link>

              <Link
                to="/users"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition text-sm ${
                  location.pathname === "/users"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Users size={19} />
                <span>Quản Lý Người Dùng</span>
              </Link>

              <Link
                to="/products"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition text-sm ${
                  location.pathname === "/products"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <ShoppingBasket size={19} />
                <span>Quản Lý Sản Phẩm</span>
              </Link>
            </div>
          </div>

          <div>
            <div className="px-3 mb-1.5 text-xs font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              Giao Dịch & Vận Hành
            </div>
            <div className="space-y-1">
              <Link
                to="/bookings"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition text-sm ${
                  location.pathname === "/bookings"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Calendar size={19} />
                <span>Quản Lý Đặt Lịch</span>
              </Link>

              <Link
                to="/billings"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition text-sm ${
                  location.pathname === "/billings"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <ShoppingCart size={19} />
                <span>Quản Lý Hóa Đơn</span>
              </Link>

              <Link
                to="/payments"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition text-sm ${
                  location.pathname === "/payments"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Receipt size={19} />
                <span>Lịch Sử Thanh Toán</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* 3. Phần dưới cùng: Thông tin user & Popup cài đặt cá nhân */}
        <div
          className="relative pt-3 border-t border-slate-200 dark:border-slate-800 flex-shrink-0 mt-2"
          ref={menuRef}
        >
          {showUserMenu && (
            <div className="absolute bottom-16 left-0 w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Cài Đặt Cá Nhân
                </p>
                <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                  {adminUser.name}
                </p>
              </div>

              <div className="space-y-1 text-sm">
                <div
                  className="flex items-center justify-between px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  onClick={toggleTheme}
                >
                  <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200">
                    <Sun size={17} className="text-amber-500" />
                    <span>Giao diện</span>
                  </div>
                  <div
                    className={`w-9 h-5 flex items-center rounded-full p-0.5 transition duration-300 ${darkMode ? "bg-blue-600 justify-end" : "bg-slate-300 justify-start"}`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300"></div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowChangePasswordModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-slate-700 dark:text-slate-200 text-left cursor-pointer"
                >
                  <KeyRound size={17} className="text-blue-500" />
                  <span>Đổi mật khẩu</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowVersionModal(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Info size={17} className="text-slate-400" />
                    <span>Phiên bản</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 font-mono rounded">
                    v1.4.0
                  </span>
                </button>
              </div>

              <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition font-medium cursor-pointer text-sm"
                >
                  <LogOut size={17} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}

          <div
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer border border-slate-200/60 dark:border-slate-700/60 shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-md flex-shrink-0">
                {adminUser.name ? adminUser.name.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                  {adminUser.name}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                  <ShieldCheck size={13} /> {adminUser.role || "Admin"}
                </p>
              </div>
            </div>
            <Settings
              size={17}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            />
          </div>
        </div>
      </aside>

      {/* Phần nội dung chính bên phải */}
      <main className="flex-1 p-8 overflow-y-auto bg-slate-50 dark:bg-slate-950">
        <Outlet />
      </main>

      {/* Modal Đổi Mật Khẩu (Có icon con mắt ẩn/hiện mật khẩu cho cả 3 input) */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <KeyRound className="text-blue-500" size={20} /> Đổi Mật Khẩu
              </h3>
              <button
                onClick={() => setShowChangePasswordModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={handlePasswordChangeSubmit}
              className="p-6 space-y-4"
            >
              {/* Mật khẩu cũ */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Mật khẩu cũ
                </label>
                <div className="relative">
                  <input
                    type={showOldPass ? "text" : "password"}
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showOldPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Mật khẩu mới */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập mật khẩu mới"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Xác nhận mật khẩu mới */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập lại mật khẩu mới"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Thông Tin Phiên Bản */}
      {showVersionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm text-center p-6">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              🏸
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              Badminton Admin Portal
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Hệ thống quản lý sân cầu lông chuyên nghiệp
            </p>
            <div className="my-4 py-2 px-3 bg-slate-100 dark:bg-slate-800 rounded-xl inline-block font-mono text-sm text-blue-600 dark:text-blue-400 font-semibold">
              Phiên bản v1.4.0
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Đã tích hợp icon hiển thị mật khẩu tiện ích.
            </p>
            <button
              onClick={() => setShowVersionModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-medium text-sm cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
