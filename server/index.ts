import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ✅ Request logging & response capture
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${path} ${res.statusCode} - ${duration}ms`);
  });

  next();
});

(async () => {
  // ✅ Register all API routes
  const server = await registerRoutes(app);

  // ✅ Setup Vite dev server or static production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ✅ Listen safely on 127.0.0.1 instead of 0.0.0.0 for local dev
  const PORT = process.env.PORT || 5000;
  server.listen(
    Number(PORT),
    "127.0.0.1",
    () => {
      log(`✅ Server running at http://127.0.0.1:${PORT}`);
    }
  );
})();

