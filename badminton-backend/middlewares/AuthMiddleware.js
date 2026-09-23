// badminton-backend/middlewares/AuthMiddleware.js
import jwt from "jsonwebtoken";

// Middleware giải mã Token linh hoạt (không bắt buộc phải đăng nhập)
export const optionalVerifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "badminton_secret_key",
      );
      req.user = decoded; // Gắn thông tin user/admin vào req.user nếu có token
    } catch (error) {
      // Token hết hạn hoặc không hợp lệ thì coi như khách không đăng nhập
    }
  }
  next();
};

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Không có quyền truy cập, vui lòng đăng nhập!",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "badminton_secret_key",
    );
    req.user = decoded;
    next();
  } catch (error) {
    return res
      .status(403)
      .json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn!" });
  }
};

export const verifyAdminOrStaff = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.role === "staff")) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Bạn không có quyền thực hiện thao tác này!",
    });
  }
};
