import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Database } from "../db.js";

// Ensure a fallback secret key in case it is omitted from environment variables
const JWT_SECRET = process.env.JWT_SECRET || "secure_login_system_backup_secret_key_842957106";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    twoFactorEnabled: boolean;
  };
}

/**
 * Secures routes ensuring requests contain a valid JWT inside of secure HTTP-Only Cookies.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.auth_token;

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
      return;
    }

    // Verify token validity
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    // Retrieve associated user records from persistence layer
    const user = Database.findOne({ id: decoded.userId });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid session user. Please sign in again.",
      });
      return;
    }

    // Attach user payload to the request object (excluding password & 2FA raw secret parameters)
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      twoFactorEnabled: user.twoFactorEnabled,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
      return;
    }
    
    res.status(401).json({
      success: false,
      message: "Invalid session token. Please authenticate again.",
    });
  }
}
