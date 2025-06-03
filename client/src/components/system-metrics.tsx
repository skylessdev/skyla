interface SystemMetrics {
  proofGeneration?: string;
  circuitEfficiency?: string;
  memoryUsage?: string;
  totalProofs?: number;
  verifiedProofs?: number;
  successRate?: string;
}

interface SystemMetricsProps {
  metrics?: SystemMetrics;
}

export default function SystemMetrics({ metrics }: SystemMetricsProps) {
  const getProgressWidth = (value: string) => {
    const numValue = parseInt(value);
    return Math.min(numValue, 100);
  };

  const getProgressColor = (value: string, type: 'time' | 'percent' | 'memory') => {
    const numValue = parseInt(value);
    
    switch (type) {
      case 'time':
        return numValue < 1000 ? 'from-accent to-primary' : 'from-yellow-400 to-red-400';
      case 'percent':
        return numValue > 80 ? 'from-primary to-purple-400' : 'from-yellow-400 to-orange-400';
      case 'memory':
        return numValue < 100 ? 'from-orange-400 to-yellow-400' : 'from-red-400 to-pink-400';
      default:
        return 'from-primary to-accent';
    }
  };

  return (
    <div className="holographic rounded-xl p-6">
      <h3 className="text-lg font-futuristic text-pink-400 mb-4 flex items-center">
        <i className="fas fa-chart-line mr-2"></i>
        SYSTEM METRICS
      </h3>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground font-mono">Proof Generation</span>
            <span className="text-accent font-mono">{metrics?.proofGeneration || '---'}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`bg-gradient-to-r ${getProgressColor(metrics?.proofGeneration || '0', 'time')} h-2 rounded-full animate-pulse-slow transition-all duration-500`}
              style={{ width: `${Math.min(parseInt(metrics?.proofGeneration || '0') / 10, 100)}%` }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground font-mono">Circuit Efficiency</span>
            <span className="text-primary font-mono">{metrics?.circuitEfficiency || '---'}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`bg-gradient-to-r ${getProgressColor(metrics?.circuitEfficiency || '0', 'percent')} h-2 rounded-full transition-all duration-500`}
              style={{ width: `${getProgressWidth(metrics?.circuitEfficiency || '0')}%` }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground font-mono">Memory Usage</span>
            <span className="text-orange-400 font-mono">{metrics?.memoryUsage || '---'}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`bg-gradient-to-r ${getProgressColor(metrics?.memoryUsage || '0', 'memory')} h-2 rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(parseInt(metrics?.memoryUsage || '0'), 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-muted-foreground/30">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-accent">
              {metrics?.totalProofs || 0}
            </div>
            <div className="text-xs text-muted-foreground">Total Proofs</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">
              {metrics?.successRate || '100%'}
            </div>
            <div className="text-xs text-muted-foreground">Success Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}
