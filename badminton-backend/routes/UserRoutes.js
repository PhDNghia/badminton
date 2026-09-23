import express from "express";
import {
  getUsers,
  createUserByAdmin,
  updateUserRole,
  updateUser,
  deleteUser,
  resetPassword,
  changePassword,
} from "../controllers/UserController.js";
import {
  verifyAdminOrStaff,
  verifyToken,
} from "../middlewares/AuthMiddleware.js";

const userRouter = express.Router();

userRouter.get("/", verifyToken, verifyAdminOrStaff, getUsers);
userRouter.post("/", createUserByAdmin);
userRouter.put("/change-password", verifyToken, changePassword);
userRouter.put("/:id", verifyToken, verifyAdminOrStaff, updateUser); // Route sửa tên & SĐT
userRouter.put("/:id/role", verifyToken, verifyAdminOrStaff, updateUserRole); // Route phân quyền nhanh
userRouter.put(
  "/:id/reset-password",
  verifyToken,
  verifyAdminOrStaff,
  resetPassword,
); // Route reset mật khẩu về SĐT
userRouter.delete("/:id", verifyToken, verifyAdminOrStaff, deleteUser);

export default userRouter;
