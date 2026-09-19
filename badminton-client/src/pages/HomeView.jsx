// badminton-client/src/pages/HomeView.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function HomeView() {
  const [courts, setCourts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/courts")
      .then((res) => {
        if (res.data.success) {
          setCourts(res.data.data);
        }
      })
      .catch((err) => console.error("Lỗi gọi API sân:", err));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-2 text-center">
          🏸 Đặt Sân Cầu Lông Online
        </h1>
        <p className="text-center text-slate-500 mb-8">
          Hệ thống đặt sân nhanh chóng, tiện lợi
        </p>

        <h2 className="text-xl font-semibold text-slate-700 mb-4">
          Danh sách sân hiện có:
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courts.map((court) => (
            <div
              key={court._id}
              className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center"
            >
              <div>
                <h3 className="text-lg font-bold text-blue-600">
                  {court.name}
                </h3>
                <p className="text-sm text-slate-500">{court.type}</p>
              </div>
              <button
                onClick={() => navigate(`/booking/${court._id}`)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition cursor-pointer"
              >
                Chọn sân
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
