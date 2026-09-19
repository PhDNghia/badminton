// badminton-admin/src/pages/CourtsManager.jsx
import { useState, useEffect } from "react";
import API from "../services/api";
import { Plus, Edit2, Trash2, X, Check, AlertTriangle } from "lucide-react";
import { toast } from "react-toastify"; // <-- Import thư viện toast chuẩn hệ thống

export default function CourtsManager() {
  const [courts, setCourts] = useState([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("Sân thảm PVC");
  const [loading, setLoading] = useState(false);

  // State phục vụ việc Sửa (Edit)
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("");

  // Modal xác nhận tùy chỉnh khi xóa sân
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  // Lấy danh sách sân từ API
  const fetchCourts = async () => {
    try {
      const res = await API.get("/courts");
      if (res.data.success) {
        setCourts(res.data.data);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách sân:", error);
      toast.error("Không thể tải danh sách sân!");
    }
  };

  useEffect(() => {
    fetchCourts();
  }, []);

  // 1. Thêm sân mới
  const handleCreateCourt = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post("/courts", { name, type });
      if (res.data.success) {
        toast.success("Thêm sân mới vào hệ thống thành công!");
        setName("");
        fetchCourts();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi thêm sân!");
    } finally {
      setLoading(false);
    }
  };

  // 2. Xóa sân (Dùng Modal xác nhận chuyên nghiệp thay vì window.confirm)
  const confirmDeleteCourt = (id) => {
    setConfirmModal({
      show: true,
      title: "Xác nhận xóa sân",
      message:
        "Bạn có chắc chắn muốn xóa sân này không? Hành động này không thể hoàn tác.",
      onConfirm: async () => {
        try {
          const res = await API.delete(`/courts/${id}`);
          if (res.data.success) {
            toast.success("Đã xóa sân thành công!");
            fetchCourts();
          }
        } catch (error) {
          toast.error("Lỗi khi xóa sân!");
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

  // 3. Bắt đầu chỉnh sửa
  const startEdit = (court) => {
    setEditingId(court._id);
    setEditName(court.name);
    setEditType(court.type);
  };

  // 4. Lưu lại sau khi sửa
  const handleUpdateCourt = async (id) => {
    try {
      const res = await API.put(`/courts/${id}`, {
        name: editName,
        type: editType,
      });
      if (res.data.success) {
        toast.success("Cập nhật thông tin sân thành công!");
        setEditingId(null);
        fetchCourts();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật sân!");
    }
  };

  return (
    <div className="relative">
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

      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
        <span>🏟️ Quản Lý Sân Cầu Lông</span>
      </h1>

      {/* Form Thêm Sân Mới */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-8">
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
          <Plus size={20} className="text-blue-600" /> Thêm sân mới vào hệ thống
        </h2>
        <form
          onSubmit={handleCreateCourt}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <input
            type="text"
            placeholder="Tên sân (VD: Sân 1)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="p-3 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
          />
          <input
            type="text"
            placeholder="Loại sân (VD: Thảm PVC, Sân gỗ...)"
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
            className="p-3 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white font-medium p-3 rounded-xl hover:bg-blue-700 transition cursor-pointer flex items-center justify-center gap-2 shadow-md"
          >
            <Plus size={18} /> {loading ? "Đang thêm..." : "Thêm Sân"}
          </button>
        </form>
      </div>

      {/* Danh Sách Sân Hiện Tại */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">
          Danh sách sân hiện có ({courts.length})
        </h2>

        {courts.length === 0 ? (
          <p className="text-slate-400 italic py-4">
            Chưa có sân nào được thêm vào hệ thống.
          </p>
        ) : (
          <div className="space-y-3">
            {courts.map((court) => (
              <div
                key={court._id}
                className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                {editingId === court._id ? (
                  <div className="flex items-center gap-3 flex-1 mr-4">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-white flex-1 text-sm"
                    />
                    <input
                      type="text"
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                      className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-white flex-1 text-sm"
                    />
                  </div>
                ) : (
                  <div>
                    <h3 className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                      {court.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {court.type}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {editingId === court._id ? (
                    <>
                      <button
                        onClick={() => handleUpdateCourt(court._id)}
                        className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition cursor-pointer"
                        title="Lưu"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-2 bg-slate-400 text-white rounded-lg hover:bg-slate-500 transition cursor-pointer"
                        title="Hủy"
                      >
                        <X size={18} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(court)}
                        className="p-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition cursor-pointer"
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => confirmDeleteCourt(court._id)}
                        className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition cursor-pointer"
                        title="Xóa sân"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
