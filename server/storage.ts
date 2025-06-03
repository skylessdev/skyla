import { users, messages, proofs, symbolicStates, circuits, type User, type InsertUser, type Message, type InsertMessage, type Proof, type InsertProof, type SymbolicState, type InsertSymbolicState, type Circuit, type InsertCircuit } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Message methods
  getMessages(limit?: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessageProof(id: number, proofHash: string, symbolicState: any): Promise<Message | undefined>;

  // Proof methods
  getProof(hash: string): Promise<Proof | undefined>;
  getRecentProofs(limit?: number): Promise<Proof[]>;
  createProof(proof: InsertProof): Promise<Proof>;
  verifyProof(hash: string): Promise<Proof | undefined>;

  // Symbolic state methods
  getCurrentSymbolicState(): Promise<SymbolicState | undefined>;
  getSymbolicStateHistory(limit?: number): Promise<SymbolicState[]>;
  createSymbolicState(state: InsertSymbolicState): Promise<SymbolicState>;

  // Circuit methods
  getCircuits(): Promise<Circuit[]>;
  getCircuit(name: string): Promise<Circuit | undefined>;
  createCircuit(circuit: InsertCircuit): Promise<Circuit>;
  updateCircuitCompilation(name: string, compiled: boolean, paths: { r1cs?: string; wasm?: string; pkey?: string; vkey?: string }): Promise<Circuit | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private messages: Map<number, Message>;
  private proofs: Map<string, Proof>;
  private symbolicStates: Map<number, SymbolicState>;
  private circuits: Map<string, Circuit>;
  private currentId: number;
  private currentMessageId: number;
  private currentStateId: number;
  private currentCircuitId: number;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.proofs = new Map();
    this.symbolicStates = new Map();
    this.circuits = new Map();
    this.currentId = 1;
    this.currentMessageId = 1;
    this.currentStateId = 1;
    this.currentCircuitId = 1;

    // Initialize with default circuits
    this.initializeDefaultCircuits();
    this.initializeDefaultSymbolicState();
  }

  private async initializeDefaultCircuits() {
    const defaultCircuits = [
      { name: "SymbolicTransition", filepath: "/server/circuits/symbolic-transition.circom", constraints: 1247 },
      { name: "Identity", filepath: "/server/circuits/identity.circom", constraints: 892 },
      { name: "ProofVerification", filepath: "/server/circuits/proof-verification.circom", constraints: 2103 }
    ];

    for (const circuit of defaultCircuits) {
      await this.createCircuit(circuit);
    }
  }

  private async initializeDefaultSymbolicState() {
    const initialState = {
      mode: "standard",
      tone: "neutral",
      protocols: ["basic"],
      identityVector: [0.5, 0.5, 0.5, 0.5],
      previousStateHash: null,
      currentStateHash: "0x" + Math.random().toString(16).substr(2, 64),
      ruleApplied: "initialization"
    };

    await this.createSymbolicState(initialState);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getMessages(limit: number = 50): Promise<Message[]> {
    const allMessages = Array.from(this.messages.values())
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return allMessages.slice(-limit);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = { 
      ...insertMessage, 
      id, 
      timestamp: new Date(),
      proofHash: null,
      symbolicState: null
    };
    this.messages.set(id, message);
    return message;
  }

  async updateMessageProof(id: number, proofHash: string, symbolicState: any): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (message) {
      message.proofHash = proofHash;
      message.symbolicState = symbolicState;
      this.messages.set(id, message);
      return message;
    }
    return undefined;
  }

  async getProof(hash: string): Promise<Proof | undefined> {
    return this.proofs.get(hash);
  }

  async getRecentProofs(limit: number = 10): Promise<Proof[]> {
    const allProofs = Array.from(this.proofs.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return allProofs.slice(0, limit);
  }

  async createProof(insertProof: InsertProof): Promise<Proof> {
    const proof: Proof = { 
      ...insertProof, 
      id: this.currentId++,
      verified: true,
      timestamp: new Date()
    };
    this.proofs.set(insertProof.hash, proof);
    return proof;
  }

  async verifyProof(hash: string): Promise<Proof | undefined> {
    const proof = this.proofs.get(hash);
    if (proof) {
      proof.verified = true;
      this.proofs.set(hash, proof);
      return proof;
    }
    return undefined;
  }

  async getCurrentSymbolicState(): Promise<SymbolicState | undefined> {
    const allStates = Array.from(this.symbolicStates.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return allStates[0];
  }

  async getSymbolicStateHistory(limit: number = 10): Promise<SymbolicState[]> {
    const allStates = Array.from(this.symbolicStates.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return allStates.slice(0, limit);
  }

  async createSymbolicState(insertState: InsertSymbolicState): Promise<SymbolicState> {
    const id = this.currentStateId++;
    const state: SymbolicState = { 
      ...insertState, 
      id, 
      timestamp: new Date()
    };
    this.symbolicStates.set(id, state);
    return state;
  }

  async getCircuits(): Promise<Circuit[]> {
    return Array.from(this.circuits.values());
  }

  async getCircuit(name: string): Promise<Circuit | undefined> {
    return this.circuits.get(name);
  }

  async createCircuit(insertCircuit: InsertCircuit): Promise<Circuit> {
    const id = this.currentCircuitId++;
    const circuit: Circuit = { 
      ...insertCircuit, 
      id,
      compiled: false,
      lastCompiled: null,
      r1csPath: null,
      wasmPath: null,
      pkeyPath: null,
      vkeyPath: null
    };
    this.circuits.set(insertCircuit.name, circuit);
    return circuit;
  }

  async updateCircuitCompilation(name: string, compiled: boolean, paths: { r1cs?: string; wasm?: string; pkey?: string; vkey?: string }): Promise<Circuit | undefined> {
    const circuit = this.circuits.get(name);
    if (circuit) {
      circuit.compiled = compiled;
      circuit.lastCompiled = new Date();
      if (paths.r1cs) circuit.r1csPath = paths.r1cs;
      if (paths.wasm) circuit.wasmPath = paths.wasm;
      if (paths.pkey) circuit.pkeyPath = paths.pkey;
      if (paths.vkey) circuit.vkeyPath = paths.vkey;
      this.circuits.set(name, circuit);
      return circuit;
    }
    return undefined;
  }
}

export const storage = new MemStorage();
