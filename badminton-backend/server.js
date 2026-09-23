// badminton-backend/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import connectDB from "./config/DbConfig.js";
import { Server } from "socket.io";

// Import Routes
import productRouter from "./routes/ProductRoutes.js";
import courtRouter from "./routes/CourtRoutes.js";
import bookingRouter from "./routes/BookingRoutes.js";
import authRouter from "./routes/AuthRoutes.js";
import userRouter from "./routes/UserRoutes.js";
import invoiceRouter from "./routes/InvoiceRoutes.js";
import dashboardRouter from "./routes/DashboardRoutes.js";
import fixedScheduleRouter from "./routes/fixedScheduleRoutes.js";
import discountRouter from "./routes/DiscountRoutes.js";

dotenv.config();
connectDB(); // Kết nối MongoDB

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(cors());

app.set("io", io);

// Gắn các API Routes vào đường dẫn chính
app.use("/api/courts", courtRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/invoices", invoiceRouter);
app.use("/api/stats", dashboardRouter);
app.use("/api/fixed-schedules", fixedScheduleRouter);
app.use("/api/discounts", discountRouter);

app.get("/", (req, res) => {
  res.send("Badminton Management API is running...");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});
