import Product from "../models/productModels.js";
import { cloudinary } from "../config/cloudinary.js";

export const createProduct = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    // ✅ Validate required fields
    const {
      name,
      description,
      capacity,
      price,
      baseDeliveryPrice,
      deliveryPricePerBottle,
      discount,
    } = req.body;

    // console.log("quantity", quantity);

    if (
      !name ||
      !description ||
      capacity === undefined ||
      price === undefined ||
      baseDeliveryPrice === undefined ||
      deliveryPricePerBottle === undefined ||
      discount === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, description, quantity, price, base delivery price, delivery price per bottle and discount are required",
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

    // ✅ Create product
    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      capacity: capacity,
      price: Number(price),
      baseDeliveryPrice: Number(baseDeliveryPrice),
      deliveryPricePerBottle: Number(deliveryPricePerBottle),
      discount: Number(discount),
      images,
    });

    console.log("product inside backend" , product);

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
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    return res.status(200).json(products);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: err.message,
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // 🔥 Remove selected images
    if (req.body.removedImages) {
      const removed = JSON.parse(req.body.removedImages);

      for (let img of removed) {
        await cloudinary.uploader.destroy(img.public_id);
      }

      product.images = product.images.filter(
        (img) => !removed.some((r) => r.public_id === img.public_id),
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
    if (req.body.name !== undefined) product.name = req.body.name.trim();
    if (req.body.description !== undefined) {
      product.description = req.body.description.trim();
    }
    if (req.body.capacity !== undefined) {
      product.capacity = Number(req.body.capacity);
    }
    if (req.body.price !== undefined) {
      product.price = Number(req.body.price);
    }
    if (req.body.baseDeliveryPrice !== undefined) {
      product.baseDeliveryPrice = Number(req.body.baseDeliveryPrice);
    }
    if (req.body.deliveryPricePerBottle !== undefined) {
      product.deliveryPricePerBottle = Number(req.body.deliveryPricePerBottle);
    }
    if (req.body.discount !== undefined) {
      product.discount = Number(req.body.discount);
    }

    await product.save();
    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: err.message,
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // 🔥 delete all images
    for (let img of product.images) {
      await cloudinary.uploader.destroy(img.public_id);
    }

    await product.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Product deleted",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: err.message,
    });
  }
};
