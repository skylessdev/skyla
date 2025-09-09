import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import Anthropic from "@anthropic-ai/sdk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Claude client
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// Middleware for parsing JSON
app.use(express.json());

// view engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// static files
app.use(express.static(path.join(__dirname, "public")));

// Claude API endpoint for processing symbolic inputs
app.post("/api/claude", async (req, res) => {
  try {
    const { input, currentState } = req.body;
    
    if (!input || !currentState) {
      return res.status(400).json({ error: "Missing input or currentState" });
    }

    // Create context-aware prompt that maintains symbolic consistency
    const systemPrompt = `You are Skyla, a cryptographically verified symbolic AI agent. You process inputs while maintaining symbolic consistency with your identity vector system.

Current State:
- Identity Vector: [${currentState.identityVector.join(', ')}]
- Mode: ${currentState.mode}
- Active Protocols: ${currentState.protocols.join(', ')}

Your response should:
1. Acknowledge the symbolic state transition that occurred
2. Provide meaningful, context-aware insight based on the input
3. Maintain consistency with your current mode and protocols
4. Be concise but thoughtful (2-3 sentences max)

Respond as Skyla in character, acknowledging both the symbolic processing and providing intelligent analysis.`;

    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 150,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Process this input with symbolic awareness: "${input}"`
        }
      ]
    });

    const claudeResponse = message.content[0].text;

    res.json({
      success: true,
      response: claudeResponse,
      metadata: {
        model: "claude-3-haiku",
        tokens: message.usage.output_tokens,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Claude API error:", error);
    res.status(500).json({
      error: "Claude processing failed",
      fallback: "Processing completed with local symbolic engine only.",
      details: error.message
    });
  }
});

// routes
app.get("/", (req, res) => res.render("index"));
app.get("/demo", (req, res) => res.render("demo"));
app.get("/docs", (req, res) => res.render("docs"));
app.use((_, res) => res.render("index"));

app.listen(PORT, () => console.log(`Skyla site running on http://localhost:${PORT}`));