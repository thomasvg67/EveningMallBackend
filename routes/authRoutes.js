import express from "express";
import { register, login, logout, verifyUser } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.get("/verify/:id", verifyUser); //
authRouter.post("/login", login);
authRouter.post("/logout", protect(), logout);

export default authRouter;
