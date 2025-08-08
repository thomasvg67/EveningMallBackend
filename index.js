import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import connectDB from "./config/db.js";

import authRouter from "./routes/authRoutes.js";
import profileRouter from "./routes/profileRoutes.js";
import productRouter from "./routes/productRoutes.js";
import taxonomyRouter from "./routes/Admin/taxonomyRoutes.js";
import cartRouter from "./routes/cartRoutes.js";
import wishlistRouter from "./routes/wishlistRoutes.js";
import filterRouter from "./routes/filterRoutes.js";
import reviewRouter from "./routes/reviewRoutes.js";


import adminRouter from "./routes/Admin/adminRoutes.js";
import productAdminRouter from "./routes/Admin/productRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";
import orderRouter from "./routes/orderRoutes.js";
import homeRouter from "./routes/homeRoutes.js";
import ContactRouter from "./routes/contactRoutes.js";
import TestimonialRouter from "./routes/Admin/testimonialRoutes.js";
import testimonialRouter from "./routes/testimonialPRoutes.js";
import SliderRouter from "./routes/Admin/sliderRouter.js";
import BlogRouter from "./routes/Admin/blogRouter.js";
import blogRouter from "./routes/blogRoutes.js";

dotenv.config();
connectDB();

const app = express();
const fr_url = process.env.FRONTEND_URL ;

app.use(cors({ origin: fr_url, credentials: true }));
app.use(express.json());

app.set('trust proxy', true);

app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);

app.use('/api/admin', adminRouter)
app.use('/api/admin/products', productAdminRouter);
app.use('/api/admin/taxonomy',taxonomyRouter)
app.use('/api/admin/testimonials', TestimonialRouter);
app.use('/api/admin/sliders', SliderRouter);
app.use('/api/admin/blogs', BlogRouter);

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use("/api/products",productRouter)

app.use('/api/cart', cartRouter);

app.use('/api/wishlist', wishlistRouter);

app.use('/api/filter', filterRouter);

app.use('/api/reviews', reviewRouter)

app.use('/api/payment', paymentRouter)
app.use('/api/orders',orderRouter)

app.use('/api/home', homeRouter)

app.use('/api/contact', ContactRouter)

app.use('/api/testimonials', testimonialRouter)

app.use('/api/blogs', blogRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
