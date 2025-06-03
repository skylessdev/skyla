import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Proof {
  id: number;
  hash: string;
  circuitName: string;
  verified: boolean;
  timestamp: string;
}

export default function ProofPanel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: proofs, isLoading } = useQuery({
    queryKey: ['/api/proofs'],
    refetchInterval: 2000,
  });

  const generateProofMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/proofs/generate");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/proofs'] });
      toast({
        title: "Proof Generated",
        description: "New ZK-proof has been successfully generated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate proof",
        variant: "destructive",
      });
    }
  });

  const getStatusColor = (verified: boolean) => {
    return verified ? 'text-accent' : 'text-yellow-400';
  };

  const getStatusText = (verified: boolean) => {
    return verified ? 'VERIFIED' : 'PENDING';
  };

  return (
    <div className="holographic rounded-xl p-6" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(0, 212, 255, 0.1) 100%)' }}>
      <h3 className="text-lg font-futuristic text-primary mb-4 flex items-center">
        <i className="fas fa-shield-alt mr-2"></i>
        ZK-PROOF STATUS
      </h3>
      
      <div className="space-y-4">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/30 rounded-lg"></div>
            ))}
          </div>
        ) : (
          (proofs as Proof[])?.slice(0, 3).map((proof) => (
            <div key={proof.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-primary/30">
              <div>
                <p className="text-sm font-mono text-primary">{proof.circuitName}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(proof.timestamp).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground font-mono mt-1 break-all">
                  {proof.hash.slice(0, 16)}...{proof.hash.slice(-8)}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                {proof.verified ? (
                  <i className="fas fa-check text-accent"></i>
                ) : (
                  <i className="fas fa-clock text-yellow-400 animate-pulse"></i>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-muted-foreground/30">
        <div className="grid grid-cols-2 gap-3 text-xs mb-4">
          <div className="text-center">
            <div className="text-accent font-semibold text-lg">
              {(proofs as Proof[])?.length || 0}
            </div>
            <div className="text-muted-foreground">Total Proofs</div>
          </div>
          <div className="text-center">
            <div className="text-primary font-semibold text-lg">
              {Math.round(((proofs as Proof[])?.filter(p => p.verified).length || 0) / Math.max((proofs as Proof[])?.length || 1, 1) * 100)}%
            </div>
            <div className="text-muted-foreground">Success Rate</div>
          </div>
        </div>

        <Button 
          onClick={() => generateProofMutation.mutate()}
          disabled={generateProofMutation.isPending}
          className="w-full bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 transition-all duration-300"
        >
          {generateProofMutation.isPending ? (
            <i className="fas fa-spinner animate-spin mr-2"></i>
          ) : (
            <i className="fas fa-plus mr-2"></i>
          )}
          GENERATE NEW PROOF
        </Button>
      </div>
    </div>
  );
}
