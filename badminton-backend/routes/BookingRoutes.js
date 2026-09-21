// badminton-backend/routes/BookingRoutes.js
import express from "express";
import {
  createBooking,
  confirmDeposit,
  checkInBooking,
  getAllBookings,
  deleteBooking,
  handleNoShowBooking,
} from "../controllers/BookingController.js";
import {
  verifyToken,
  verifyAdminOrStaff,
} from "../middlewares/AuthMiddlerware.js";

const bookingRouter = express.Router();

bookingRouter.post("/", createBooking); // Khách đặt lịch
bookingRouter.put(
  "/:bookingId/confirm-deposit",
  verifyToken,
  verifyAdminOrStaff,
  confirmDeposit,
); // Nhân viên xác nhận cọc
bookingRouter.put(
  "/:bookingId/check-in",
  verifyToken,
  verifyAdminOrStaff,
  checkInBooking,
); // Nhân viên check-in sân
bookingRouter.get("/", verifyToken, verifyAdminOrStaff, getAllBookings); // Lấy danh sách cho admin/staff
bookingRouter.delete(
  "/:bookingId",
  verifyToken,
  verifyAdminOrStaff,
  deleteBooking,
); // Xóa lịch đặt

bookingRouter.put(
  "/:bookingId/no-show",
  verifyToken,
  verifyAdminOrStaff,
  handleNoShowBooking,
); // Route xử lý bùng sân

export default bookingRouter;
