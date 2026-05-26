import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { Database, User } from "../db.js";
import { AuthenticatedRequest } from "../middlewares/auth.js";

const JWT_SECRET = process.env.JWT_SECRET || "secure_login_system_backup_secret_key_842957106";

// Strict patterns for backend input sanitization
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

/**
 * Helper to sign JWT authentication token.
 */
function generateToken(userId: string, rememberMe: boolean): string {
  const expiresIn = rememberMe ? "30d" : "24h";
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn });
}

/**
 * Controller class managing secure auth actions.
 */
export class AuthController {
  /**
   * Register a new user with strong password checks.
   */
  public static async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, confirmPassword } = req.body;

      // 1. Sanitize and validate inputs
      if (!name || typeof name !== "string" || name.trim().length < 2) {
        res.status(400).json({
          success: false,
          message: "Please enter a valid name (minimum 2 characters).",
        });
        return;
      }

      if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
        res.status(400).json({
          success: false,
          message: "Please enter a valid email address.",
        });
        return;
      }

      if (!password || typeof password !== "string" || !confirmPassword || typeof confirmPassword !== "string") {
        res.status(400).json({
          success: false,
          message: "All password fields are required.",
        });
        return;
      }

      const trimmedName = name.trim();
      const sanitizedEmail = email.trim().toLowerCase();

      // 2. Validate passwords match
      if (password !== confirmPassword) {
        res.status(400).json({
          success: false,
          message: "Passwords do not match.",
        });
        return;
      }

      // 3. Enforce strict enterprise password rules
      if (!PASSWORD_REGEX.test(password)) {
        res.status(400).json({
          success: false,
          message: "Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character.",
        });
        return;
      }

      // 4. Duplicate checks
      const existingUser = Database.findOne({ email: sanitizedEmail });
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: "A user account is already registered with this email.",
        });
        return;
      }

      // 5. Secure hashing with salt
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      // 6. DB creation and ID generation
      const userId = "usr_" + Math.random().toString(36).substring(2, 15);
      const newUser = Database.create({
        id: userId,
        name: trimmedName,
        email: sanitizedEmail,
        hashedPassword,
        createdAt: new Date().toISOString(),
        twoFactorEnabled: false,
      });

      res.status(201).json({
        success: true,
        message: "Account created successfully. You can now log in.",
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        message: "An internal server error occurred. Please try again later.",
      });
    }
  }

  /**
   * Secure user login with lockout parameters.
   */
  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, rememberMe } = req.body;

      if (!email || typeof email !== "string" || !password || typeof password !== "string") {
        res.status(400).json({
          success: false,
          message: "Email and password are required.",
        });
        return;
      }

      const sanitizedEmail = email.trim().toLowerCase();
      const user = Database.findOne({ email: sanitizedEmail });

      // If user does not exist, use a generic error but simulate a dummy bcrypt compare to defend against timing attacks.
      if (!user) {
        await bcrypt.compare("dummy_password_for_hashes_safety", "$2b$12$DUMMY_SALT_FOR_ENHANCED_TIMING_SAFETY_NOT_A_REAL_PASS_KEY");
        res.status(401).json({
          success: false,
          message: "Invalid credentials.",
        });
        return;
      }

      // Brute Force Protection Account Status Lock verification
      if (user.lockoutUntil) {
        const lockoutTime = new Date(user.lockoutUntil);
        if (new Date() < lockoutTime) {
          const waitMinutes = Math.ceil((lockoutTime.getTime() - Date.now()) / 60000);
          res.status(403).json({
            success: false,
            message: `This account is temporarily locked due to successive failed login attempts. Please try again in ${waitMinutes} minute(s).`,
          });
          return;
        } else {
          // Lockout period has passed; reset metrics
          Database.updateOne(user.id, {
            failedLoginAttempts: 0,
            lockoutUntil: null,
          });
          user.failedLoginAttempts = 0;
          user.lockoutUntil = null;
        }
      }

      // Verify the credentials
      const isMatch = await bcrypt.compare(password, user.hashedPassword);

      if (!isMatch) {
        // Record failed attempt
        const attempts = user.failedLoginAttempts + 1;
        let lockoutUntil: string | null = null;
        let finalMessage = "Invalid credentials.";

        if (attempts >= 5) {
          // Lock account for 15 minutes on the 5th attempt
          lockoutUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
          finalMessage = "Too many failed attempts. This account has been locked for 15 minutes to protect its security.";
        }

        Database.updateOne(user.id, {
          failedLoginAttempts: attempts,
          lockoutUntil,
        });

        res.status(401).json({
          success: false,
          message: finalMessage,
        });
        return;
      }

      // Reset lockout & failed count
      Database.updateOne(user.id, {
        failedLoginAttempts: 0,
        lockoutUntil: null,
      });

      // 2FA enforcement verify step
      if (user.twoFactorEnabled) {
        res.status(200).json({
          success: true,
          requires2FA: true,
          userId: user.id,
          email: user.email,
        });
        return;
      }

      // Regular setup flow: issue secure JWT HTTP-Only token cookie
      const token = generateToken(user.id, !!rememberMe);
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, // 30 days vs 1 day
      };

      res.cookie("auth_token", token, cookieOptions);

      res.status(200).json({
        success: true,
        message: "Logged in successfully.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          twoFactorEnabled: false,
        },
      });
    } catch (error) {
      console.error("Login controller error:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred during authentication. Please try again.",
      });
    }
  }

  /**
   * Log out session, clearing authentication cookies safely.
   */
  public static async logout(req: Request, res: Response): Promise<void> {
    try {
      res.clearCookie("auth_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
      });

      res.status(200).json({
        success: true,
        message: "Logged out successfully.",
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred during sign out.",
      });
    }
  }

  /**
   * Obtain authenticated user info.
   */
  public static async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized login state." });
      return;
    }

    res.status(200).json({
      success: true,
      user: req.user,
    });
  }

  /**
   * Generates a unique 2FA Authenticator TOTP setup token & QR Code data.
   */
  public static async setup2FA(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Unauthorized session." });
        return;
      }

      const user = Database.findOne({ id: req.user.id });
      if (!user) {
        res.status(404).json({ success: false, message: "User not found." });
        return;
      }

      // Generate a structured Base32 TOTP secret Key
      const secret = speakeasy.generateSecret({
        length: 20,
        name: `SecureLoginSystem:${user.email}`,
        issuer: "Secure Login System",
      });

      // Save secret temporarily inside memory or db. Wait to enable till they confirm!
      // This is dynamic, so if they fail verification or back out, 2FA is not bricked.
      Database.updateOne(user.id, {
        twoFactorSecret: secret.base32,
      });

      // Render the OTP Auth URI string as an interactive QR Code PNG DataURL
      const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url || "");

      res.status(200).json({
        success: true,
        qrCodeUrl,
        secret: secret.base32,
      });
    } catch (error) {
      console.error("2FA setup error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate two-factor authenticator setup configurations.",
      });
    }
  }

  /**
   * Confirms 2FA setup and enables it inside database upon initial verification.
   */
  public static async activate2FA(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Unauthorized session." });
        return;
      }

      const { code } = req.body;
      if (!code || typeof code !== "string") {
        res.status(400).json({ success: false, message: "A valid verification token must be entered." });
        return;
      }

      const user = Database.findOne({ id: req.user.id });
      if (!user || !user.twoFactorSecret) {
        res.status(400).json({ success: false, message: "Secret key not configured. Start the setup again." });
        return;
      }

      // Verify the supplied TOTP code
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: code.trim(),
        window: 1, // Tolerance window of 1 step before/after (30s drift check)
      });

      if (!verified) {
        res.status(400).json({ success: false, message: "Invalid code. Please double check and enter your authenticator key again." });
        return;
      }

      // Enable 2FA permanency
      Database.updateOne(user.id, {
        twoFactorEnabled: true,
      });

      res.status(200).json({
        success: true,
        message: "Two-Factor Authentication is now enabled on this account.",
      });
    } catch (error) {
      console.error("2FA activation error:", error);
      res.status(500).json({ success: false, message: "An error occurred activating Two-Factor Authenticator." });
    }
  }

  /**
   * Disables 2FA from dashboard settings.
   */
  public static async disable2FA(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Unauthorized session." });
        return;
      }

      const user = Database.findOne({ id: req.user.id });
      if (!user) {
        res.status(404).json({ success: false, message: "User not found." });
        return;
      }

      Database.updateOne(user.id, {
        twoFactorEnabled: false,
        twoFactorSecret: undefined,
      });

      res.status(200).json({
        success: true,
        message: "Two-Factor Authentication is now disabled successfully.",
      });
    } catch (error) {
      console.error("2FA disable error:", error);
      res.status(500).json({ success: false, message: "Failed to turn off Two-Factor Authentication." });
    }
  }

  /**
   * Verifies OTP code after matching email and password.
   */
  public static async verify2FALogin(req: Request, res: Response): Promise<void> {
    try {
      const { userId, code, rememberMe } = req.body;

      if (!userId || typeof userId !== "string" || !code || typeof code !== "string") {
        res.status(400).json({
          success: false,
          message: "Please fill in all requested fields.",
        });
        return;
      }

      const user = Database.findOne({ id: userId });
      if (!user || !user.twoFactorSecret || !user.twoFactorEnabled) {
        res.status(400).json({
          success: false,
          message: "Unable to authorize 2FA credentials at this state.",
        });
        return;
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: code.trim(),
        window: 1,
      });

      if (!verified) {
        res.status(401).json({
          success: false,
          message: "Invalid secondary numeric token code. Please try again.",
        });
        return;
      }

      // Success: Issue regular final authenticated token
      const token = generateToken(user.id, !!rememberMe);
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
      };

      res.cookie("auth_token", token, cookieOptions);

      res.status(200).json({
        success: true,
        message: "Logged in successfully.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          twoFactorEnabled: true,
        },
      });
    } catch (error) {
      console.error("Verify login 2FA error:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred verifying authenticator. Please try again.",
      });
    }
  }
}
