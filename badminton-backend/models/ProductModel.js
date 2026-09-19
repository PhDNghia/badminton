// badminton-backend/models/ProductModel.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // VD: Nước suối Aquafina, Ống cầu Thiên Long
    category: {
      type: String,
      enum: ["drink", "shuttlecock", "accessory", "clothing"],
      required: true,
    },
    price: { type: Number, required: true }, // Giá bán
    stock: { type: Number, required: true, default: 0 }, // Số lượng tồn kho (để trừ tự động)
  },
  { timestamps: true },
);

export default mongoose.model("Product", productSchema);
    