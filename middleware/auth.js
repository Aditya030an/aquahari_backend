import jwt from "jsonwebtoken";

const authUser = async (req, res, next) => {
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

    console.log("decoded:", decoded);

    // ✅ Attach userId safely
     req.user = {
      id: decoded.id,
      email: decoded.email,
    };

    next();
  } catch (error) {
    console.log("authUser error:",error);
    res.status(401).json({
      success: false,
      message: "Token is not valid",
    });
  }
};

export default authUser;