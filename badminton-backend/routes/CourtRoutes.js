// badminton-backend/routes/CourtRoutes.js
import express from "express";
import {
  getCourts,
  createCourt,
  updateCourt,
  deleteCourt,
} from "../controllers/CourtController.js";
import {
  verifyAdminOrStaff,
  verifyToken,
} from "../middlewares/AuthMiddleware.js";

const courtRouter = express.Router();

courtRouter.get("/", verifyToken, verifyAdminOrStaff, getCourts);
courtRouter.post("/", verifyToken, verifyAdminOrStaff, createCourt);
courtRouter.put("/:id", verifyToken, verifyAdminOrStaff, updateCourt);
courtRouter.delete("/:id", verifyToken, verifyAdminOrStaff, deleteCourt);

export default courtRouter;
