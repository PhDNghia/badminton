// badminton-backend/routes/InvoiceRoutes.js
import express from "express";
import {
  deleteInvoice,
  getAllInvoices,
  getOrCreateInvoice,
  updateInvoicePOS,
} from "../controllers/InvoiceController.js";
import {
  verifyToken,
  verifyAdminOrStaff,
} from "../middlewares/AuthMiddlerware.js";

const invoiceRouter = express.Router();

invoiceRouter.get("/", verifyToken, verifyAdminOrStaff, getAllInvoices);
// Lấy hoặc tạo hóa đơn dựa theo bookingId
invoiceRouter.get(
  "/booking/:bookingId",
  verifyToken,
  verifyAdminOrStaff,
  getOrCreateInvoice,
);

// Cập nhật hóa đơn / thanh toán POS
invoiceRouter.put(
  "/:invoiceId",
  verifyToken,
  verifyAdminOrStaff,
  updateInvoicePOS,
);

invoiceRouter.delete(
  "/:invoiceId",
  verifyToken,
  verifyAdminOrStaff,
  deleteInvoice,
);

export default invoiceRouter;
