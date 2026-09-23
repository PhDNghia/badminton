import React, { useState, useEffect } from "react";
import API from "../services/api";
import { toast } from "react-toastify";
import { AlertTriangle, Trash2, Edit, Plus, Ticket } from "lucide-react";

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
    maxDiscountValue: "", // Giới hạn giảm tối đa
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
    <div className="w-full min-h-screen p-6 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col relative transition-colors duration-200">
      {/* HEADER TỔNG QUAN */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
            <Ticket className="text-emerald-600" size={24} /> Quản Lý Mã Giảm
            Giá & Khuyến Mãi
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tạo mới, thiết lập và quản lý các chương trình ưu đãi dành cho khách
            hàng
          </p>
        </div>

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
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-medium shadow-xs transition flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Plus size={16} /> Thêm Mã Mới
        </button>
      </div>

      {/* BẢNG DANH SÁCH MÃ GIẢM GIÁ */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Danh sách mã khuyến mãi ({discounts.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="p-3.5">Mã Code</th>
                <th className="p-3.5">Kiểu Giảm</th>
                <th className="p-3.5">Giá Trị</th>
                <th className="p-3.5">Giá trị tối thiểu</th>
                <th className="p-3.5 text-center">Số đơn đã dùng</th>
                <th className="p-3.5">Tổng tiền đã giảm</th>
                <th className="p-3.5">Thời Gian Hiệu Lực</th>
                <th className="p-3.5">Trạng Thái</th>
                <th className="p-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {discounts.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="text-center py-10 text-slate-400 dark:text-slate-500 italic text-xs"
                  >
                    Chưa có mã giảm giá nào.
                  </td>
                </tr>
              ) : (
                discounts.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                      {item.code}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">
                      {item.discountType === "percentage"
                        ? "Theo Phần Trăm (%)"
                        : "Tiền Trực Tiếp (VNĐ)"}
                    </td>
                    <td className="p-3.5 font-semibold text-emerald-600 dark:text-emerald-400">
                      {item.discountType === "percentage"
                        ? `${item.discountValue}% ${
                            item.maxDiscountValue
                              ? `(Tối đa: ${item.maxDiscountValue.toLocaleString()}đ)`
                              : ""
                          }`
                        : `${item.discountValue.toLocaleString()}đ`}
                    </td>
                    <td className="p-3.5 text-slate-500 dark:text-slate-400">
                      {item.minOrderValue
                        ? `${item.minOrderValue.toLocaleString()}đ`
                        : "Không có"}
                    </td>

                    <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-200 text-center">
                      {item.usedCount || 0} đơn
                    </td>
                    <td className="p-3.5 font-semibold text-amber-600 dark:text-amber-400">
                      {(item.totalDiscountedAmount || 0).toLocaleString()}đ
                    </td>

                    <td className="p-3.5 text-slate-500 dark:text-slate-400">
                      {new Date(item.startDate).toLocaleDateString("vi-VN")} ➔{" "}
                      {new Date(item.endDate).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.isActive
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                            : "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                        }`}
                      >
                        {item.isActive ? "Đang hoạt động" : "Tạm khóa"}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 bg-slate-100 dark:bg-slate-800 rounded-lg transition cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(item)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 bg-slate-100 dark:bg-slate-800 rounded-lg transition cursor-pointer"
                          title="Xóa mã"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL THÊM / SỬA */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in duration-200">
            <h2 className="text-base font-bold mb-4 text-slate-800 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              {editingId ? "Sửa Mã Giảm Giá" : "Thêm Mã Giảm Giá Mới"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Mã Code (VD: TET2026)
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 uppercase font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Kiểu giảm
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({ ...formData, discountType: e.target.value })
                    }
                    className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 outline-none cursor-pointer focus:border-emerald-500 transition"
                  >
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Số tiền (VNĐ)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
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
                    className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Ô nhập giới hạn giảm tối đa (chỉ hiện khi chọn kiểu percentage) */}
              {formData.discountType === "percentage" && (
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
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
                    className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                    placeholder="Không giới hạn nếu để trống"
                  />
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
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
                  className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  placeholder="Để trống nếu không giới hạn"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 outline-none cursor-pointer focus:border-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl p-2.5 outline-none cursor-pointer focus:border-emerald-500 transition"
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
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
                <label
                  htmlFor="isActive"
                  className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Kích hoạt mã này ngay
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 cursor-pointer transition shadow-xs"
                >
                  {editingId ? "Cập Nhật" : "Tạo Mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN XÓA */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-200 dark:border-slate-800 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-100 dark:border-amber-900/40">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">
              Xác nhận xóa mã giảm giá
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Bạn có chắc chắn muốn xóa mã{" "}
              <span className="font-bold text-slate-700 dark:text-slate-200">
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
                className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 font-medium text-xs transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-medium text-xs shadow-xs transition cursor-pointer"
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
