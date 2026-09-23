import { useState, useEffect } from "react";
import API from "../services/api";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  AlertTriangle,
  LayoutGrid,
} from "lucide-react";
import { toast } from "react-toastify";

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
      console.log(res);
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

  // 2. Xóa sân (Dùng Modal xác nhận chuyên nghiệp)
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
    <div className="w-full min-h-screen p-6 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col relative transition-colors duration-200">
      {/* Custom Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4 text-amber-500">
              <AlertTriangle size={24} />
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                {confirmModal.title}
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-xs mb-6 leading-relaxed">
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
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-medium transition cursor-pointer shadow-xs"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER TỔNG QUAN */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
          <LayoutGrid className="text-emerald-600" size={24} /> Quản Lý Sân Cầu
          Lông
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Thêm mới, theo dõi và cấu hình danh sách sân cầu lông trong hệ thống
        </p>
      </div>

      {/* Form Thêm Sân Mới */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-1.5">
          <Plus size={14} className="text-emerald-500" /> Thêm sân mới vào hệ
          thống
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
            className="px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs placeholder-slate-400 transition"
          />
          <input
            type="text"
            placeholder="Loại sân (VD: Thảm PVC, Sân gỗ...)"
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
            className="px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-xs placeholder-slate-400 transition"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-xs text-xs disabled:opacity-50"
          >
            <Plus size={16} /> {loading ? "Đang thêm..." : "Thêm Sân"}
          </button>
        </form>
      </div>

      {/* Danh Sách Sân Hiện Tại */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Danh sách sân hiện có ({courts.length})
          </h2>
        </div>

        {courts.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500 italic text-xs">
            Chưa có sân nào được thêm vào hệ thống.
          </div>
        ) : (
          <div className="space-y-2.5">
            {courts.map((court) => (
              <div
                key={court._id}
                className="flex justify-between items-center p-3.5 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 transition-all hover:border-slate-300 dark:hover:border-slate-700"
              >
                {editingId === court._id ? (
                  <div className="flex items-center gap-3 flex-1 mr-4">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-white flex-1 text-xs"
                    />
                    <input
                      type="text"
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                      className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-white flex-1 text-xs"
                    />
                  </div>
                ) : (
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm">
                      {court.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {court.type}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {editingId === court._id ? (
                    <>
                      <button
                        onClick={() => handleUpdateCourt(court._id)}
                        className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition cursor-pointer shadow-xs"
                        title="Lưu"
                      >
                        <Check size={15} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-2 bg-slate-400 text-white rounded-lg hover:bg-slate-500 transition cursor-pointer"
                        title="Hủy"
                      >
                        <X size={15} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(court)}
                        className="p-2 text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition cursor-pointer"
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => confirmDeleteCourt(court._id)}
                        className="p-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition cursor-pointer"
                        title="Xóa sân"
                      >
                        <Trash2 size={15} />
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
