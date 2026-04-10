import jwt from "jsonwebtoken";
import userModel from "../models/userModels.js";

const authAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("authHeader:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token, authorization denied",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("decoded:", decoded);

    const user = await userModel.findById(decoded.id).select("email");
    console.log("DB user:", user);
    console.log("DB user email raw:", user?.email);
    console.log("ENV admin email raw:", process.env.ADMIN_EMAIL);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const dbEmail = user.email?.trim().toLowerCase();
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

    console.log("Normalized DB email:", dbEmail);
    console.log("Normalized ENV admin email:", adminEmail);
    console.log("Email match:", dbEmail === adminEmail);

    if (dbEmail !== adminEmail) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    req.user = {
      id: decoded.id,
      email: user.email,
    };

    next();
  } catch (error) {
    console.log("authAdmin error:", error);
    return res.status(401).json({
      success: false,
      message: "Token is not valid",
    });
  }
};

export default authAdmin;