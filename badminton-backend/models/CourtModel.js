// badminton-backend/models/CourtModel.js
import mongoose from "mongoose";

const courtSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // VD: Sân 1, Sân 2
    type: { type: String, default: "Sân thảm PVC" }, // Loại sân
    status: {
      type: String,
      enum: ["active", "maintenance"],
      default: "active",
    }, // Hoạt động hay đang bảo trì
  },
  { timestamps: true },
);

export default mongoose.model("Court", courtSchema);
