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
  optionalVerifyToken, 
} from "../middlewares/AuthMiddleware.js";

const bookingRouter = express.Router();


bookingRouter.post("/", optionalVerifyToken, createBooking);

bookingRouter.put(
  "/:bookingId/confirm-deposit",
  verifyToken,
  verifyAdminOrStaff,
  confirmDeposit,
);
bookingRouter.put(
  "/:bookingId/check-in",
  verifyToken,
  verifyAdminOrStaff,
  checkInBooking,
);
bookingRouter.get("/", verifyToken, verifyAdminOrStaff, getAllBookings);
bookingRouter.delete(
  "/:bookingId",
  verifyToken,
  verifyAdminOrStaff,
  deleteBooking,
);
bookingRouter.put(
  "/:bookingId/no-show",
  verifyToken,
  verifyAdminOrStaff,
  handleNoShowBooking,
);

export default bookingRouter;
