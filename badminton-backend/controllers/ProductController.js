// badminton-backend/controllers/ProductController.js
import ProductModel from "../models/ProductModel.js";

// Lấy danh sách sản phẩm (Hỗ trợ tìm kiếm theo tên và lọc theo danh mục)
export const getProducts = async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = {};

    // Tìm kiếm theo tên (không phân biệt hoa thường)
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    // Lọc theo danh mục nếu có
    if (category && category !== "all") {
      query.category = category;
    }

    const products = await ProductModel.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Thêm sản phẩm mới
export const createProduct = async (req, res) => {
  try {
    const { name, category, price, stock } = req.body;
    const newProduct = new ProductModel({ name, category, price, stock });
    await newProduct.save();
    res.status(201).json({
      success: true,
      message: "Thêm sản phẩm thành công!",
      data: newProduct,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật sản phẩm
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, stock } = req.body;

    const updatedProduct = await ProductModel.findByIdAndUpdate(
      id,
      { name, category, price, stock },
      { new: true },
    );

    if (!updatedProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sản phẩm!" });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật sản phẩm thành công!",
      data: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xóa sản phẩm
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await ProductModel.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sản phẩm!" });
    }

    res
      .status(200)
      .json({ success: true, message: "Đã xóa sản phẩm thành công!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
