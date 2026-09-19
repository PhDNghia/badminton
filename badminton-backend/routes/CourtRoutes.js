// badminton-backend/routes/CourtRoutes.js
import express from "express";
import {
  getCourts,
  createCourt,
  updateCourt,
  deleteCourt,
} from "../controllers/CourtController.js";

const courtRouter = express.Router();

courtRouter.get("/", getCourts);
courtRouter.post("/", createCourt);
courtRouter.put("/:id", updateCourt);
courtRouter.delete("/:id", deleteCourt);

export default courtRouter;
