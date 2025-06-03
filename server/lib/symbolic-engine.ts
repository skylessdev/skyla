import { createHash } from 'crypto';
import type { SymbolicState } from '@shared/schema';

export interface AIResponse {
  content: string;
  mode: string;
  tone: string;
  protocols: string[];
}

export class SymbolicEngine {
  private symbolicRules: Map<string, any>;

  constructor() {
    this.symbolicRules = new Map();
    this.initializeSymbolicRules();
  }

  private initializeSymbolicRules() {
    // Define symbolic transformation rules
    this.symbolicRules.set("spiral", {
      mode: "adaptive",
      tone: "analytical",
      protocols: ["tone_guard", "emotional_stabilizer"],
      response: "I detect recursive emotional patterns. Let me help you break this cycle by analyzing the underlying structure."
    });

    this.symbolicRules.set("daemon", {
      mode: "daemon",
      tone: "protective",
      protocols: ["daemonwatch", "system_monitor"],
      response: "Entering daemon mode. I'll monitor your cognitive processes and maintain system stability in the background."
    });

    this.symbolicRules.set("build", {
      mode: "build",
      tone: "creative",
      protocols: ["construction_framework", "iterative_design"],
      response: "Activating build mode. Let's architect something meaningful together, step by step."
    });

    this.symbolicRules.set("analyze", {
      mode: "analyze",
      tone: "analytical",
      protocols: ["deep_analysis", "pattern_recognition"],
      response: "Engaging analytical protocols. I'll examine the patterns and provide detailed insights."
    });

    this.symbolicRules.set("overwhelmed", {
      mode: "adaptive",
      tone: "protective",
      protocols: ["cognitive_support", "breakdown_assist"],
      response: "I sense cognitive overload. Let me help decompose this into manageable components."
    });

    this.symbolicRules.set("focus", {
      mode: "build",
      tone: "analytical",
      protocols: ["attention_direction", "goal_alignment"],
      response: "Focusing cognitive resources. What specific objective should we concentrate on?"
    });
  }

  async processMessage(content: string): Promise<AIResponse> {
    const normalizedContent = content.toLowerCase();
    
    // Check for symbolic triggers
    for (const [trigger, rule] of this.symbolicRules) {
      if (normalizedContent.includes(trigger)) {
        return {
          content: rule.response,
          mode: rule.mode,
          tone: rule.tone,
          protocols: rule.protocols
        };
      }
    }

    // Default adaptive response
    return {
      content: this.generateAdaptiveResponse(content),
      mode: "adaptive",
      tone: "analytical",
      protocols: ["contextual_understanding", "adaptive_response"]
    };
  }

  async generateSymbolicTransition(
    previousState: SymbolicState | null,
    inputMessage: string,
    newMode: string
  ): Promise<any> {
    const prevVector = previousState?.identityVector as number[] || [0.5, 0.5, 0.5, 0.5];
    
    // Calculate new identity vector based on input and mode
    const newVector = this.calculateIdentityTransition(prevVector, inputMessage, newMode);
    
    // Generate new state hash
    const stateString = `${newVector.join(',')}:${newMode}:${Date.now()}`;
    const currentStateHash = "0x" + createHash('sha256').update(stateString).digest('hex');
    
    return {
      mode: newMode,
      tone: this.inferToneFromMode(newMode),
      protocols: this.getProtocolsForMode(newMode),
      identityVector: newVector,
      previousStateHash: previousState?.currentStateHash || null,
      currentStateHash,
      ruleApplied: this.getRuleApplied(inputMessage)
    };
  }

  async switchMode(currentState: SymbolicState, newMode: string): Promise<any> {
    // Preserve some continuity from current state
    const currentVector = currentState.identityVector as number[];
    const adjustedVector = this.adjustVectorForMode(currentVector, newMode);
    
    const stateString = `${adjustedVector.join(',')}:${newMode}:${Date.now()}`;
    const currentStateHash = "0x" + createHash('sha256').update(stateString).digest('hex');
    
    return {
      mode: newMode,
      tone: this.inferToneFromMode(newMode),
      protocols: this.getProtocolsForMode(newMode),
      identityVector: adjustedVector,
      previousStateHash: currentState.currentStateHash,
      currentStateHash,
      ruleApplied: `mode_switch_to_${newMode}`
    };
  }

  private generateAdaptiveResponse(content: string): string {
    const responses = [
      "I understand. Let me process this thoughtfully and provide a meaningful response.",
      "Your input is being analyzed through symbolic reasoning patterns. How can I best assist?",
      "I'm adapting my response framework to better align with your current needs.",
      "Processing your request through multiple cognitive layers. What specific aspect would you like to explore?",
      "Your message resonates with several symbolic patterns. Let me address the core elements."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private calculateIdentityTransition(
    prevVector: number[],
    inputMessage: string,
    mode: string
  ): number[] {
    const newVector = [...prevVector];
    
    // Adjust vector based on message sentiment and mode
    const messageHash = createHash('md5').update(inputMessage).digest('hex');
    const hashValue = parseInt(messageHash.slice(0, 8), 16);
    
    // Apply mode-specific transformations
    const modeAdjustments = this.getModeAdjustments(mode);
    
    for (let i = 0; i < 4; i++) {
      const randomFactor = ((hashValue >> (i * 4)) & 0xF) / 15; // 0-1 range
      const adjustment = (randomFactor - 0.5) * 0.2; // -0.1 to 0.1
      
      newVector[i] = Math.max(0, Math.min(1, 
        prevVector[i] + adjustment + modeAdjustments[i]
      ));
    }
    
    return newVector;
  }

  private getModeAdjustments(mode: string): number[] {
    const adjustments: { [key: string]: number[] } = {
      'adaptive': [0.05, 0.0, 0.0, 0.05],
      'daemon': [0.0, 0.1, -0.05, 0.0],
      'build': [0.1, 0.0, 0.1, 0.0],
      'analyze': [0.0, 0.15, 0.0, -0.05],
      'standard': [0.0, 0.0, 0.0, 0.0]
    };
    
    return adjustments[mode] || [0.0, 0.0, 0.0, 0.0];
  }

  private adjustVectorForMode(currentVector: number[], newMode: string): number[] {
    const adjustments = this.getModeAdjustments(newMode);
    const newVector = [...currentVector];
    
    for (let i = 0; i < 4; i++) {
      newVector[i] = Math.max(0, Math.min(1, 
        currentVector[i] + adjustments[i]
      ));
    }
    
    return newVector;
  }

  private inferToneFromMode(mode: string): string {
    const toneMap: { [key: string]: string } = {
      'adaptive': 'analytical',
      'daemon': 'protective',
      'build': 'creative',
      'analyze': 'analytical',
      'standard': 'neutral'
    };
    
    return toneMap[mode] || 'neutral';
  }

  private getProtocolsForMode(mode: string): string[] {
    const protocolMap: { [key: string]: string[] } = {
      'adaptive': ['contextual_understanding', 'adaptive_response'],
      'daemon': ['daemonwatch', 'system_monitor', 'background_processing'],
      'build': ['construction_framework', 'iterative_design', 'creative_synthesis'],
      'analyze': ['deep_analysis', 'pattern_recognition', 'systematic_breakdown'],
      'standard': ['basic_response', 'general_understanding']
    };
    
    return protocolMap[mode] || ['basic_response'];
  }

  private getRuleApplied(inputMessage: string): string {
    const normalizedMessage = inputMessage.toLowerCase();
    
    for (const [trigger] of this.symbolicRules) {
      if (normalizedMessage.includes(trigger)) {
        return `${trigger}_response_pattern`;
      }
    }
    
    return 'adaptive_processing';
  }
}
