import { Router } from "express";
import { AuthController } from "../controllers/authController.js";
import { requireAuth } from "../middlewares/auth.js";
import { authRateLimiter } from "../middlewares/rateLimiter.js";

const router = Router();

// 1. Core Public Routes (rate limited)
router.post("/register", authRateLimiter, AuthController.register);
router.post("/login", authRateLimiter, AuthController.login);
router.post("/verify-2fa", authRateLimiter, AuthController.verify2FALogin);

// 2. Core Public Session Routes
router.post("/logout", AuthController.logout);

// 3. Protected Session Session Routes
router.get("/me", requireAuth, AuthController.me);

// 4. Two Factor Authorization Settings Routes
router.post("/setup-2fa", requireAuth, AuthController.setup2FA);
router.post("/activate-2fa", requireAuth, AuthController.activate2FA);
router.post("/disable-2fa", requireAuth, AuthController.disable2FA);

export default router;
