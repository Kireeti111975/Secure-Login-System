import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./server/routes/authRoutes.js";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Let Express trust upstream proxies (e.g., Cloud Run reverse proxy)
  // Essential for allowing HTTPS cookies to be marked secure through the proxy layers
  app.set("trust proxy", 1);

  // Apply helmet for secure HTTP headers. Custom CSP config preserves styled rendering in prod
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === "production" ? {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https://*"],
          connectSrc: ["'self'", "*"],
        },
      } : false,
      crossOriginOpenerPolicy: { policy: "same-origin" },
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  // CORS protection
  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Mount API Authentication routes
  app.use("/api/auth", authRoutes);

  // Serve static assets / handle Vite SPA routes
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind to server and port 3000
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Secure Login Backend] listening on 0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Critical server startup crash:", error);
});
