import express from "express";
import cors from "cors";
import 'dotenv/config'
import connectDb from "./config/mongodb.js";
import userRouter from "./routes/userRoute.js";
import bookingRouter from "./routes/bookingRoute.js";
import blogRoutes from "./routes/blogRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRouter from "./routes/orderRoutes.js";
import contactRoute from "./routes/contactRoute.js";
import consultationRouter from "./routes/consultationRoute.js";
import axios from "axios";

//App config
const app = express();
const port = process.env.PORT || 4000;

connectDb();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL_PROD,
  process.env.CLIENT_URL_WWW,
   "https://aquahari.in",
  "https://www.aquahari.in",
  "http://localhost:5173",
  "http://localhost:3000",
]  .filter(Boolean)
  .map((origin) => origin.trim().replace(/\/$/, ""));

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests without origin like Postman, mobile apps, server-to-server
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.trim().replace(/\/$/, "");
    console.log("Incoming Origin:", normalizedOrigin);

    // Allow exact configured origins
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    // Allow Vercel preview deployments optionally
    if (
      normalizedOrigin.endsWith(".vercel.app") ||
      normalizedOrigin.endsWith(".aquahari.in")
    ) {
      return callback(null, true);
    }

    console.error("Blocked by CORS:", normalizedOrigin);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());

//api end points
app.use("/api/user" , userRouter);
app.use("/api/booking" , bookingRouter);
app.use("/api/blogs", blogRoutes);
app.use("/api/product" , productRoutes);
app.use("/api/payment" , orderRouter);
app.use("/api/contact", contactRoute);
app.use("/api/consultation", consultationRouter);


app.get("/" ,(req , res)=>{
    res.send("API working")
})

// Optional health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

app.listen(port , ()=>{
    console.log("server started on PORT:" + port)
})

