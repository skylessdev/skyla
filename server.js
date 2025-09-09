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

// ================== MULTI-MODEL DELTA DIVERGENCE SYSTEM ==================

// Divergence calculation functions
function calculateLengthVariance(responses) {
  if (responses.length < 2) return 0;
  
  const lengths = responses.map(r => r.length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / lengths.length;
  
  // Normalize by expected variance (assume max reasonable difference is 200 chars)
  return Math.min(1, Math.sqrt(variance) / 200);
}

function calculateSentimentDivergence(responses) {
  // Simple sentiment scoring based on positive/negative word patterns
  const sentimentScore = (text) => {
    const positive = (text.match(/\b(good|great|excellent|positive|helpful|clear|confident|strong)\b/gi) || []).length;
    const negative = (text.match(/\b(bad|poor|difficult|negative|unclear|uncertain|weak|problematic)\b/gi) || []).length;
    return (positive - negative) / Math.max(1, text.split(' ').length);
  };
  
  if (responses.length < 2) return 0;
  
  const sentiments = responses.map(sentimentScore);
  const mean = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
  const variance = sentiments.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / sentiments.length;
  
  return Math.min(1, Math.sqrt(variance) * 10); // Scale for visibility
}

function calculateTopicCoherence(responses) {
  if (responses.length < 2) return 1;
  
  // Extract key terms from each response
  const extractKeyTerms = (text) => {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(' ')
      .filter(word => word.length > 4)
      .slice(0, 10); // Top 10 significant words
  };
  
  const termSets = responses.map(extractKeyTerms);
  
  // Calculate overlap between all pairs
  let totalOverlap = 0;
  let pairCount = 0;
  
  for (let i = 0; i < termSets.length; i++) {
    for (let j = i + 1; j < termSets.length; j++) {
      const set1 = new Set(termSets[i]);
      const set2 = new Set(termSets[j]);
      const intersection = new Set([...set1].filter(x => set2.has(x)));
      const union = new Set([...set1, ...set2]);
      
      totalOverlap += intersection.size / union.size;
      pairCount++;
    }
  }
  
  const coherence = pairCount > 0 ? totalOverlap / pairCount : 1;
  return 1 - coherence; // Return divergence (1 - coherence)
}

function calculateToneConsistency(responses) {
  if (responses.length < 2) return 0;
  
  // Analyze tone indicators
  const analyzeTone = (text) => {
    const analytical = (text.match(/\b(analyze|logical|systematic|structured|reasoning)\b/gi) || []).length;
    const empathetic = (text.match(/\b(feel|understand|support|emotional|care)\b/gi) || []).length;
    const confident = (text.match(/\b(clearly|definitely|certainly|obviously|assured)\b/gi) || []).length;
    const uncertain = (text.match(/\b(maybe|perhaps|might|possibly|uncertain)\b/gi) || []).length;
    
    return {
      analytical: analytical / Math.max(1, text.split(' ').length),
      empathetic: empathetic / Math.max(1, text.split(' ').length),
      confidence: (confident - uncertain) / Math.max(1, text.split(' ').length)
    };
  };
  
  const toneProfiles = responses.map(analyzeTone);
  
  // Calculate variance across tone dimensions
  const dimensions = ['analytical', 'empathetic', 'confidence'];
  let totalVariance = 0;
  
  dimensions.forEach(dim => {
    const values = toneProfiles.map(profile => profile[dim]);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    totalVariance += Math.sqrt(variance);
  });
  
  return Math.min(1, totalVariance * 20); // Scale for visibility
}

function computeOverallIntegrity(metrics) {
  // Weighted composite score - higher weight on sentiment and tone
  const weights = {
    length: 0.15,
    sentiment: 0.30,
    topic: 0.25,
    tone: 0.30
  };
  
  const divergenceScore = 
    metrics.lengthVariance * weights.length +
    metrics.sentimentDivergence * weights.sentiment +
    metrics.topicDivergence * weights.topic +
    metrics.toneConsistency * weights.tone;
  
  // Return integrity (1 - divergence), clamped to [0,1]
  return Math.max(0, Math.min(1, 1 - divergenceScore));
}

// Multi-model consensus system
async function performMultiModelIntegrityCheck(input, currentState, systemPrompt) {
  const models = [
    "claude-3-haiku-20240307",
    "claude-3-5-sonnet-20241022", 
    "claude-3-5-sonnet-20241022"  // Using Sonnet twice since Opus is deprecated
  ];
  
  try {
    // Generate responses from all models in parallel with detailed error handling
    console.log(`🔄 Starting multi-model integrity check with models: ${models.join(', ')}`);
    
    // Try sequential calls instead of parallel to avoid rate limits
    const responses = [];
    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      try {
        console.log(`📤 Calling ${model} (${i + 1}/${models.length})...`);
        const message = await anthropic.messages.create({
          model: model,
          max_tokens: 150,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: `Process this input with symbolic awareness: "${input}"`
            }
          ]
        });
        
        console.log(`✅ ${model} success: ${message.usage.output_tokens} tokens`);
        responses.push({
          model: model,
          response: message.content[0].text,
          tokens: message.usage.output_tokens
        });
        
        // Small delay between calls to respect rate limits
        if (i < models.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (modelError) {
        console.log(`❌ ${model} failed:`, modelError.message, `Status: ${modelError.status || 'unknown'}`);
        // Continue with other models instead of failing completely
      }
    }
    
    // Require at least one successful response
    if (responses.length === 0) {
      throw new Error('All models failed - falling back to single model');
    }
    
    console.log(`🎯 Multi-model completed: ${responses.length}/${models.length} models succeeded`);
    
    // Calculate divergence metrics
    const responseTexts = responses.map(r => r.response);
    const divergenceMetrics = {
      lengthVariance: calculateLengthVariance(responseTexts),
      sentimentDivergence: calculateSentimentDivergence(responseTexts),
      topicDivergence: calculateTopicCoherence(responseTexts),
      toneConsistency: calculateToneConsistency(responseTexts)
    };
    
    // Compute overall integrity score
    const integrityScore = computeOverallIntegrity(divergenceMetrics);
    
    // Select primary response (prefer Sonnet for balance)
    const primaryResponse = responses.find(r => r.model.includes('sonnet')) || responses[0];
    
    return {
      success: true,
      integrityScore,
      primaryResponse,
      allResponses: responses,
      divergenceMetrics,
      consensusStrength: integrityScore,
      action: integrityScore > 0.8 ? 'proceed' : integrityScore > 0.5 ? 'proceed_with_note' : 'clarify'
    };
    
  } catch (error) {
    console.error("Multi-model integrity check failed:", error);
    
    // Fallback to single model
    const fallbackMessage = await anthropic.messages.create({
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
    
    return {
      success: true,
      integrityScore: 0.5, // Unknown integrity
      consensusStrength: 0.5, // Fallback consensus
      primaryResponse: {
        model: "claude-3-haiku-20240307",
        response: fallbackMessage.content[0].text,
        tokens: fallbackMessage.usage.output_tokens
      },
      divergenceMetrics: {
        lengthVariance: 0,
        sentimentDivergence: 0,
        topicDivergence: 0,
        toneConsistency: 0
      },
      fallback: true,
      action: 'proceed_with_note'
    };
  }
}

// view engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// static files
app.use(express.static(path.join(__dirname, "public")));

// Enhanced Claude API endpoint with multi-model integrity verification
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

    // Perform multi-model integrity check
    const integrityResult = await performMultiModelIntegrityCheck(input, currentState, systemPrompt);
    
    // Generate enhanced cryptographic proof with integrity data
    const enhancedProof = {
      timestamp: new Date().toISOString(),
      integrityScore: integrityResult.integrityScore,
      consensusStrength: integrityResult.consensusStrength,
      divergenceMetrics: integrityResult.divergenceMetrics,
      modelsUsed: integrityResult.allResponses ? integrityResult.allResponses.map(r => r.model) : [integrityResult.primaryResponse.model],
      verificationHash: generateIntegrityHash(integrityResult),
      proofVersion: "v3.0_multi_model_verified"
    };

    // Handle response based on integrity level
    switch (integrityResult.action) {
      case 'proceed': // High integrity (>0.8)
        res.json({
          success: true,
          response: integrityResult.primaryResponse.response,
          integrity: "high",
          metadata: {
            model: integrityResult.primaryResponse.model,
            tokens: integrityResult.primaryResponse.tokens,
            integrityScore: integrityResult.integrityScore,
            consensusStrength: integrityResult.consensusStrength,
            divergenceMetrics: integrityResult.divergenceMetrics,
            enhancedProof: enhancedProof,
            timestamp: new Date().toISOString()
          }
        });
        break;
        
      case 'proceed_with_note': // Medium integrity (0.5-0.8)
        res.json({
          success: true,
          response: integrityResult.primaryResponse.response,
          integrity: "medium",
          note: `Response based on ${integrityResult.consensusStrength.toFixed(2)} consensus strength`,
          metadata: {
            model: integrityResult.primaryResponse.model,
            tokens: integrityResult.primaryResponse.tokens,
            integrityScore: integrityResult.integrityScore,
            consensusStrength: integrityResult.consensusStrength,
            divergenceMetrics: integrityResult.divergenceMetrics,
            enhancedProof: enhancedProof,
            fallback: integrityResult.fallback || false,
            timestamp: new Date().toISOString()
          }
        });
        break;
        
      case 'clarify': // Low integrity (<0.5)
        res.json({
          success: true,
          response: `I'm detecting significant uncertainty in how to respond to "${input}". The models show ${(integrityResult.consensusStrength * 100).toFixed(0)}% consensus. Could you be more specific about what you're looking for?`,
          integrity: "low",
          clarificationNeeded: true,
          metadata: {
            model: "consensus_analysis",
            integrityScore: integrityResult.integrityScore,
            consensusStrength: integrityResult.consensusStrength,
            divergenceMetrics: integrityResult.divergenceMetrics,
            enhancedProof: enhancedProof,
            timestamp: new Date().toISOString()
          }
        });
        break;
    }

  } catch (error) {
    console.error("Multi-model Claude API error:", error);
    res.status(500).json({
      error: "Multi-model processing failed",
      fallback: "Processing completed with local symbolic engine only.",
      details: error.message
    });
  }
});

// Generate integrity verification hash
function generateIntegrityHash(integrityResult) {
  const data = JSON.stringify({
    integrityScore: integrityResult.integrityScore,
    divergenceMetrics: integrityResult.divergenceMetrics,
    responseHashes: integrityResult.allResponses ? 
      integrityResult.allResponses.map(r => r.response.slice(0, 20)) : 
      [integrityResult.primaryResponse.response.slice(0, 20)]
  });
  
  // Simple hash function for demo (in production, use crypto.createHash)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return "0x" + Math.abs(hash).toString(16).padStart(8, '0');
}

// routes
app.get("/", (req, res) => res.render("index"));
app.get("/demo", (req, res) => res.render("demo"));
app.get("/docs", (req, res) => res.render("docs"));
app.use((_, res) => res.render("index"));

app.listen(PORT, () => console.log(`Skyla site running on http://localhost:${PORT}`));