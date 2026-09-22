import React, { useState, useEffect } from "react";
import API from "../services/api";
import { toast } from "react-toastify";
import { AlertCircle, Trash2, Edit, Plus } from "lucide-react";

export default function DiscountsManager() {
  const [discounts, setDiscounts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // State cho Modal Xác Nhận Xóa
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState(null);

  const [formData, setFormData] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "",
    maxDiscountValue: "", // Thêm trường giới hạn giảm tối đa
    minOrderValue: "",
    startDate: "",
    endDate: "",
    isActive: true,
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const res = await API.get("/discounts");
      if (res.data.success) setDiscounts(res.data.data);
    } catch (err) {
      console.error("Lỗi tải danh sách mã giảm giá", err);
      toast.error("Không thể tải danh sách mã giảm giá!");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await API.put(`/discounts/${editingId}`, formData);
        toast.success("Cập nhật mã giảm giá thành công!");
      } else {
        await API.post("/discounts", formData);
        toast.success("Tạo mã giảm giá mới thành công!");
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({
        code: "",
        discountType: "percentage",
        discountValue: "",
        maxDiscountValue: "",
        minOrderValue: "",
        startDate: "",
        endDate: "",
        isActive: true,
      });
      fetchDiscounts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra!");
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setFormData({
      code: item.code,
      discountType: item.discountType,
      discountValue: item.discountValue,
      maxDiscountValue: item.maxDiscountValue || "",
      minOrderValue: item.minOrderValue || "",
      startDate: item.startDate ? item.startDate.split("T")[0] : "",
      endDate: item.endDate ? item.endDate.split("T")[0] : "",
      isActive: item.isActive,
    });
    setShowModal(true);
  };

  // Mở Modal xác nhận xóa
  const handleDeleteClick = (item) => {
    setDiscountToDelete(item);
    setShowDeleteModal(true);
  };

  // Thực hiện xóa khi bấm nút xác nhận trên Modal
  const confirmDelete = async () => {
    if (!discountToDelete) return;
    try {
      await API.delete(`/discounts/${discountToDelete._id}`);
      toast.success("Đã xóa mã giảm giá thành công!");
      setShowDeleteModal(false);
      setDiscountToDelete(null);
      fetchDiscounts();
    } catch (err) {
      toast.error("Xóa thất bại!");
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-slate-950 min-h-screen text-gray-800 dark:text-gray-100 transition-colors">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          🎟️ Quản Lý Mã Giảm Giá & Khuyến Mãi
        </h1>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              code: "",
              discountType: "percentage",
              discountValue: "",
              maxDiscountValue: "",
              minOrderValue: "",
              startDate: "",
              endDate: "",
              isActive: true,
            });
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium shadow-sm transition flex items-center gap-2 cursor-pointer"
        >
          <Plus size={18} /> Thêm Mã Mới
        </button>
      </div>

      {/* Bảng danh sách mã giảm giá */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-slate-800/80 text-gray-600 dark:text-gray-300 text-sm border-b border-gray-200 dark:border-slate-800">
              <th className="p-3">Mã Code</th>
              <th className="p-3">Kiểu Giảm</th>
              <th className="p-3">Giá Trị</th>
              <th className="p-3">Giá trị tối thiểu</th>
              <th className="p-3 text-center">Số đơn đã dùng</th>
              <th className="p-3">Tổng tiền đã giảm</th>
              <th className="p-3">Thời Gian Hiệu Lực</th>
              <th className="p-3">Trạng Thái</th>
              <th className="p-3 text-center">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-800 text-sm">
            {discounts.length === 0 ? (
              <tr>
                <td
                  colSpan="9"
                  className="text-center py-6 text-gray-400 dark:text-gray-500"
                >
                  Chưa có mã giảm giá nào.
                </td>
              </tr>
            ) : (
              discounts.map((item) => (
                <tr
                  key={item._id}
                  className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition"
                >
                  <td className="p-3 font-bold text-blue-600 dark:text-blue-400">
                    {item.code}
                  </td>
                  <td className="p-3">
                    {item.discountType === "percentage"
                      ? "Theo Phần Trăm (%)"
                      : "Tiền Trực Tiếp (VNĐ)"}
                  </td>
                  <td className="p-3 font-semibold text-green-600 dark:text-green-400">
                    {item.discountType === "percentage"
                      ? `${item.discountValue}% ${
                          item.maxDiscountValue
                            ? `(Tối đa: ${item.maxDiscountValue.toLocaleString()}đ)`
                            : ""
                        }`
                      : `${item.discountValue.toLocaleString()}đ`}
                  </td>
                  <td className="p-3">
                    {item.minOrderValue
                      ? `${item.minOrderValue.toLocaleString()}đ`
                      : "Không có"}
                  </td>

                  <td className="p-3 font-semibold text-blue-600 dark:text-blue-400 text-center">
                    {item.usedCount || 0} đơn
                  </td>
                  <td className="p-3 font-semibold text-orange-600 dark:text-orange-400">
                    {(item.totalDiscountedAmount || 0).toLocaleString()}đ
                  </td>

                  <td className="p-3 text-gray-500 dark:text-gray-400">
                    {new Date(item.startDate).toLocaleDateString("vi-VN")} ➔{" "}
                    {new Date(item.endDate).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        item.isActive
                          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                      }`}
                    >
                      {item.isActive ? "Đang hoạt động" : "Tạm khóa"}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(item)}
                        className="text-red-600 dark:text-red-400 hover:underline font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Thêm / Sửa */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl text-gray-800 dark:text-gray-100">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? "Sửa Mã Giảm Giá" : "Thêm Mã Giảm Giá Mới"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Mã Code (VD: TET2026)
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  className="w-full border border-gray-300 dark:border-slate-700 bg-transparent rounded-xl p-2.5 uppercase font-bold outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Kiểu giảm
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({ ...formData, discountType: e.target.value })
                    }
                    className="w-full border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-xl p-2.5 outline-none cursor-pointer"
                  >
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Số tiền (VNĐ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Giá trị giảm (
                    {formData.discountType === "percentage" ? "%" : "VNĐ"})
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.discountValue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountValue: Number(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 dark:border-slate-700 bg-transparent rounded-xl p-2.5 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Ô nhập giới hạn giảm tối đa (chỉ hiện khi chọn kiểu percentage) */}
              {formData.discountType === "percentage" && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Giảm tối đa (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={formData.maxDiscountValue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxDiscountValue: Number(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 dark:border-slate-700 bg-transparent rounded-xl p-2.5 outline-none focus:border-blue-500"
                    placeholder="Không giới hạn nếu để trống"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">
                  Đơn hàng tối thiểu (VNĐ)
                </label>
                <input
                  type="number"
                  value={formData.minOrderValue}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minOrderValue: Number(e.target.value),
                    })
                  }
                  className="w-full border border-gray-300 dark:border-slate-700 bg-transparent rounded-xl p-2.5 outline-none focus:border-blue-500"
                  placeholder="Để trống nếu không giới hạn"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full border border-gray-300 dark:border-slate-700 bg-transparent rounded-xl p-2.5 outline-none cursor-pointer"
                    style={{ colorScheme: "dark" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full border border-gray-300 dark:border-slate-700 bg-transparent rounded-xl p-2.5 outline-none cursor-pointer"
                    style={{ colorScheme: "dark" }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium cursor-pointer"
                >
                  Kích hoạt mã này ngay
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 cursor-pointer transition shadow-sm"
                >
                  {editingId ? "Cập Nhật" : "Tạo Mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác Nhận Xóa */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-200 dark:border-slate-800 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
              Xác nhận xóa mã giảm giá
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Bạn có chắc chắn muốn xóa mã{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                "{discountToDelete?.code}"
              </span>{" "}
              không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDiscountToDelete(null);
                }}
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 font-medium text-sm transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium text-sm shadow-sm transition-all cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
