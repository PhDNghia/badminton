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
} from "../middlewares/AuthMiddlerware.js";

const userRouter = express.Router();

userRouter.get("/", verifyToken, verifyAdminOrStaff, getUsers);
userRouter.post("/", createUserByAdmin);
userRouter.put("/change-password", verifyToken, changePassword);
userRouter.put("/:id", verifyAdminOrStaff, verifyToken, updateUser); // Route sửa tên & SĐT
userRouter.put("/:id/role", verifyAdminOrStaff, verifyToken, updateUserRole); // Route phân quyền nhanh
userRouter.put(
  "/:id/reset-password",
  verifyAdminOrStaff,
  verifyToken,
  resetPassword,
); // Route reset mật khẩu về SĐT
userRouter.delete("/:id", verifyAdminOrStaff, verifyToken, deleteUser);

export default userRouter;
