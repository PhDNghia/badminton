import express from "express";
import {
  createFixedSchedule,
  deleteFixedSchedule,
  getAllFixedSchedules,
  updateFixedSchedule,
} from "../controllers/FixedScheduleController.js";
import {
  verifyToken,
  verifyAdminOrStaff,
} from "../middlewares/AuthMiddlerware.js";

const fixedScheduleRoutes = express.Router();

fixedScheduleRoutes.post(
  "/",
  verifyToken,
  verifyAdminOrStaff,
  createFixedSchedule,
);
fixedScheduleRoutes.get(
  "/",
  verifyToken,
  verifyAdminOrStaff,
  getAllFixedSchedules,
);

fixedScheduleRoutes.put(
  "/:id",
  verifyToken,
  verifyAdminOrStaff,
  updateFixedSchedule,
);
fixedScheduleRoutes.delete(
  "/:id",
  verifyToken,
  verifyAdminOrStaff,
  deleteFixedSchedule,
);

export default fixedScheduleRoutes;
