// badminton-client/src/pages/BookingView.jsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";

export default function BookingView() {
  const { courtId } = useParams();
  const navigate = useNavigate();

  // State lưu thông tin form đặt sân
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("10:00");

  // Dành cho khách vãng lai (không đăng nhập)
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Giá tiền mẫu tính tạm (VD: 100k/giờ)
      const totalPrice = 200000;
      const depositAmount = 50000; // Tiền cọc cứng 50k hoặc 50%

      const payload = {
        court: courtId,
        date,
        startTime,
        endTime,
        totalPrice,
        depositAmount,
        guestName,
        guestPhone,
      };

      const res = await API.post("/bookings", payload);
      if (res.data.success) {
        setBookingSuccess(res.data.data);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Có lỗi xảy ra khi đặt sân!");
    } finally {
      setLoading(false);
    }
  };

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-md max-w-md w-full text-center border border-slate-200">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Đặt sân thành công!
          </h2>
          <p className="text-slate-600 mb-6 text-sm">
            Vui lòng quét mã QR bên dưới để chuyển khoản tiền cọc, nhân viên sẽ
            xác nhận sau vài phút.
          </p>

          {/* Khung hiển thị QR tĩnh */}
          <div className="bg-slate-100 p-4 rounded-xl mb-6">
            <p className="font-semibold text-slate-700 mb-2">
              Thông tin chuyển khoản cọc:
            </p>
            <p className="text-sm text-slate-600">
              Ngân hàng: <b>MB Bank</b>
            </p>
            <p className="text-sm text-slate-600">
              STK: <b>1234567890</b>
            </p>
            <p className="text-sm text-slate-600">
              Chủ thẻ: <b>CLB CAU LONG</b>
            </p>
            <p className="text-sm text-blue-600 font-bold mt-2">
              Số tiền cọc: 50.000 đ
            </p>
            <p className="text-xs text-red-500 mt-1">
              Nội dung CK: CỌC {bookingSuccess._id.slice(-6).toUpperCase()}
            </p>
          </div>

          <button
            onClick={() => navigate("/")}
            className="w-full bg-slate-800 text-white py-3 rounded-xl font-medium hover:bg-slate-900 transition"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 mb-6 text-center">
          Form Xác Nhận Đặt Sân
        </h1>

        <form onSubmit={handleBookingSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Ngày đánh sân:
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Giờ bắt đầu:
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Giờ kết thúc:
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Phần dành cho khách vãng lai không đăng nhập */}
          <div className="border-t border-slate-200 pt-4 mt-4">
            <p className="text-sm text-slate-500 mb-3">
              Dành cho khách vãng lai (không cần đăng nhập tài khoản):
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Họ và tên:
                </label>
                <input
                  type="text"
                  placeholder="Nhập họ tên của bạn"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Số điện thoại liên hệ:
                </label>
                <input
                  type="text"
                  placeholder="Nhập số điện thoại"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition mt-6 cursor-pointer"
          >
            {loading ? "Đang xử lý..." : "Xác Nhận Đặt Sân & Xem QR Cọc"}
          </button>
        </form>
      </div>
    </div>
  );
}
