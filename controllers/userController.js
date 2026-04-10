import express from "express";
import userModel from "../models/userModels.js";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendLocationAlertEmails, sendResetPasswordEmail } from "../utils/sendEmail.js";
import sendSMS from "../utils/sendSMS.js";

const createToken = (id, email) => {
  return jwt.sign({ id, email }, process.env.JWT_SECRET);
};

const createResetToken = (id, email) => {
  return jwt.sign(
    { id, email, purpose: "reset_password" },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

//Route for user login
const loginUser = async (req, res) => {
  try {
    console.log("req body", req.body);
    const { email, password, value, updatePassword } = req.body;

    const user = await userModel.findOne({ email });
    console.log("user", user);
    if (!user) {
      return res.json({ success: false, message: "User does not exist" });
    }

    if (value === "login") {
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Invalid credentials", success: false });
      }
    }
    if (updatePassword) {
      const hashPassword = await bcrypt.hash(password, 10);
      user.password = hashPassword;
      user.passwordChangedAt = new Date();
      await user.save();

      return res.status(200).json({
        message: "Password updated successfully",
        success: true,
      });
    }

    const token = await createToken(user?._id, user?.email);

    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
    };

    res.status(200).json({
      message: "Login Successfully",
      user: safeUser,
      success: true,
      token,
    });

    // sendEmailOtp(user.email, otp).catch(err => console.log(err));
  } catch (error) {
    console.log("loginUser error:", error);
    res.json({ message: error.message });
  }
};

//Router for user registration
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phoneNumber, role } = req.body;
    console.log("req.body in signup", req.body);
    //checking user already exist
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.json({ message: "User Already exist", success: false });
    }

    const phoneNumberExist = await userModel.findOne({ phoneNumber });
    if (phoneNumberExist) {
      return res.json({
        message: "User Phone Number Already exist",
        success: false,
      });
    }

    //validing email format and strong passward
    if (!validator.isEmail(email)) {
      return res.json({ message: "Enter a valid email", success: false });
    }
    if (password.length < 6) {
      return res.json({
        message: "Please enter a strong password",
        success: false,
      });
    }
    if (phoneNumber.length < 10) {
      return res.json({
        message: "Please enter a valid phone number",
        success: false,
      });
    }
    const hashPassword = await bcrypt.hash(password, 10);

    const newUser = new userModel({
      name,
      email,
      password: hashPassword,
      phoneNumber,
    });

    const user = await newUser.save();

    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
    };

    const token = await createToken(user._id, user?.email);
    return res.json({ success: true, token, user: safeUser });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
const verifiedOtp = async (req, res) => {
  console.log("req", req.body);
  try {
    const { email, otp } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.otp === otp && user.otpExpires > new Date()) {
      user.isVerified = true;
      await user.save();
      const token = await createToken(user?._id, user?.email);
      res.json({
        success: true,
        user,
        role: user.role,
        token,
        message: "OTP verified Successfully",
      });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }
  } catch (error) {
    console.log(error);
    res.json({ message: error.message });
  }
};

const getUser = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("req user id", userId);
    const user = await userModel.findById(userId).select("-password");
    console.log("user", user);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const sendLocationToAdmin = async (req, res) => {
  try {
    const { email, latitude, longitude } = req.body;
    if (!email || !latitude || !longitude) {
      return res.status(400).json({ success: false, message: "Missing data" });
    }
    const user = await userModel.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    await sendLocationAlertEmails(email, latitude, longitude);
    res.status(200).json({ success: true, message: "Location sent to admin" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Send reset password link
const sendResetPasswordLink = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("sendResetPasswordLink req.body:", req.body);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email",
      });
    }

    const user = await userModel.findOne({ email });

    // keep response generic so auth flow is not weakened
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If the email exists, a reset link has been sent",
      });
    }

    const resetToken = createResetToken(user._id, user.email);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    const resetLink = `${frontendUrl}/reset-password/${resetToken}`;

    console.log("Generated reset link:", resetLink);

    // Replace this with your real email sender helper/template
    await sendResetPasswordEmail(email, resetLink);

    return res.status(200).json({
      success: true,
      message: "If the email exists, a reset link has been sent",
    });
  } catch (error) {
    console.log("sendResetPasswordLink error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send reset link",
    });
  }
};

// Reset password with JWT token
const resetPasswordWithToken = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    console.log("resetPasswordWithToken params:", req.params);
    console.log("resetPasswordWithToken body:", req.body);

    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and confirm password are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Reset link is invalid or expired",
      });
    }

    if (decoded.purpose !== "reset_password") {
      return res.status(400).json({
        success: false,
        message: "Invalid reset token",
      });
    }

    const user = await userModel.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);
    user.password = hashPassword;
    user.passwordChangedAt = new Date();

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.log("resetPasswordWithToken error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Password reset failed",
    });
  }
};

export {
  loginUser,
  registerUser,
  verifiedOtp,
  getUser,
  sendLocationToAdmin,
  sendResetPasswordLink,
  resetPasswordWithToken,
};
