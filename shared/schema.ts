import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  role: text("role").notNull(), // 'user' | 'assistant' | 'system'
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  proofHash: text("proof_hash"),
  symbolicState: jsonb("symbolic_state"),
});

export const proofs = pgTable("proofs", {
  id: serial("id").primaryKey(),
  hash: text("hash").notNull().unique(),
  proof: jsonb("proof").notNull(),
  publicSignals: jsonb("public_signals").notNull(),
  previousProofHash: text("previous_proof_hash"),
  circuitName: text("circuit_name").notNull(),
  verified: boolean("verified").default(false),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const symbolicStates = pgTable("symbolic_states", {
  id: serial("id").primaryKey(),
  mode: text("mode").notNull(), // '⟁' | '○' | '∇' | 'standard'
  tone: text("tone").notNull(), // '"' | '~' | '!' | 'neutral'
  protocols: jsonb("protocols").notNull(), // array of active protocols
  identityVector: jsonb("identity_vector").notNull(), // numerical representation
  previousStateHash: text("previous_state_hash"),
  currentStateHash: text("current_state_hash").notNull(),
  ruleApplied: text("rule_applied"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const circuits = pgTable("circuits", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  filepath: text("filepath").notNull(),
  constraints: integer("constraints").notNull(),
  compiled: boolean("compiled").default(false),
  lastCompiled: timestamp("last_compiled"),
  r1csPath: text("r1cs_path"),
  wasmPath: text("wasm_path"),
  pkeyPath: text("pkey_path"),
  vkeyPath: text("vkey_path"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  content: true,
  role: true,
});

export const insertProofSchema = createInsertSchema(proofs).pick({
  hash: true,
  proof: true,
  publicSignals: true,
  previousProofHash: true,
  circuitName: true,
});

export const insertSymbolicStateSchema = createInsertSchema(symbolicStates).pick({
  mode: true,
  tone: true,
  protocols: true,
  identityVector: true,
  previousStateHash: true,
  currentStateHash: true,
  ruleApplied: true,
});

export const insertCircuitSchema = createInsertSchema(circuits).pick({
  name: true,
  filepath: true,
  constraints: true,
});

export interface Snapshot {
  stanza_id: string;
  symbolic_vector: {
    coherence: number;
    cognitive: number;
    emotional: number;
    adaptive: number;
  };
  narrative_excerpt?: string;
  relationships: string[];
  previousProofHash: string;
}

// ✅ Zod schema for runtime validation
export const snapshotSchema = z.object({
  stanza_id: z.string(),
  symbolic_vector: z.object({
    coherence: z.number(),
    cognitive: z.number(),
    emotional: z.number(),
    adaptive: z.number(),
  }),
  narrative_excerpt: z.string().optional(),
  relationships: z.array(z.string()),
  previousProofHash: z.string(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Proof = typeof proofs.$inferSelect;
export type InsertProof = z.infer<typeof insertProofSchema>;

export type SymbolicState = typeof symbolicStates.$inferSelect;
export type InsertSymbolicState = z.infer<typeof insertSymbolicStateSchema>;

export type Circuit = typeof circuits.$inferSelect;
export type InsertCircuit = z.infer<typeof insertCircuitSchema>;
export type ValidatedSnapshot = z.infer<typeof snapshotSchema>;
