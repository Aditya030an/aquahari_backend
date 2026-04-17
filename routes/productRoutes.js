import express from "express";
import multer from "multer";
import { storage } from "../config/cloudinary.js";
import {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import authUser from "../middleware/auth.js";

const router = express.Router();

// 🔥 IMPORTANT: multiple images
const upload = multer({ storage });

router.post(
  "/addProduct",
  authUser,
  upload.array("images", 10), // 👈 max 10 images
  createProduct
);

router.get("/", getProducts);

router.put(
  "/:id",
  authUser,
  upload.array("images", 10),
  updateProduct
);

router.delete("/deleteProduct/:id", authUser, deleteProduct);

export default router;