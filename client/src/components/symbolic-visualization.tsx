import { useQuery } from "@tanstack/react-query";

interface SymbolicState {
  mode: string;
  tone: string;
  protocols: string[];
  identityVector: number[];
  currentStateHash: string;
  timestamp: string;
}

interface SymbolicVisualizationProps {
  currentState?: SymbolicState;
}

interface Transition {
  description: string;
  timestamp: string;
  type: 'COGNITIVE' | 'EMOTIONAL' | 'MODE_CHANGE' | 'PROTOCOL_UPDATE';
}

export default function SymbolicVisualization({ currentState }: SymbolicVisualizationProps) {
  const { data: stateHistory } = useQuery({
    queryKey: ['/api/symbolic-state/history'],
    refetchInterval: 5000,
  });

  const getVisualizationData = () => {
    if (!currentState) return null;
    
    const vector = currentState.identityVector as number[];
    const cognitiveLevel = Math.round(vector[0] * 100);
    const proofNetworkLevel = Math.round(vector[1] * 100);
    const adaptationLevel = Math.round(vector[2] * 100);
    
    return {
      cognitive: {
        level: cognitiveLevel,
        status: cognitiveLevel > 70 ? 'Analytical Processing' : 'Standard Processing'
      },
      proofNetwork: {
        level: proofNetworkLevel,
        status: `${Math.floor(proofNetworkLevel / 10)} Active Nodes`
      },
      adaptation: {
        level: adaptationLevel,
        status: adaptationLevel > 80 ? 'Real-time Learning' : 'Adaptive Processing'
      }
    };
  };

  const getMockTransitions = (): Transition[] => {
    const now = new Date();
    return [
      {
        description: 'Cognitive → Analytical',
        timestamp: new Date(now.getTime() - 30000).toLocaleTimeString(),
        type: 'COGNITIVE'
      },
      {
        description: 'Proof Network Expansion',
        timestamp: new Date(now.getTime() - 60000).toLocaleTimeString(),
        type: 'PROTOCOL_UPDATE'
      },
      {
        description: 'Adaptive Response Triggered',
        timestamp: new Date(now.getTime() - 90000).toLocaleTimeString(),
        type: 'MODE_CHANGE'
      }
    ];
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'COGNITIVE': return 'text-accent';
      case 'PROTOCOL_UPDATE': return 'text-primary';
      case 'MODE_CHANGE': return 'text-purple-400';
      default: return 'text-muted-foreground';
    }
  };

  const visualData = getVisualizationData();
  const transitions = getMockTransitions();

  return (
    <div className="holographic rounded-xl p-6">
      <h3 className="text-xl font-futuristic text-primary mb-6 flex items-center">
        <i className="fas fa-project-diagram mr-3"></i>
        SYMBOLIC STATE VISUALIZATION
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cognitive State */}
        <div className="text-center">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-primary to-accent p-1 mb-4">
            <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
              <i className="fas fa-brain text-2xl text-primary animate-pulse-slow"></i>
            </div>
          </div>
          <h4 className="font-futuristic text-primary mb-2">COGNITIVE STATE</h4>
          <p className="text-sm text-muted-foreground font-mono">
            {visualData?.cognitive.status || 'Processing...'}
          </p>
          <div className="mt-2 w-full bg-muted rounded-full h-1">
            <div 
              className="bg-primary h-1 rounded-full animate-pulse-slow transition-all duration-1000"
              style={{ width: `${visualData?.cognitive.level || 50}%` }}
            ></div>
          </div>
        </div>

        {/* Proof Network */}
        <div className="text-center">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-purple-400 to-pink-400 p-1 mb-4">
            <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
              <i className="fas fa-network-wired text-2xl text-purple-400 animate-pulse-slow"></i>
            </div>
          </div>
          <h4 className="font-futuristic text-purple-400 mb-2">PROOF NETWORK</h4>
          <p className="text-sm text-muted-foreground font-mono">
            {visualData?.proofNetwork.status || 'Initializing...'}
          </p>
          <div className="mt-2 w-full bg-muted rounded-full h-1">
            <div 
              className="bg-purple-400 h-1 rounded-full proof-verified transition-all duration-1000"
              style={{ width: `${visualData?.proofNetwork.level || 50}%` }}
            ></div>
          </div>
        </div>

        {/* Adaptation */}
        <div className="text-center">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-accent to-orange-400 p-1 mb-4">
            <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
              <i className="fas fa-sync-alt text-2xl text-accent animate-pulse-slow"></i>
            </div>
          </div>
          <h4 className="font-futuristic text-accent mb-2">ADAPTATION</h4>
          <p className="text-sm text-muted-foreground font-mono">
            {visualData?.adaptation.status || 'Learning...'}
          </p>
          <div className="mt-2 w-full bg-muted rounded-full h-1">
            <div 
              className="bg-accent h-1 rounded-full animate-glow transition-all duration-1000"
              style={{ width: `${visualData?.adaptation.level || 50}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Current State Info */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-muted-foreground/30">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h4 className="font-mono text-foreground mb-2">Current Mode:</h4>
            <p className="text-primary font-futuristic text-lg">
              {currentState?.mode?.toUpperCase() || 'STANDARD'}
            </p>
          </div>
          <div>
            <h4 className="font-mono text-foreground mb-2">Active Protocols:</h4>
            <div className="flex flex-wrap gap-1">
              {(currentState?.protocols || ['basic'])?.map((protocol, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-mono"
                >
                  {protocol}
                </span>
              ))}
            </div>
          </div>
        </div>

        <h4 className="font-mono text-foreground mb-3">Recent Symbolic Transitions:</h4>
        <div className="space-y-2 text-sm font-mono">
          {transitions.map((transition, index) => (
            <div key={index} className="flex justify-between text-muted-foreground">
              <span>{transition.description}</span>
              <span className={getTypeColor(transition.type)}>{transition.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
