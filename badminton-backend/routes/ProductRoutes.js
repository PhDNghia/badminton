// badminton-backend/routes/ProductRoutes.js
import express from "express";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/ProductController.js";
import {
  verifyAdminOrStaff,
  verifyToken,
} from "../middlewares/AuthMiddlerware.js";

const productRouter = express.Router();

productRouter.get("/", verifyToken, verifyAdminOrStaff, getProducts);
productRouter.post("/", verifyToken, verifyAdminOrStaff, createProduct);
productRouter.put("/:id", verifyToken, verifyAdminOrStaff, updateProduct);
productRouter.delete("/:id", verifyToken, verifyAdminOrStaff, deleteProduct);

export default productRouter;
