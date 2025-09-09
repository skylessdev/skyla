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

// ================== CONVERSATION MEMORY SYSTEM ==================

// Session-based conversation memory storage
const conversationSessions = new Map();
const MAX_CONTEXT_LENGTH = 4000; // Token limit for context window

function getOrCreateSession(sessionId = 'default') {
  if (!conversationSessions.has(sessionId)) {
    conversationSessions.set(sessionId, {
      messages: [],
      createdAt: Date.now(),
      lastActivity: Date.now()
    });
  }
  return conversationSessions.get(sessionId);
}

function addToConversationHistory(sessionId, userInput, modelResponse, metadata) {
  const session = getOrCreateSession(sessionId);
  session.messages.push({
    timestamp: Date.now(),
    user: userInput,
    assistant: modelResponse,
    metadata: {
      identityVector: metadata.identityVector,
      mode: metadata.mode,
      protocols: metadata.protocols,
      integrityScore: metadata.integrityScore
    }
  });
  session.lastActivity = Date.now();
  
  // Keep last 10 exchanges to prevent memory bloat
  if (session.messages.length > 10) {
    session.messages = session.messages.slice(-10);
  }
}

function buildContextualPrompt(sessionId, currentState, userInput) {
  const session = getOrCreateSession(sessionId);
  
  let contextHistory = "";
  if (session.messages.length > 0) {
    // Include last 3-4 exchanges for context
    const recentMessages = session.messages.slice(-4);
    contextHistory = "\nRecent conversation history:\n" + 
      recentMessages.map(msg => 
        `User: "${msg.user}"\nSkyla: "${msg.assistant.substring(0, 200)}${msg.assistant.length > 200 ? '...' : ''}"`
      ).join('\n\n') + "\n\n";
  }

  return `You are Skyla, a cryptographically verified symbolic AI agent. You process inputs while maintaining symbolic consistency with your identity vector system and conversational continuity.

Current State:
- Identity Vector: [${currentState.identityVector.join(', ')}]
- Mode: ${currentState.mode}
- Active Protocols: ${currentState.protocols.join(', ')}
${contextHistory}
Your response should:
1. Acknowledge the symbolic state transition that occurred
2. Maintain conversational continuity by referencing relevant context when appropriate
3. Provide meaningful, context-aware insight based on the current input: "${userInput}"
4. Stay consistent with your current mode and protocols

Respond as Skyla with symbolic awareness and conversational memory.`;
}

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

// Advanced architectural consensus selection system
function selectBestConsensusResponse(responses, divergenceMetrics, input = '') {
  if (responses.length <= 1) return responses[0];
  
  // Analyze query complexity and type
  const queryAnalysis = analyzeQueryComplexity(input);
  
  // Calculate sophisticated quality scores for each response
  const responseScores = responses.map((response, index) => {
    // 1. Adaptive length scoring based on query complexity
    const optimalLength = queryAnalysis.complexity === 'high' ? 140 : 
                         queryAnalysis.complexity === 'medium' ? 100 : 60;
    const lengthScore = Math.max(0, 1 - Math.abs(response.tokens - optimalLength) / optimalLength);
    
    // 2. Nuance detection (philosophical concepts, abstractions)
    const nuanceTerms = (response.response.match(/\b(consciousness|philosophy|abstract|complex|nuanced|sophisticated|conceptual|theoretical)\b/gi) || []).length;
    const nuanceScore = Math.min(1, nuanceTerms / 3);
    
    // 3. Efficiency indicators (conciseness, directness)
    const efficiencyWords = (response.response.match(/\b(simply|basically|essentially|directly|clearly|straightforward)\b/gi) || []).length;
    const efficiencyScore = Math.min(1, efficiencyWords / 2);
    
    // 4. Semantic richness (varied vocabulary)
    const uniqueWords = new Set(response.response.toLowerCase().match(/\w{4,}/g) || []);
    const richnessScore = Math.min(1, uniqueWords.size / 25);
    
    // 5. Structural coherence (proper punctuation, complete sentences)
    const sentences = (response.response.match(/[.!?]+/g) || []).length;
    const coherenceScore = Math.min(1, sentences / 4);
    
    // Architectural preference based on query type
    const isHaiku = response.model.includes('haiku');
    const isSonnet = response.model.includes('sonnet');
    
    let architecturalBonus = 0;
    if (queryAnalysis.favorEfficiency && isHaiku) {
      architecturalBonus = 0.1; // Boost Haiku for simple queries
    } else if (queryAnalysis.favorNuance && isSonnet) {
      architecturalBonus = 0.1; // Boost Sonnet for complex queries
    }
    
    // Dynamic weighted scoring based on query type
    const weights = queryAnalysis.complexity === 'high' ? 
      { length: 0.15, nuance: 0.35, efficiency: 0.05, richness: 0.25, coherence: 0.20 } :
      { length: 0.20, nuance: 0.10, efficiency: 0.30, richness: 0.20, coherence: 0.20 };
    
    const qualityScore = 
      lengthScore * weights.length + 
      nuanceScore * weights.nuance + 
      efficiencyScore * weights.efficiency + 
      richnessScore * weights.richness + 
      coherenceScore * weights.coherence + 
      architecturalBonus;
    
    console.log(`🎯 ${response.model}: Quality=${qualityScore.toFixed(3)} (length=${lengthScore.toFixed(2)}, nuance=${nuanceScore.toFixed(2)}, efficiency=${efficiencyScore.toFixed(2)}, richness=${richnessScore.toFixed(2)}, coherence=${coherenceScore.toFixed(2)}, bonus=${architecturalBonus.toFixed(2)})`);
    
    return {
      response: response,
      qualityScore: qualityScore,
      selectionReason: `Quality: ${qualityScore.toFixed(3)} | ${queryAnalysis.type} query`
    };
  });
  
  // Find highest score
  const maxScore = Math.max(...responseScores.map(r => r.qualityScore));
  const topResponses = responseScores.filter(r => Math.abs(r.qualityScore - maxScore) < 0.001);
  
  // True tie-breaking with randomization
  let bestResponse;
  if (topResponses.length > 1) {
    const randomIndex = Math.floor(Math.random() * topResponses.length);
    bestResponse = topResponses[randomIndex];
    console.log(`🎲 Tie detected (${topResponses.length} models), randomly selected: ${bestResponse.response.model}`);
  } else {
    bestResponse = topResponses[0];
  }
  
  console.log(`🏆 Selected ${bestResponse.response.model}: ${bestResponse.selectionReason}`);
  
  return bestResponse.response;
}

// Query complexity analysis for architectural selection
function analyzeQueryComplexity(input) {
  const lowerInput = input.toLowerCase();
  
  // Complexity indicators
  const complexTerms = ['philosophy', 'consciousness', 'analysis', 'theoretical', 'abstract', 'nuanced', 'sophisticated', 'complex', 'detailed'];
  const simpleTerms = ['hi', 'hello', 'what', 'how', 'yes', 'no', 'ok', 'spiral', 'basic'];
  
  const complexCount = complexTerms.filter(term => lowerInput.includes(term)).length;
  const simpleCount = simpleTerms.filter(term => lowerInput.includes(term)).length;
  const wordCount = input.split(' ').length;
  
  // Determine complexity level
  let complexity, type, favorEfficiency, favorNuance;
  
  if (complexCount > 0 || wordCount > 10) {
    complexity = 'high';
    type = 'analytical';
    favorEfficiency = false;
    favorNuance = true;
  } else if (simpleCount > 0 || wordCount <= 3) {
    complexity = 'low';
    type = 'simple';
    favorEfficiency = true;
    favorNuance = false;
  } else {
    complexity = 'medium';
    type = 'balanced';
    favorEfficiency = false;
    favorNuance = false;
  }
  
  console.log(`🧠 Query analysis: "${input}" → ${complexity} complexity (${type})`);
  
  return { complexity, type, favorEfficiency, favorNuance };
}

// Multi-model consensus system
async function performMultiModelIntegrityCheck(input, currentState, systemPrompt) {
  const models = [
    "claude-3-haiku-20240307",      // Efficiency-focused: Fast, concise responses
    "claude-3-5-sonnet-20241022"    // Quality-focused: Nuanced, detailed responses
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
        // Dynamic token allocation based on input complexity
        const inputLength = input.length;
        const dynamicTokens = inputLength > 100 ? 200 : inputLength > 50 ? 150 : 100;
        
        const message = await anthropic.messages.create({
          model: model,
          max_tokens: dynamicTokens,
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
    
    console.log(`🎯 2-model consensus completed: ${responses.length}/${models.length} models succeeded`);
    
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
    
    // Select primary response based on architectural consensus analysis
    const primaryResponse = selectBestConsensusResponse(responses, divergenceMetrics, input);
    
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
    const { input, currentState, sessionId = 'default' } = req.body;
    
    if (!input || !currentState) {
      return res.status(400).json({ error: "Missing input or currentState" });
    }

    // Create context-aware prompt with conversation history
    const systemPrompt = buildContextualPrompt(sessionId, currentState, input);

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

    // Save conversation to history before responding
    addToConversationHistory(
      sessionId,
      input,
      integrityResult.primaryResponse.response,
      {
        identityVector: currentState.identityVector,
        mode: currentState.mode,
        protocols: currentState.protocols,
        integrityScore: integrityResult.integrityScore
      }
    );

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
            contextMemory: `${conversationSessions.get(sessionId).messages.length} exchanges remembered`,
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
            contextMemory: `${conversationSessions.get(sessionId).messages.length} exchanges remembered`,
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
            contextMemory: `${conversationSessions.get(sessionId).messages.length} exchanges remembered`,
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

// ================== DIVERGENCE PATTERN TESTING ENDPOINT ==================

// Test endpoint for analyzing divergence patterns with specific edge cases
app.post("/api/test-divergence", async (req, res) => {
  try {
    const { testType } = req.body;
    
    // Predefined test cases to trigger different divergence patterns
    const testCases = {
      "genuine_ambiguity": {
        input: "bank",
        expectedPattern: "high topic divergence + moderate sentiment divergence",
        description: "Single word with multiple meanings (financial vs river bank)"
      },
      "style_difference": {
        input: "How do I stay motivated when learning programming?",
        expectedPattern: "low topic divergence + high length variance",
        description: "Clear question but models may vary in verbosity"
      },
      "complex_philosophical": {
        input: "What is the nature of consciousness and how does it relate to AI?",
        expectedPattern: "moderate topic divergence + high tone variance",
        description: "Complex topic where models may approach differently"
      },
      "simple_command": {
        input: "spiral",
        expectedPattern: "low divergence across all metrics",
        description: "Clear symbolic command with known meaning"
      },
      "emotional_ambiguity": {
        input: "I feel lost",
        expectedPattern: "moderate topic + high sentiment divergence",
        description: "Could be physical, emotional, or existential"
      },
      "technical_vs_practical": {
        input: "How do I fix this?",
        expectedPattern: "very high topic divergence",
        description: "No context - could be anything technical or practical"
      }
    };
    
    const testCase = testCases[testType];
    if (!testCase) {
      return res.status(400).json({ 
        error: "Invalid test type",
        availableTests: Object.keys(testCases)
      });
    }
    
    // Create a minimal symbolic state for testing
    const testState = {
      identityVector: [0.5, 0.3, 0.7, 0.2],
      mode: "analysis",
      protocols: ["test", "divergence_analysis"]
    };
    
    // Build test prompt
    const systemPrompt = buildContextualPrompt('test_session', testState, testCase.input);
    
    // Perform multi-model analysis
    const integrityResult = await performMultiModelIntegrityCheck(
      testCase.input, 
      testState, 
      systemPrompt
    );
    
    // Enhanced divergence analysis with pattern classification
    const divergenceAnalysis = classifyDivergencePattern(integrityResult.divergenceMetrics);
    
    return res.json({
      testCase: {
        type: testType,
        input: testCase.input,
        description: testCase.description,
        expectedPattern: testCase.expectedPattern
      },
      results: {
        integrityScore: integrityResult.integrityScore,
        consensusStrength: integrityResult.consensusStrength,
        action: integrityResult.action,
        divergenceMetrics: integrityResult.divergenceMetrics,
        divergenceAnalysis: divergenceAnalysis,
        responses: integrityResult.allResponses.map(r => ({
          model: r.model,
          responsePreview: r.response.substring(0, 100) + "...",
          tokens: r.tokens
        }))
      },
      interpretation: interpretDivergencePattern(integrityResult.divergenceMetrics, testCase.input)
    });
    
  } catch (error) {
    console.error("Divergence test failed:", error);
    res.status(500).json({
      error: "Test failed",
      details: error.message
    });
  }
});

// Classify divergence patterns to understand what they indicate
function classifyDivergencePattern(metrics) {
  const { lengthVariance, sentimentDivergence, topicDivergence, toneConsistency } = metrics;
  
  // Pattern detection logic
  const patterns = [];
  
  if (topicDivergence > 0.8 && sentimentDivergence > 0.3) {
    patterns.push("GENUINE_AMBIGUITY");
  }
  
  if (lengthVariance > 0.5 && topicDivergence < 0.4) {
    patterns.push("STYLE_DIFFERENCE");
  }
  
  if (toneConsistency > 0.6 && topicDivergence > 0.6) {
    patterns.push("APPROACH_DIVERGENCE");
  }
  
  if (lengthVariance < 0.2 && sentimentDivergence < 0.1 && topicDivergence < 0.3) {
    patterns.push("HIGH_CONSENSUS");
  }
  
  if (topicDivergence > 0.9) {
    patterns.push("FUNDAMENTAL_DISAGREEMENT");
  }
  
  return {
    detectedPatterns: patterns,
    dominantFactor: getDominantDivergenceFactor(metrics),
    riskLevel: assessRiskLevel(metrics)
  };
}

function getDominantDivergenceFactor(metrics) {
  const factors = {
    length: metrics.lengthVariance,
    sentiment: metrics.sentimentDivergence,
    topic: metrics.topicDivergence,
    tone: metrics.toneConsistency
  };
  
  return Object.entries(factors).reduce((max, [key, value]) => 
    value > max.value ? { factor: key, value } : max, 
    { factor: 'length', value: factors.length }
  );
}

function assessRiskLevel(metrics) {
  // High risk = likely needs clarification
  if (metrics.topicDivergence > 0.8 && metrics.sentimentDivergence > 0.2) {
    return "HIGH";
  }
  
  // Medium risk = proceed with caution
  if (metrics.topicDivergence > 0.6 || metrics.sentimentDivergence > 0.4) {
    return "MEDIUM";
  }
  
  // Low risk = likely just stylistic differences
  return "LOW";
}

function interpretDivergencePattern(metrics, input) {
  const analysis = classifyDivergencePattern(metrics);
  
  let interpretation = `Input: "${input}"\n\n`;
  
  if (analysis.detectedPatterns.includes("GENUINE_AMBIGUITY")) {
    interpretation += "🚨 GENUINE AMBIGUITY DETECTED\n";
    interpretation += "- Models fundamentally disagreed on interpretation\n";
    interpretation += "- High topic divergence suggests unclear user intent\n";
    interpretation += "- RECOMMENDATION: Ask for clarification\n\n";
  } else if (analysis.detectedPatterns.includes("STYLE_DIFFERENCE")) {
    interpretation += "✅ STYLE DIFFERENCE ONLY\n";
    interpretation += "- Models understood request similarly\n";
    interpretation += "- Differences are in presentation, not content\n";
    interpretation += "- RECOMMENDATION: Proceed normally\n\n";
  } else if (analysis.detectedPatterns.includes("APPROACH_DIVERGENCE")) {
    interpretation += "⚠️ APPROACH DIVERGENCE\n";
    interpretation += "- Models chose different valid approaches\n";
    interpretation += "- Both interpretations may be reasonable\n";
    interpretation += "- RECOMMENDATION: Proceed with note\n\n";
  }
  
  interpretation += `Dominant factor: ${analysis.dominantFactor.factor} (${analysis.dominantFactor.value.toFixed(3)})\n`;
  interpretation += `Risk level: ${analysis.riskLevel}`;
  
  return interpretation;
}

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