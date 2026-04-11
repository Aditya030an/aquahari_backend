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
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin like Postman/mobile apps
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

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

app.listen(port , ()=>{
    console.log("server started on PORT:" + port)
})

