import express from "express";
import {
  getDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  applyDiscount,
} from "../controllers/DiscountController.js";
import {
  verifyToken,
  verifyAdminOrStaff,
  optionalVerifyToken,
} from "../middlewares/AuthMiddleware.js";

const discountRouter = express.Router();

discountRouter.get("/", verifyToken, verifyAdminOrStaff, getDiscounts);
discountRouter.post("/", verifyToken, verifyAdminOrStaff, createDiscount);
discountRouter.put("/:id", verifyToken, verifyAdminOrStaff, updateDiscount);
discountRouter.delete("/:id", verifyToken, verifyAdminOrStaff, deleteDiscount);
discountRouter.post("/apply", optionalVerifyToken, applyDiscount);

export default discountRouter;
