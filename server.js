import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 5000;

// static files
app.use(express.static(path.join(__dirname, "public")));

// routes
app.get("/",       (_,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.get("/demo",   (_,res)=>res.sendFile(path.join(__dirname,"public","demo.html")));
app.get("/docs",   (_,res)=>res.sendFile(path.join(__dirname,"public","docs.html")));
app.get("/sign-in",(_,res)=>res.sendFile(path.join(__dirname,"public","sign-in.html")));
app.use((_,res)=>res.sendFile(path.join(__dirname,"public","index.html")));

app.listen(PORT, () => console.log(`Skyla site running on http://localhost:${PORT}`));