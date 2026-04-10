import jwt from "jsonwebtoken";
import userModel from "../models/userModels.js";

const authAdmin = async (req, res, next) => {
  try {
    // ✅ Get token from Authorization header
    const authHeader = req.headers.authorization;

    console.log("authHeader:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token, authorization denied",
      });
    }

    // ✅ Extract token
    const token = authHeader.split(" ")[1];

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id).select("email");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if(user.email !== process.env.ADMIN_EMAIL){
        return res.status(401).json({
        success: false,
        message: "Access denied",
      });
    }

    console.log("decoded:", decoded);

    // ✅ Attach userId safely
    req.user = { id: decoded.id  , email:user.email};

    next();
  } catch (error) {
    console.log("authAdmin error:", error);
    res.status(401).json({
      success: false,
      message: "Token is not valid",
    });
  }
};

export default authAdmin;