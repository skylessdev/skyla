import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ✅ Request logging & response capture
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;

  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${reqPath} ${res.statusCode} - ${duration}ms`);
  });

  next();
});

(async () => {
  // ✅ Register all API routes
  const server = await registerRoutes(app);

  const PORT = process.env.PORT || 5000;
  const HOST = "0.0.0.0";

  if (app.get("env") === "development" || process.env.NODE_ENV === "development") {
    await setupVite(app, server);
    log(`🟢 [DEV] Vite middleware enabled. Running at http://localhost:${PORT}`);
  } else {
    // Serve static files from client/dist
    const distPath = path.resolve(__dirname, "../client/dist");
    app.use(express.static(distPath));

    // Fallback: serve index.html for any unmatched route
    app.get("*", (req, res) => {
      const indexFile = path.join(distPath, "index.html");
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send("index.html not found");
      }
    });
    log(`🟣 [PROD] Serving static files from ${distPath}`);
    log(`🟣 [PROD] Fallback to index.html for SPA routes.`);
  }

  server.listen(Number(PORT), HOST, () => {
    log(`✅ Server running at http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}`);
  });
})();

