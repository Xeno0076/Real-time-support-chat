import express from "express";
import { register, login, getMe, demoLogin } from "../controllers/authController.ts";
import { authenticateToken } from "../middleware/auth.ts";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticateToken, getMe);
router.post("/demo-login", demoLogin);

export default router;
