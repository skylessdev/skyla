# Skyla - Cryptographically Verified Symbolic AI Agent

## Overview

Skyla is an AI platform that implements a context-aware epistemic gate system with 2-model consensus architecture. The platform combines symbolic reasoning, advanced mathematical model selection, and cryptographic verification to create transparent, auditable AI behavior with mathematically verifiable uncertainty quantification.

**Key Innovation**: Unlike traditional AI systems that use duplicate models, Skyla implements true architectural diversity by comparing Claude Haiku (efficiency-focused) against Claude Sonnet (quality-focused), providing authentic consensus measurement and quality-based selection.

## User Preferences

Preferred communication style: Simple, everyday language.

## Core System Architecture

### Consensus Engine
- **True 2-Model Consensus**: Claude Haiku vs Sonnet with genuine architectural differences
- **Mathematical Quality Scoring**: 5-factor analysis (length, nuance, efficiency, richness, coherence)  
- **Context-Aware Epistemic Gate**: Analyzes conversation history before triggering clarification requests
- **Dynamic Model Selection**: Quality-based selection with architectural bonuses for query complexity

### Context-Aware Epistemic Gate System
- **Context Analysis**: Epistemic gate that analyzes conversation history before requesting clarification
- **Pronoun Resolution**: Resolves "this", "it", "that" references against recent conversation topics
- **Topic Continuity Detection**: Prevents false positive clarifications for contextual queries
- **Refined Uncertainty Detection**: Uses maximum divergence + contextual patterns for genuine ambiguity detection

### Advanced Model Selection Logic
- **Quality Analysis Algorithm**: Mathematical scoring across 5 sophisticated metrics
- **Architectural Bonuses**: +0.1 bonus for Haiku on simple queries, +0.1 for Sonnet on complex queries
- **Dynamic Token Allocation**: 100-200 tokens based on input complexity
- **Transparent Logging**: Detailed quality breakdowns and selection reasoning

## Frontend Architecture
- **EJS Template Engine**: Dynamic rendering with shared partials
- **Interactive Console**: Terminal-style UI with real-time state transitions
- **Minimal Design System**: Beige background (#f5f4f0) with monospace typography
- **Animated Logging**: Console output with syntax highlighting and integrity indicators

## Backend Architecture
- **Express.js Server**: ES modules with robust error handling
- **Conversation Memory**: Session-based context storage (10 exchanges per session)
- **Multi-Model Integrity System**: Simultaneous model calls with divergence analysis
- **Cryptographic Proofs**: ZK proof generation for all state transitions

## Symbolic Processing Engine

### Three-Layer Processing System
1. **Exact Symbolic Layer**: Direct pattern matching for commands (spiral, daemon, build, analyze)
2. **Semantic Pattern Matching**: Regex-based categorization with contextual vector adjustments
3. **Deterministic Hash Fallback**: Consistent micro-adjustments for unknown inputs

### Identity Vector System
- **4-Dimensional State Space**: [cognitive, emotional, adaptive, coherence]
- **Deterministic State Transitions**: All changes produce verifiable proofs
- **Mode Transitions**: analytical ↔ adaptive ↔ creative ↔ coherent based on dominant dimension

## Context-Aware Features

### Session Memory Management
- **10-Exchange History**: Maintains conversational context across interactions
- **Smart Context Extraction**: Identifies recent topics, problems, and technologies
- **Ambiguity Resolution**: Resolves pronouns and contextual references automatically

### Epistemic Uncertainty Detection
- **High Topic Divergence Detection**: Flags genuine ambiguity when topic divergence >0.8
- **Context Gate**: Prevents false positives by checking conversation history first
- **Pattern Recognition**: Identifies ambiguous phrases like "How do I fix this?" without context

## Mathematical Quality Assessment

### 5-Factor Quality Scoring
1. **Adaptive Length Scoring**: Optimal response length based on query complexity
2. **Nuance Detection**: Philosophical and analytical concept identification
3. **Efficiency Indicators**: Directness and clarity measurement  
4. **Semantic Richness**: Vocabulary diversity assessment
5. **Structural Coherence**: Sentence quality and organization analysis

### Query Complexity Analysis
- **Complex Terms**: philosophy, consciousness, analysis, theoretical, abstract, nuanced, sophisticated
- **Simple Terms**: hi, hello, what, how, yes, no, ok, spiral, basic
- **Dynamic Weighting**: High complexity favors nuance (35% weight), low complexity favors efficiency (30% weight)

## Implementation Status

### Currently Functional
✅ **True 2-Model Consensus System** - Claude Haiku vs Sonnet with real architectural diversity  
✅ **Context-Aware Epistemic Gate** - Revolutionary context analysis before clarification requests  
✅ **Mathematical Model Selection** - 5-factor quality scoring with architectural bonuses  
✅ **Session Memory System** - 10-exchange conversation history with context extraction  
✅ **Symbolic State Management** - Identity vector transitions with cryptographic proofs  
✅ **Integrity Measurement** - 4-dimension divergence analysis (length, sentiment, topic, tone)  
✅ **Interactive Console Demo** - Real-time state transitions with animated logging  
✅ **Comprehensive Documentation** - Technical implementation details and API reference  

### In Development
🔄 **Full Cryptographic Verification** - Production-grade ZK proof validation  
🔄 **Multi-Agent Coordination** - Agent-to-agent communication protocols  
🔄 **Advanced API Endpoints** - Production-ready REST API with authentication  

## Technical Dependencies

### Runtime Environment
- **Node.js**: JavaScript runtime with ES module support
- **Express.js (^4.21.2)**: Web framework with middleware support
- **EJS (^3.1.9)**: Server-side templating engine
- **@anthropic-ai/sdk**: Official Claude API integration

### Environment Configuration  
- **CLAUDE_API_KEY**: Required for multi-model consensus system
- **PORT**: Server port (defaults to 5000)

### Deployment Architecture
- **Static Asset Serving**: Public directory with brand assets
- **Template-Based Routing**: Clean URLs without file extensions
- **Graceful Error Handling**: 404 fallback and error recovery

## API Interface

### Primary Endpoint
`POST /api/claude` - Multi-model consensus processing with context-aware epistemic analysis

### Response Format
```json
{
  "success": true,
  "response": "Selected model response text",
  "integrity": "high|medium|low|epistemic_gate",
  "clarificationNeeded": false,
  "epistemicReason": "AMBIGUITY_RESOLVED_BY_CONTEXT",
  "metadata": {
    "model": "claude-3-haiku-20240307",
    "integrityScore": 0.789,
    "consensusStrength": 0.789,
    "divergenceMetrics": { "topicDivergence": 0.234 },
    "epistemicAnalysis": { "contextResolution": {...} },
    "contextMemory": "4 exchanges remembered"
  }
}
```

This implements context-aware epistemic uncertainty detection with multi-model consensus measurement.