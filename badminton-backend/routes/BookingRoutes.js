// badminton-backend/routes/BookingRoutes.js
import express from "express";
import {
  createBooking,
  confirmDeposit,
  checkInBooking,
  getAllBookings,
  deleteBooking,
} from "../controllers/BookingController.js";
import {
  verifyToken,
  verifyAdminOrStaff,
} from "../middlewares/AuthMiddlerware.js";

const bookingRouter = express.Router();

bookingRouter.post("/", verifyToken, createBooking); // Khách đặt lịch
bookingRouter.put(
  "/:bookingId/confirm-deposit",
  verifyToken,
  verifyAdminOrStaff,
  confirmDeposit,
); // Nhân viên xác nhận cọc
bookingRouter.put("/:bookingId/check-in", checkInBooking); // Nhân viên check-in sân
bookingRouter.get("/", verifyToken, verifyAdminOrStaff, getAllBookings); // Lấy danh sách cho admin/staff
bookingRouter.delete(
  "/:bookingId",
  verifyToken,
  verifyAdminOrStaff,
  deleteBooking,
); // Xóa lịch đặt

export default bookingRouter;
