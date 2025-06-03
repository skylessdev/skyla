import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: number;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
  proofHash?: string;
  symbolicState?: any;
}

interface ChatInterfaceProps {
  currentState?: any;
  onLoadingChange: (loading: boolean) => void;
}

const operationalModes = [
  { id: 'adaptive', name: 'ADAPTIVE', icon: 'fa-robot', color: 'text-accent' },
  { id: 'daemon', name: 'DAEMON', icon: 'fa-cogs', color: 'text-purple-400' },
  { id: 'build', name: 'BUILD', icon: 'fa-hammer', color: 'text-pink-400' },
  { id: 'analyze', name: 'ANALYZE', icon: 'fa-search', color: 'text-orange-400' }
];

export default function ChatInterface({ currentState, onLoadingChange }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("");
  const [selectedMode, setSelectedMode] = useState("adaptive");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/messages'],
    refetchInterval: 1000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/messages", {
        content: message,
        role: "user"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/proofs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/symbolic-state'] });
      setInputValue("");
      onLoadingChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      onLoadingChange(false);
    }
  });

  const switchModeMutation = useMutation({
    mutationFn: async (mode: string) => {
      const response = await apiRequest("POST", "/api/mode", { mode });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/symbolic-state'] });
      queryClient.invalidateQueries({ queryKey: ['/api/proofs'] });
      toast({
        title: "Mode Switched",
        description: `Successfully switched to ${selectedMode} mode`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to switch mode",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    onLoadingChange(true);
    sendMessageMutation.mutate(inputValue);
  };

  const handleModeSwitch = (mode: string) => {
    setSelectedMode(mode);
    switchModeMutation.mutate(mode);
  };

  return (
    <>
      {/* Chat Interface */}
      <div className="holographic rounded-xl p-6 terminal-glow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-futuristic text-primary">SYMBOLIC INTERFACE</h2>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-accent/20 text-accent rounded-full text-sm font-mono">
              {currentState?.mode?.toUpperCase() || 'ADAPTIVE'} MODE
            </span>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="h-96 overflow-y-auto space-y-4 mb-4 circuit-pattern rounded-lg p-4">
          {messagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            (messages as Message[])?.map((message) => (
              <div key={message.id} className={`flex space-x-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role !== 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                    <i className="fas fa-brain text-xs"></i>
                  </div>
                )}
                <div className={`flex-1 ${message.role === 'user' ? 'max-w-md' : ''}`}>
                  <div className={`rounded-lg p-3 border ${
                    message.role === 'user' 
                      ? 'bg-accent/10 border-accent/30' 
                      : message.role === 'system'
                      ? 'bg-primary/10 border-primary/30'
                      : 'bg-muted/50 border-muted-foreground/30'
                  }`}>
                    <p className="text-foreground">{message.content}</p>
                    {message.proofHash && (
                      <div className="mt-2 p-2 bg-primary/10 border border-primary/20 rounded">
                        <p className="text-xs text-primary font-mono">ZK-PROOF VERIFIED</p>
                        <code className="text-xs text-muted-foreground block mt-1 break-all">
                          {message.proofHash}
                        </code>
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground font-mono mt-1 block">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center">
                    <i className="fas fa-user text-xs"></i>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <Input
            type="text"
            placeholder="Enter your thoughts or commands..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 bg-muted/70 border-muted-foreground font-mono focus:border-primary"
            disabled={sendMessageMutation.isPending}
          />
          <Button 
            type="submit"
            className="px-6 bg-gradient-to-r from-primary to-accent text-background hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 transform hover:scale-105"
            disabled={sendMessageMutation.isPending}
          >
            <i className="fas fa-paper-plane"></i>
          </Button>
        </form>
      </div>

      {/* Mode Selector */}
      <div className="holographic rounded-xl p-6">
        <h3 className="text-lg font-futuristic mb-4" style={{ color: 'hsl(var(--deep-purple))' }}>
          OPERATIONAL MODES
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {operationalModes.map((mode) => (
            <Button
              key={mode.id}
              variant="outline"
              onClick={() => handleModeSwitch(mode.id)}
              className={`p-3 border-muted-foreground hover:border-accent hover:bg-accent/10 transition-all duration-300 group ${
                selectedMode === mode.id ? 'border-accent bg-accent/10' : ''
              }`}
              disabled={switchModeMutation.isPending}
            >
              <div className="text-center">
                <i className={`fas ${mode.icon} ${mode.color} text-lg mb-2 group-hover:animate-pulse`}></i>
                <p className="text-sm font-mono text-foreground group-hover:text-accent">{mode.name}</p>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </>
  );
}
