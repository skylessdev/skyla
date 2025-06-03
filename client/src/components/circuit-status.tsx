import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Circuit {
  id: number;
  name: string;
  constraints: number;
  compiled: boolean;
  lastCompiled?: string;
}

interface CircuitStatusProps {
  circuits?: Circuit[];
}

export default function CircuitStatus({ circuits }: CircuitStatusProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const recompileMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/circuits/recompile");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/circuits'] });
      toast({
        title: "Circuits Recompiled",
        description: "All circuits have been successfully recompiled",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to recompile circuits",
        variant: "destructive",
      });
    }
  });

  const getStatusColor = (compiled: boolean) => {
    return compiled ? 'border-accent' : 'border-yellow-400';
  };

  const getStatusText = (compiled: boolean) => {
    return compiled ? 'COMPILED' : 'COMPILING';
  };

  const getStatusBadgeColor = (compiled: boolean) => {
    return compiled ? 'bg-accent/20 text-accent' : 'bg-yellow-400/20 text-yellow-400';
  };

  return (
    <div className="holographic rounded-xl p-6">
      <h3 className="text-lg font-futuristic mb-4 flex items-center" style={{ color: 'hsl(var(--deep-purple))' }}>
        <i className="fas fa-code mr-2"></i>
        CIRCUIT STATUS
      </h3>
      
      <div className="space-y-3">
        {circuits?.map((circuit) => (
          <div key={circuit.id} className={`p-3 bg-muted/50 rounded-lg border-l-4 ${getStatusColor(circuit.compiled)}`}>
            <div className="flex justify-between items-center">
              <span className="font-mono text-sm text-foreground">{circuit.name}.circom</span>
              <span className={`text-xs px-2 py-1 rounded ${getStatusBadgeColor(circuit.compiled)} ${!circuit.compiled ? 'animate-pulse' : ''}`}>
                {getStatusText(circuit.compiled)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {circuit.constraints.toLocaleString()} constraints
            </p>
            {circuit.lastCompiled && (
              <p className="text-xs text-muted-foreground">
                Last compiled: {new Date(circuit.lastCompiled).toLocaleString()}
              </p>
            )}
          </div>
        ))}
      </div>

      <Button 
        onClick={() => recompileMutation.mutate()}
        disabled={recompileMutation.isPending}
        className="w-full mt-4 border border-purple-400/50 text-purple-400 hover:bg-purple-400/30 transition-all duration-300"
        style={{ 
          backgroundColor: 'hsl(var(--deep-purple) / 0.2)',
          color: 'hsl(var(--deep-purple))'
        }}
      >
        {recompileMutation.isPending ? (
          <i className="fas fa-spinner animate-spin mr-2"></i>
        ) : (
          <i className="fas fa-sync-alt mr-2"></i>
        )}
        RECOMPILE CIRCUITS
      </Button>
    </div>
  );
}
