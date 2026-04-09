import express from "express";
import multer from "multer";
import { storage } from "../config/cloudinary.js";
import {
  createBlog,
  getBlogs,
  getSingleBlog,
  updateBlog,
  deleteBlog,
} from "../controllers/blogController.js";

const router = express.Router();
const upload = multer({ storage });

router.post("/", upload.single("image"), createBlog);
router.get("/", getBlogs);
router.get("/:id", getSingleBlog);
router.put("/:id", upload.single("image"), updateBlog);
router.delete("/:id", deleteBlog);

export default router;