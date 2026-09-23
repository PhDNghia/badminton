// badminton-backend/routes/AuthRoutes.js
import express from "express";
import { register, login } from "../controllers/AuthController.js";
import { verifyAdminOrStaff } from "../middlewares/AuthMiddleware.js";

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);

export default authRouter;
