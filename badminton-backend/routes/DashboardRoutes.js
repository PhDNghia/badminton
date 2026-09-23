import express from "express";
import { getDashboardStats } from "../controllers/DashboardController.js";
import {
  verifyToken,
  verifyAdminOrStaff,
} from "../middlewares/AuthMiddleware.js";

const dashboardRouter = express.Router();

dashboardRouter.get("/", verifyToken, verifyAdminOrStaff, getDashboardStats);

export default dashboardRouter;
