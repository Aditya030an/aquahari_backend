import Product from "../models/productModels.js";
import { cloudinary } from "../config/cloudinary.js";

export const createProduct = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    // ✅ Validate required fields
    const { name, description , quantity } = req.body;

    console.log("quantity" , quantity);

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: "Name and description are required",
      });
    }

    // ✅ Handle images safely
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => ({
        url: file.path,
        public_id: file.filename,
      }));
    } else {
      return res.status(400).json({
        success: false,
        message: "At least 1 image is required",
      });
    }

    // ✅ Handle variants safely
    let variants = [];
    try {
      variants = JSON.parse(req.body.variants);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Invalid variants format",
      });
    }

    // ✅ Validate variants
    if (!variants.length) {
      return res.status(400).json({
        success: false,
        message: "At least 1 variant is required",
      });
    }

    const isInvalidVariant = variants.some(
      (v) => !v.label || !v.price
    );

    if (isInvalidVariant) {
      return res.status(400).json({
        success: false,
        message: "Each variant must have label and price",
      });
    }

    // ✅ Create product
    const product = await Product.create({
      name,
      description,
      quantity,
      variants,
      images,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });

  } catch (err) {
    console.error("CREATE PRODUCT ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

export const getProducts = async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
};



export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    // 🔥 Remove selected images
    if (req.body.removedImages) {
      const removed = JSON.parse(req.body.removedImages);

      for (let img of removed) {
        await cloudinary.uploader.destroy(img.public_id);
      }

      product.images = product.images.filter(
        (img) =>
          !removed.some((r) => r.public_id === img.public_id)
      );
    }

    // 🆕 Add new images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => ({
        url: file.path,
        public_id: file.filename,
      }));

      product.images.push(...newImages);
    }

    // update fields
    product.name = req.body.name || product.name;
    product.description = req.body.description || product.description;
    product.price = req.body.price || product.price;
    product.discount = req.body.discount || product.discount;

    await product.save();

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    // 🔥 delete all images
    for (let img of product.images) {
      await cloudinary.uploader.destroy(img.public_id);
    }

    await product.deleteOne();

    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};