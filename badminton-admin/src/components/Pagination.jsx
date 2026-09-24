import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export default function Pagination({
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  totalItems,
}) {
  if (totalItems === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-4 px-2 text-xs text-slate-600 dark:text-slate-300">
      {/* Chọn số lượng hiển thị */}
      <div className="flex items-center gap-2">
        <span>Hiển thị:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-xl outline-none text-slate-800 dark:text-white cursor-pointer"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
        <span>
          trên tổng số <strong>{totalItems}</strong> bản ghi
        </span>
      </div>

      {/* Thông tin trang & Các nút điều hướng */}
      <div className="flex items-center gap-3">
        <span className="font-medium">
          Trang{" "}
          <strong className="text-emerald-600 dark:text-emerald-400">
            {currentPage}
          </strong>{" "}
          / {totalPages || 1}
        </span>

        <div className="flex items-center gap-1">
          {/* Về trang đầu */}
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Trang đầu"
          >
            <ChevronsLeft size={16} />
          </button>

          {/* Trang trước */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Trang trước"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Trang sau */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Trang sau"
          >
            <ChevronRight size={16} />
          </button>

          {/* Về trang cuối */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages}
            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Trang cuối"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
