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
import authAdmin from "../middleware/authAdmin.js"

const router = express.Router();
const upload = multer({ storage });

router.post("/",authAdmin ,  upload.single("image") ,  createBlog);
router.get("/", getBlogs);
router.get("/:id", getSingleBlog);
router.put("/:id",authAdmin, upload.single("image") , updateBlog);
router.delete("/:id",authAdmin , deleteBlog);

export default router;