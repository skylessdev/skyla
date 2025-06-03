import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import ChatInterface from "@/components/chat-interface";
import ProofPanel from "@/components/proof-panel";
import CircuitStatus from "@/components/circuit-status";
import SystemMetrics from "@/components/system-metrics";
import SymbolicVisualization from "@/components/symbolic-visualization";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);

  const { data: systemStatus } = useQuery({
    queryKey: ['/api/metrics'],
    refetchInterval: 5000,
  });

  const { data: currentState } = useQuery({
    queryKey: ['/api/symbolic-state'],
    refetchInterval: 2000,
  });

  const { data: circuits } = useQuery({
    queryKey: ['/api/circuits'],
    refetchInterval: 10000,
  });

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Matrix Background Effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="matrix-bg absolute w-full h-full opacity-20"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 holographic border-b border-primary/30">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent animate-pulse-slow flex items-center justify-center">
                <i className="fas fa-brain text-background text-lg"></i>
              </div>
              <div>
                <h1 className="text-2xl font-futuristic font-bold gradient-text">
                  SKYLA
                </h1>
                <p className="text-xs text-muted-foreground font-mono">v1.0.0 | Symbolic AI Agent</p>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse proof-verified"></div>
                <span className="text-sm font-mono text-accent">CONNECTED</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <span className="text-sm font-mono text-primary">ZK-PROOFS ACTIVE</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(var(--deep-purple))' }}></div>
                <span className="text-sm font-mono" style={{ color: 'hsl(var(--deep-purple))' }}>CIRCUITS LOADED</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Interface */}
          <div className="lg:col-span-2 space-y-6">
            <ChatInterface 
              currentState={currentState}
              onLoadingChange={setIsLoading}
            />
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            <ProofPanel />
            <SystemMetrics metrics={systemStatus} />
            <CircuitStatus circuits={circuits} />
          </div>

        </div>

        {/* Symbolic Visualization */}
        <SymbolicVisualization currentState={currentState} />

      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
            <p className="text-primary font-futuristic text-lg">Generating ZK-Proof...</p>
            <p className="text-muted-foreground font-mono text-sm mt-2">Compiling symbolic transition circuit</p>
          </div>
        </div>
      )}
    </div>
  );
}
