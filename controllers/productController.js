import Product from "../models/productModels.js";
import { cloudinary } from "../config/cloudinary.js";

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      capacity,
      price,
      baseDeliveryPrice,
      deliveryPricePerBottle,
      discount,
    } = req.body;

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
          "Name, description, capacity, price, base delivery price, delivery price per bottle and discount are required",
      });
    }

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

    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      capacity: capacity.trim(),
      price: Number(price),
      baseDeliveryPrice: Number(baseDeliveryPrice),
      deliveryPricePerBottle: Number(deliveryPricePerBottle),
      discount: Number(discount),
      images,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (err) {
    console.error("CREATE PRODUCT ERROR:", err);

    return res.status(500).json({
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
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const {
      name,
      description,
      capacity,
      price,
      baseDeliveryPrice,
      deliveryPricePerBottle,
      discount,
      removedImages,
      existingImagesOrder,
    } = req.body;

    // 1) remove selected old images from cloudinary
    let removed = [];
    if (removedImages) {
      try {
        removed = JSON.parse(removedImages);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid removedImages format",
        });
      }

      for (const img of removed) {
        if (img?.public_id) {
          await cloudinary.uploader.destroy(img.public_id);
        }
      }
    }

    // existing images after removal
    let remainingExistingImages = product.images.filter(
      (img) => !removed.some((r) => r.public_id === img.public_id)
    );

    // 2) reorder remaining existing images according to frontend
    if (existingImagesOrder) {
      let parsedExistingOrder = [];

      try {
        parsedExistingOrder = JSON.parse(existingImagesOrder);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid existingImagesOrder format",
        });
      }

      const orderedExisting = [];
      for (const orderedImg of parsedExistingOrder) {
        const found = remainingExistingImages.find(
          (img) => img.public_id === orderedImg.public_id
        );
        if (found) orderedExisting.push(found);
      }

      remainingExistingImages = orderedExisting;
    }

    // 3) append newly uploaded images at the positions after existing order
    let newImages = [];
    if (req.files && req.files.length > 0) {
      newImages = req.files.map((file) => ({
        url: file.path,
        public_id: file.filename,
      }));
    }

    const finalImages = [...remainingExistingImages, ...newImages];

    if (finalImages.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least 1 image is required",
      });
    }

    // 4) update body fields
    if (name !== undefined) product.name = name.trim();
    if (description !== undefined) product.description = description.trim();
    if (capacity !== undefined) product.capacity = capacity.trim();
    if (price !== undefined) product.price = Number(price);
    if (baseDeliveryPrice !== undefined) {
      product.baseDeliveryPrice = Number(baseDeliveryPrice);
    }
    if (deliveryPricePerBottle !== undefined) {
      product.deliveryPricePerBottle = Number(deliveryPricePerBottle);
    }
    if (discount !== undefined) product.discount = Number(discount);

    product.images = finalImages;

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (err) {
    console.error("UPDATE PRODUCT ERROR:", err);
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