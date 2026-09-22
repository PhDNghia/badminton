import DiscountModel from "../models/DiscountModel.js";
import InvoiceModel from "../models/InvoiceModel.js";

// Lấy danh sách tất cả mã giảm giá kèm thống kê số lần dùng và tổng tiền giảm từ InvoiceModel
export const getDiscounts = async (req, res) => {
  try {
    // 1. Lấy danh sách mã giảm giá
    const discounts = await DiscountModel.find().sort({ createdAt: -1 }).lean();

    // 2. Gom nhóm thống kê từ InvoiceModel dựa vào discountCode và discountAmount
    const stats = await InvoiceModel.aggregate([
      {
        $match: { discountCode: { $exists: true, $ne: "", $ne: null } },
      },
      {
        $group: {
          _id: "$discountCode",
          usedCount: { $sum: 1 },
          totalDiscountedAmount: { $sum: "$discountAmount" },
        },
      },
    ]);

    // 3. Ghép số liệu thống kê vào danh sách mã giảm giá
    const discountsWithStats = discounts.map((discount) => {
      const foundStat = stats.find(
        (s) => s._id?.toUpperCase() === discount.code.toUpperCase(),
      );
      return {
        ...discount,
        usedCount: foundStat ? foundStat.usedCount : 0,
        totalDiscountedAmount: foundStat ? foundStat.totalDiscountedAmount : 0,
      };
    });

    res.status(200).json({ success: true, data: discountsWithStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Tạo mã giảm giá mới
export const createDiscount = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      maxDiscountValue,
      minOrderValue,
      startDate,
      endDate,
      isActive,
    } = req.body;

    const existing = await DiscountModel.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Mã giảm giá này đã tồn tại!" });
    }

    const newDiscount = new DiscountModel({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      maxDiscountValue: maxDiscountValue || 0,
      minOrderValue: minOrderValue || 0,
      startDate,
      endDate,
      isActive: isActive ?? true,
    });

    await newDiscount.save();
    res.status(201).json({
      success: true,
      message: "Tạo mã giảm giá thành công!",
      data: newDiscount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật mã giảm giá
export const updateDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      discountType,
      discountValue,
      maxDiscountValue,
      minOrderValue,
      startDate,
      endDate,
      isActive,
    } = req.body;

    const updated = await DiscountModel.findByIdAndUpdate(
      id,
      {
        code: code?.toUpperCase(),
        discountType,
        discountValue,
        maxDiscountValue: maxDiscountValue || 0,
        minOrderValue,
        startDate,
        endDate,
        isActive,
      },
      { new: true },
    );

    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy mã giảm giá!" });
    res.status(200).json({
      success: true,
      message: "Cập nhật mã giảm giá thành công!",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xóa mã giảm giá
export const deleteDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await DiscountModel.findByIdAndDelete(id);
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy mã giảm giá!" });

    res
      .status(200)
      .json({ success: true, message: "Đã xóa mã giảm giá thành công!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// API kiểm tra và áp dụng mã giảm giá khi thanh toán (POS)
export const applyDiscount = async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    const discount = await DiscountModel.findOne({
      code: code?.toUpperCase(),
      isActive: true,
    });

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: "Mã giảm giá không tồn tại hoặc đã bị khóa!",
      });
    }

    const now = new Date();
    if (
      now < new Date(discount.startDate) ||
      now > new Date(discount.endDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "Mã giảm giá đã hết hạn hoặc chưa tới thời gian áp dụng!",
      });
    }

    if (orderTotal && orderTotal < discount.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng tối thiểu phải từ ${discount.minOrderValue.toLocaleString()}đ mới được dùng mã này!`,
      });
    }

    // Tính toán số tiền được giảm
    let discountAmount = 0;
    if (discount.discountType === "percentage") {
      const calculated = Math.round(
        (orderTotal * discount.discountValue) / 100,
      );

      // Nếu có cài đặt mức giảm tối đa và số tiền tính ra vượt quá mức đó thì lấy mức tối đa
      if (discount.maxDiscountValue && discount.maxDiscountValue > 0) {
        discountAmount = Math.min(calculated, discount.maxDiscountValue);
      } else {
        discountAmount = calculated;
      }
    } else {
      discountAmount = discount.discountValue; // Giảm tiền mặt trực tiếp
    }

    res.status(200).json({
      success: true,
      message: "Áp dụng mã giảm giá thành công!",
      data: {
        code: discount.code,
        discountType: discount.discountType,
        discountValue: discount.discountValue,
        discountAmount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
