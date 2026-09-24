import React, { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  // Theo dõi sự kiện cuộn trang để ẩn/hiện nút cuộn lên top
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 items-center">
      {/* Nút cuộn lên Top (chỉ hiện khi cuộn xuống dưới 300px) */}
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-xl transition-all duration-300 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 border border-emerald-500/30 animate-in fade-in slide-in-from-bottom-2"
          title="Lên đầu trang"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
}
