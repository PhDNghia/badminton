import { useState } from "react";
import { X, Sparkles, CheckCircle2, ShieldAlert, Layers } from "lucide-react";

export default function VersionModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  // Danh sách các phiên bản và lịch sử cập nhật
  const versions = [
    {
      version: "v1.4.0",
      date: "24/09/2026",
      tag: "Mới nhất",
      tagColor:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
      changes: [
        "Cải thiện giao diện Sơ đồ lịch sân trực quan, làm rõ đường viền các ô giờ giúp dễ quan sát.",
        "Nâng cấp tính năng kéo thả (drag-to-select) trên lưới đặt sân mượt mà hơn.",
        "Tối ưu hóa hiển thị trạng thái cọc và phân quyền quản trị viên.",
      ],
    },
    {
      version: "v1.3.2",
      date: "15/09/2026",
      tag: "Bản vá",
      tagColor:
        "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      changes: [
        "Khắc phục lỗi lệch múi giờ UTC khi lọc danh sách lịch đặt theo ngày.",
        "Thêm cơ chế tự động bắt buộc cọc 100% đối với khách hàng có lịch sử bùng sân (strikeCount > 0).",
      ],
    },
    {
      version: "v1.3.0",
      date: "01/09/2026",
      tag: "Tính năng lớn",
      tagColor:
        "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
      changes: [
        "Ra mắt sơ đồ lịch sân trực quan dạng lưới 24 giờ cho từng sân.",
        "Bổ sung tính năng check-in trực tiếp và xử lý tình huống khách bùng sân (giữ cọc hoặc hoàn tiền).",
        "Thêm quản lý mã giảm giá và thống kê doanh thu chi tiết.",
      ],
    },
    {
      version: "v1.0.0",
      date: "10/08/2026",
      tag: "Phát hành",
      tagColor:
        "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
      changes: [
        "Khởi động hệ thống quản lý sân cầu lông cơ bản.",
        "Quản lý danh sách sân, danh sách người dùng và đặt lịch thủ công.",
      ],
    },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Layers size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                Lịch Sử Phiên Bản Hệ Thống
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Theo dõi các bản cập nhật và tính năng mới của Tono Badminton
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg transition cursor-pointer"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nội dung danh sách phiên bản (Có thanh cuộn) */}
        <div className="p-6 overflow-y-auto space-y-6 divide-y divide-slate-100 dark:divide-slate-800/60">
          {versions.map((v, index) => (
            <div key={v.version} className={index !== 0 ? "pt-6" : ""}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-base text-slate-800 dark:text-white">
                    {v.version}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${v.tagColor}`}
                  >
                    {v.tag}
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {v.date}
                </span>
              </div>

              <ul className="space-y-1.5 mt-3">
                {v.changes.map((change, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2 leading-relaxed"
                  >
                    <span className="text-emerald-500 mt-0.5 shrink-0">•</span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer Modal */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium transition cursor-pointer"
          >
            Đóng lại
          </button>
        </div>
      </div>
    </div>
  );
}
