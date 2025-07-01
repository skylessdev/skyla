import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema } from "@shared/schema";
import { ProofGenerator } from "./lib/proof-generator";
import { SymbolicEngine } from "./lib/symbolic-engine";
import type { Snapshot } from "@shared/schema";

const proofGenerator = new ProofGenerator();
const symbolicEngine = new SymbolicEngine();

export async function registerRoutes(app: Express): Promise<Server> {
  // ✅ Submit Snapshot
  app.post("/api/submitSnapshot", async (req, res) => {
    try {
      const snapshot: Snapshot = req.body;

      const prevState = await storage.getCurrentSymbolicState();

      const newState = {
        mode: "standard",
        tone: "neutral",
        protocols: ["snapshot_input"],
        identityVector: [
          snapshot.symbolic_vector.cognitive,
          snapshot.symbolic_vector.emotional,
          snapshot.symbolic_vector.adaptive,
          snapshot.symbolic_vector.coherence
        ],
        previousStateHash: prevState?.currentStateHash || null,
        currentStateHash: "0x" + Math.random().toString(16).slice(2, 64),
        ruleApplied: "snapshot_ingest"
      };

      await storage.createSymbolicState(newState);

      res.json({
        message: "Snapshot stored",
        newState
      });
    } catch (error) {
      console.error("Error submitting snapshot:", error);
      res.status(500).json({ message: "Failed to submit snapshot" });
    }
  });

  // ✅ Get chat messages
  app.get("/api/messages", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const messages = await storage.getMessages(limit);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // ✅ Send message and generate AI response
  app.post("/api/messages", async (req, res) => {
    try {
      const validatedMessage = insertMessageSchema.parse(req.body);

      const userMessage = await storage.createMessage(validatedMessage);

      const response = await symbolicEngine.processMessage(validatedMessage.content);

      const currentState = await storage.getCurrentSymbolicState();
      const newState = await symbolicEngine.generateSymbolicTransition(
        currentState || null,
        validatedMessage.content,
        response.mode
      );

      const proof = await proofGenerator.generateTransitionProof(
        currentState || null,
        newState,
        validatedMessage.content
      );

      await storage.createProof({
        hash: proof.hash,
        proof: proof.proof,
        publicSignals: proof.publicSignals,
        previousProofHash: currentState?.currentStateHash || null,
        circuitName: "SymbolicTransition"
      });

      await storage.createSymbolicState(newState);

      const aiMessage = await storage.createMessage({
        content: response.content,
        role: "assistant"
      });

      await storage.updateMessageProof(aiMessage.id, proof.hash, newState);

      res.json({
        userMessage,
        aiMessage,
        proof: proof.hash,
        symbolicState: newState
      });
    } catch (error) {
      console.error("Error processing message:", error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  // ✅ Get proof verification status
  app.get("/api/proofs", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const proofs = await storage.getRecentProofs(limit);
      res.json(proofs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch proofs" });
    }
  });

  // ✅ Get specific proof
  app.get("/api/proofs/:hash", async (req, res) => {
    try {
      const proof = await storage.getProof(req.params.hash);
      if (!proof) {
        return res.status(404).json({ message: "Proof not found" });
      }
      res.json(proof);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch proof" });
    }
  });

  // ✅ Generate new proof manually
  app.post("/api/proofs/generate", async (req, res) => {
    try {
      const currentState = await storage.getCurrentSymbolicState();
      if (!currentState) {
        return res.status(400).json({ message: "No current symbolic state found" });
      }

      const proof = await proofGenerator.generateIdentityProof(currentState);

      await storage.createProof({
        hash: proof.hash,
        proof: proof.proof,
        publicSignals: proof.publicSignals,
        previousProofHash: currentState.currentStateHash,
        circuitName: "Identity"
      });

      res.json(proof);
    } catch (error) {
      console.error("Error generating proof:", error);
      res.status(500).json({ message: "Failed to generate proof" });
    }
  });

  // ✅ Get current symbolic state
  app.get("/api/symbolic-state", async (req, res) => {
    try {
      const state = await storage.getCurrentSymbolicState();
      if (!state) {
        return res.status(404).json({ message: "No symbolic state found" });
      }
      res.json(state);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch symbolic state" });
    }
  });

  // ✅ Get symbolic state history
  app.get("/api/symbolic-state/history", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const history = await storage.getSymbolicStateHistory(limit);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch symbolic state history" });
    }
  });

  // ✅ Switch AI mode
  app.post("/api/mode", async (req, res) => {
    try {
      const { mode } = req.body;
      const currentState = await storage.getCurrentSymbolicState();

      if (!currentState) {
        return res.status(400).json({ message: "No current symbolic state found" });
      }

      const newState = await symbolicEngine.switchMode(currentState, mode);

      const proof = await proofGenerator.generateTransitionProof(
        currentState,
        newState,
        `Mode switch to ${mode}`
      );

      await storage.createProof({
        hash: proof.hash,
        proof: proof.proof,
        publicSignals: proof.publicSignals,
        previousProofHash: currentState.currentStateHash,
        circuitName: "SymbolicTransition"
      });

      await storage.createSymbolicState(newState);

      res.json({
        symbolicState: newState,
        proof: proof.hash
      });
    } catch (error) {
      console.error("Error switching mode:", error);
      res.status(500).json({ message: "Failed to switch mode" });
    }
  });

  // ✅ Get circuit status
  app.get("/api/circuits", async (req, res) => {
    try {
      const circuits = await storage.getCircuits();
      res.json(circuits);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch circuits" });
    }
  });

  // ✅ Recompile circuits
  app.post("/api/circuits/recompile", async (req, res) => {
    try {
      const circuits = await storage.getCircuits();
      const results = [];

      for (const circuit of circuits) {
        try {
          const compiled = await proofGenerator.compileCircuit(circuit.name);
          if (compiled) {
            await storage.updateCircuitCompilation(circuit.name, true, {
              r1cs: `circuits/${circuit.name}.r1cs`,
              wasm: `circuits/${circuit.name}.wasm`,
              pkey: `circuits/${circuit.name}_pk.key`,
              vkey: `circuits/${circuit.name}_vk.key`
            });
            results.push({ circuit: circuit.name, status: "compiled" });
          } else {
            results.push({ circuit: circuit.name, status: "failed" });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          results.push({ circuit: circuit.name, status: "error", error: errorMessage });
        }
      }

      res.json({ results });
    } catch (error) {
      console.error("Error recompiling circuits:", error);
      res.status(500).json({ message: "Failed to recompile circuits" });
    }
  });

  // ✅ Get system metrics
  app.get("/api/metrics", async (req, res) => {
    try {
      const proofs = await storage.getRecentProofs(100);
      const verifiedProofs = proofs.filter(p => p.verified);

      const avgProofTime = 847; // Simulated
      const circuitEfficiency = Math.round((verifiedProofs.length / proofs.length) * 100) || 92;
      const memoryUsage = "64MB"; // Simulated

      res.json({
        proofGeneration: `${avgProofTime}ms`,
        circuitEfficiency: `${circuitEfficiency}%`,
        memoryUsage,
        totalProofs: proofs.length,
        verifiedProofs: verifiedProofs.length,
        successRate: `${Math.round((verifiedProofs.length / proofs.length) * 100) || 100}%`
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  // ✅ Return HTTP server at the end
  const httpServer = createServer(app);
  return httpServer;
}
