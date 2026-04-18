import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDb from "./config/mongodb.js";
import userRouter from "./routes/userRoute.js";
import bookingRouter from "./routes/bookingRoute.js";
import blogRoutes from "./routes/blogRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRouter from "./routes/orderRoutes.js";
import contactRoute from "./routes/contactRoute.js";
import consultationRouter from "./routes/consultationRoute.js";

// App config
const app = express();
const port = process.env.PORT || 4000;

connectDb();

// const allowedOrigins = [
//   process.env.FRONTEND_URL,
//   process.env.CLIENT_URL_PROD,
//   process.env.CLIENT_URL_WWW,
//   "https://aquahari.in",
//   "https://www.aquahari.in",
//   "http://localhost:5173",
//   "http://localhost:3000",
// ]
//   .filter(Boolean)
//   .map((origin) => origin.trim().replace(/\/$/, ""));

// console.log("Allowed Origins:", allowedOrigins);

// const corsOptions = {
//   origin: function (origin, callback) {
//     if (!origin) {
//       return callback(null, true);
//     }

//     const normalizedOrigin = origin.trim().replace(/\/$/, "");
//     console.log("Incoming Origin:", normalizedOrigin);

//     if (allowedOrigins.includes(normalizedOrigin)) {
//       return callback(null, true);
//     }

//     if (
//       normalizedOrigin.endsWith(".vercel.app") ||
//       normalizedOrigin.endsWith(".aquahari.in")
//     ) {
//       return callback(null, true);
//     }

//     console.error("Blocked by CORS:", normalizedOrigin);
//     return callback(null, false);
//   },
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
// };



app.use(cors());
app.use(express.json());

// API end points
app.use("/api/user", userRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/blogs", blogRoutes);
app.use("/api/product", productRoutes);
app.use("/api/payment", orderRouter);
app.use("/api/contact", contactRoute);
app.use("/api/consultation", consultationRouter);

app.get("/", (req, res) => {
  res.status(200).send("API working");
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
  });
});

app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

app.listen(port, () => {
  console.log("server started on PORT:" + port);
});