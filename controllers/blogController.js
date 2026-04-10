import Blog from "../models/blogModel.js";

// CREATE
export const createBlog = async (req, res) => {
  try {
    console.log("req.body", req.body);
    console.log("req.file?.path", req.file?.path);
    console.log("req.user", req.user);

    const { title, tag, description, content } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    if (!tag?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Tag is required",
      });
    }

    if (!description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Description is required",
      });
    }

    if (!content?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Content is required",
      });
    }

    if (!req.file?.path) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    const blog = new Blog({
      title: title.trim(),
      tag: tag.trim(),
      description: description.trim(),
      content: content.trim(),
      image_url: req.file.path,
    });

    await blog.save();

    return res.status(201).json({
      success: true,
      message: "Blog created successfully",
      blog,
    });
  } catch (err) {
    console.log("createBlog error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// GET ALL
export const getBlogs = async (req, res) => {
  const blogs = await Blog.find().sort({ createdAt: -1 });
  res.json(blogs);
};

// GET SINGLE
export const getSingleBlog = async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  res.json(blog);
};

// UPDATE
export const updateBlog = async (req, res) => {
  try {
    console.log("update req.body", req.body);
    console.log("update req.file?.path", req.file?.path);
    console.log("update req.user", req.user);

    const { id } = req.params;
    const { title, tag, description, content } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    if (!tag?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Tag is required",
      });
    }

    if (!description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Description is required",
      });
    }

    if (!content?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Content is required",
      });
    }

    const existingBlog = await Blog.findById(id);

    if (!existingBlog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    existingBlog.title = title.trim();
    existingBlog.tag = tag.trim();
    existingBlog.description = description.trim();
    existingBlog.content = content.trim();

    if (req.file?.path) {
      existingBlog.image_url = req.file.path;
    }

    await existingBlog.save();

    return res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      blog: existingBlog,
    });
  } catch (err) {
    console.log("updateBlog error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// DELETE
export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    await Blog.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (err) {
    console.log("deleteBlog error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};