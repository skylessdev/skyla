import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 5000;

// view engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// static files
app.use(express.static(path.join(__dirname, "public")));

// routes
app.get("/", (req, res) => res.render("index"));
app.get("/demo", (req, res) => res.render("demo"));
app.get("/docs", (req, res) => res.render("docs"));
app.get("/sign-in", (req, res) => res.render("sign-in"));
app.use((_, res) => res.render("index"));

app.listen(PORT, () => console.log(`Skyla site running on http://localhost:${PORT}`));