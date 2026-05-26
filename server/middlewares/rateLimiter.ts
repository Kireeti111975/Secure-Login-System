import rateLimit from "express-rate-limit";

/**
 * Standard security rate-limiter for endpoints handling authentication.
 * Limits repeated authentication requests to prevent brute-force scenarios.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 authentication attempts per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again after 15 minutes.",
  },
});
