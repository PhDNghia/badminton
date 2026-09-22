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

const fixedScheduleRouter = express.Router();

fixedScheduleRouter.post(
  "/",
  verifyToken,
  verifyAdminOrStaff,
  createFixedSchedule,
);
fixedScheduleRouter.get(
  "/",
  verifyToken,
  verifyAdminOrStaff,
  getAllFixedSchedules,
);

fixedScheduleRouter.put(
  "/:id",
  verifyToken,
  verifyAdminOrStaff,
  updateFixedSchedule,
);
fixedScheduleRouter.delete(
  "/:id",
  verifyToken,
  verifyAdminOrStaff,
  deleteFixedSchedule,
);

export default fixedScheduleRouter;
