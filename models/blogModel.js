import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: String,
    tag: String,
    description: String,
    content: String,
    image_url: String,
  },
  { timestamps: true }
);

export default mongoose.model("Blog", blogSchema);