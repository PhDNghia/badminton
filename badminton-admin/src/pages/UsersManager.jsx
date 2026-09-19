// badminton-admin/src/pages/UsersManager.jsx
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
} from "lucide-react";
import { toast } from "react-toastify"; // <-- Import thư viện toast chuẩn

export default function UsersManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form thêm user
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");

  // Chỉnh sửa thông tin
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  // Modal xác nhận tùy chỉnh
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
    <div>
      {/* Custom Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4 text-amber-500">
              <AlertTriangle size={28} />
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
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition cursor-pointer shadow-md"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <span>👥 Quản Lý Người Dùng & Phân Quyền</span>
        </h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md"
        >
          <Plus size={20} /> {showAddForm ? "Đóng Form" : "Thêm Tài Khoản"}
        </button>
      </div>

      {/* Form thêm tài khoản */}
      {showAddForm && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-8">
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">
            Thêm tài khoản mới vào hệ thống
          </h2>
          <form
            onSubmit={handleCreateUser}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <input
              type="text"
              placeholder="Họ và tên"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="p-3 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
            />
            <input
              type="text"
              placeholder="Số điện thoại"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="p-3 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
            />
            <input
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="p-3 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
            />
            <div className="flex gap-2">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="p-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm outline-none flex-1 text-slate-800 dark:text-white cursor-pointer"
              >
                <option value="user">User</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
              <button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 rounded-xl transition cursor-pointer"
              >
                {loading ? "..." : "Lưu"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bảng danh sách */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">
          Danh sách tài khoản hệ thống ({users.length})
        </h2>

        {users.length === 0 ? (
          <p className="text-slate-400 italic py-4">Chưa có người dùng nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm">
                  <th className="p-3">Họ và tên</th>
                  <th className="p-3">Số điện thoại</th>
                  <th className="p-3">Vai trò</th>
                  <th className="p-3 text-center">Phân quyền</th>
                  <th className="p-3 text-right">Thao tác & Bảo mật</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {users.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                  >
                    <td className="p-3 font-semibold">
                      {editingId === user._id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="p-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm w-full text-slate-800 dark:text-white"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                            {user.name
                              ? user.name.charAt(0).toUpperCase()
                              : "U"}
                          </div>
                          <span>{user.name || "Khách"}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-3 font-mono text-sm">
                      {editingId === user._id ? (
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="p-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm w-full text-slate-800 dark:text-white"
                        />
                      ) : (
                        user.phone
                      )}
                    </td>

                    <td className="p-3">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full uppercase ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                            : user.role === "staff"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(user._id, e.target.value)
                        }
                        className="p-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-xs outline-none cursor-pointer text-slate-800 dark:text-white"
                      >
                        <option value="user">User</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {editingId === user._id ? (
                          <>
                            <button
                              onClick={() => handleUpdateUser(user._id)}
                              className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer"
                              title="Lưu"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 bg-slate-400 text-white rounded-lg hover:bg-slate-500 cursor-pointer"
                              title="Hủy"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(user)}
                              className="p-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 cursor-pointer"
                              title="Sửa tên / SĐT"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => confirmResetPassword(user._id)}
                              className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                              title="Reset mật khẩu về số điện thoại"
                            >
                              <RotateCcw size={16} />
                            </button>
                            <button
                              onClick={() => confirmDeleteUser(user._id)}
                              className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer"
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
