import { useState, useEffect } from "react";
import API from "../services/api";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  RotateCcw,
  AlertTriangle,
  Shield,
  User,
} from "lucide-react";
import { toast } from "react-toastify";

export default function UsersManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const fetchUsers = async () => {
    try {
      const res = await API.get("/users");
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách user:", error);
      toast.error("Không thể tải danh sách người dùng!");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post("/users", { name, phone, password, role });
      if (res.data.success) {
        toast.success("Thêm tài khoản thành công!");
        setName("");
        setPhone("");
        setPassword("");
        setRole("user");
        setShowAddForm(false);
        fetchUsers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi thêm tài khoản!");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await API.put(`/users/${userId}/role`, { role: newRole });
      if (res.data.success) {
        toast.success("Đã cập nhật phân quyền thành công!");
        fetchUsers();
      }
    } catch (error) {
      toast.error("Lỗi khi cập nhật quyền!");
    }
  };

  const confirmDeleteUser = (userId) => {
    setConfirmModal({
      show: true,
      title: "Xác nhận xóa tài khoản",
      message:
        "Bạn có chắc chắn muốn xóa tài khoản này không? Hành động này không thể hoàn tác.",
      onConfirm: async () => {
        try {
          const res = await API.delete(`/users/${userId}`);
          if (res.data.success) {
            toast.success("Đã xóa tài khoản thành công!");
            fetchUsers();
          }
        } catch (error) {
          toast.error("Lỗi khi xóa tài khoản!");
        }
        setConfirmModal({
          show: false,
          title: "",
          message: "",
          onConfirm: null,
        });
      },
    });
  };

  const startEdit = (user) => {
    setEditingId(user._id);
    setEditName(user.name || "");
    setEditPhone(user.phone || "");
  };

  const handleUpdateUser = async (userId) => {
    try {
      const res = await API.put(`/users/${userId}`, {
        name: editName,
        phone: editPhone,
      });
      if (res.data.success) {
        toast.success("Cập nhật thông tin thành công!");
        setEditingId(null);
        fetchUsers();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Lỗi khi cập nhật thông tin!",
      );
    }
  };

  const confirmResetPassword = (userId) => {
    setConfirmModal({
      show: true,
      title: "Xác nhận đặt lại mật khẩu",
      message:
        "Bạn có chắc muốn đặt lại mật khẩu về số điện thoại của tài khoản này không?",
      onConfirm: async () => {
        try {
          const res = await API.put(`/users/${userId}/reset-password`);
          if (res.data.success) {
            toast.success(res.data.message);
          }
        } catch (error) {
          toast.error("Lỗi khi reset mật khẩu!");
        }
        setConfirmModal({
          show: false,
          title: "",
          message: "",
          onConfirm: null,
        });
      },
    });
  };

  return (
    <div className="p-4 sm:p-6 w-full space-y-6">
      {/* Modal Xác Nhận */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4 text-amber-500">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {confirmModal.title}
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setConfirmModal({
                    show: false,
                    title: "",
                    message: "",
                    onConfirm: null,
                  })
                }
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition cursor-pointer shadow-sm"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Shield size={24} />
            </div>
            <span>Quản Lý Người Dùng & Phân Quyền</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý tài khoản thành viên, phân quyền hệ thống và bảo mật thông
            tin.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4.5 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm text-sm shrink-0"
        >
          <Plus size={18} /> {showAddForm ? "Đóng Form" : "Thêm Tài Khoản"}
        </button>
      </div>

      {/* Form Thêm Tài Khoản */}
      {showAddForm && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 transition-all">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <User size={18} className="text-emerald-600" />
            Thêm tài khoản mới vào hệ thống
          </h2>
          <form
            onSubmit={handleCreateUser}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
          >
            <input
              type="text"
              placeholder="Họ và tên"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-white text-sm transition"
            />
            <input
              type="text"
              placeholder="Số điện thoại"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-white text-sm transition"
            />
            <input
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-white text-sm transition"
            />
            <div className="flex gap-2">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 text-sm outline-none flex-1 text-slate-800 dark:text-white cursor-pointer transition focus:ring-2 focus:ring-emerald-500"
              >
                <option value="user">User</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
              <button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 rounded-xl transition cursor-pointer disabled:opacity-50 text-sm shadow-sm"
              >
                {loading ? "..." : "Lưu"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bảng Danh Sách */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            Danh sách tài khoản hệ thống
          </h2>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            Tổng số: {users.length}
          </span>
        </div>

        {users.length === 0 ? (
          <p className="text-slate-400 italic py-6 text-center">
            Chưa có người dùng nào trong hệ thống.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-3.5">Họ và tên</th>
                  <th className="p-3.5">Số điện thoại</th>
                  <th className="p-3.5">Vai trò</th>
                  <th className="p-3.5 text-center">Phân quyền</th>
                  <th className="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300 text-sm">
                {users.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="p-3.5 font-medium">
                      {editingId === user._id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm w-full text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-100 dark:border-emerald-900/30">
                            {user.name
                              ? user.name.charAt(0).toUpperCase()
                              : "U"}
                          </div>
                          <span className="truncate max-w-[200px] text-slate-800 dark:text-slate-200">
                            {user.name || "Khách"}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="p-3.5 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {editingId === user._id ? (
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm w-full text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      ) : (
                        user.phone
                      )}
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full uppercase inline-block ${
                          user.role === "admin"
                            ? "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-100 dark:border-purple-900/30"
                            : user.role === "staff"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-100 dark:border-blue-900/30"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td className="p-3.5 text-center">
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(user._id, e.target.value)
                        }
                        className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 text-xs outline-none cursor-pointer text-slate-800 dark:text-white hover:border-emerald-500 transition focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="user">User</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {editingId === user._id ? (
                          <>
                            <button
                              onClick={() => handleUpdateUser(user._id)}
                              className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 cursor-pointer shadow-sm transition"
                              title="Lưu"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 cursor-pointer transition"
                              title="Hủy"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(user)}
                              className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl cursor-pointer transition border border-slate-200 dark:border-slate-700"
                              title="Sửa tên / SĐT"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => confirmResetPassword(user._id)}
                              className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl cursor-pointer transition border border-slate-200 dark:border-slate-700"
                              title="Reset mật khẩu về số điện thoại"
                            >
                              <RotateCcw size={16} />
                            </button>
                            <button
                              onClick={() => confirmDeleteUser(user._id)}
                              className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600 dark:hover:text-red-400 rounded-xl cursor-pointer transition border border-slate-200 dark:border-slate-700"
                              title="Xóa tài khoản"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
