import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { usePlayer } from "@/hooks/use-player";
import { useGetStatsSummary } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Sword } from "lucide-react";

export default function Landing() {
  const [location, setLocation] = useLocation();
  const { localPlayer, login } = usePlayer();
  const { data: stats } = useGetStatsSummary();
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (localPlayer) {
      setLocation("/dashboard");
    }
  }, [localPlayer, setLocation]);

  const handleConnect = () => {
    setIsConnecting(true);
    // Simulate wallet connection delay
    setTimeout(() => {
      // Simulate generating a fake address if not logged in
      const fakeAddress = "0x" + Math.random().toString(16).substring(2, 40);
      setLocation("/onboard?address=" + fakeAddress);
    }, 1000);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background ambient effect */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-5 pointer-events-none">
        <div className="w-[80vw] h-[80vw] max-w-4xl max-h-4xl border border-secondary rounded-full animate-[spin_60s_linear_infinite] opacity-20" />
        <div className="w-[60vw] h-[60vw] max-w-3xl max-h-3xl border border-primary rounded-full animate-[spin_40s_linear_infinite_reverse] absolute opacity-30" />
      </div>

      <div className="container mx-auto px-4 z-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-widest text-foreground uppercase drop-shadow-lg">
            A<span className="text-secondary">D</span>W<span className="text-primary">A</span>
          </h1>
          <div className="h-1 w-24 bg-gradient-to-r from-transparent via-secondary to-transparent mx-auto mt-4" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl md:text-2xl text-muted-foreground font-serif tracking-wider max-w-2xl mb-12"
        >
          The year is 1896. The empire stands united. Take your place at the war council and lead your house to glory.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-6 items-center"
        >
          <Button 
            size="lg" 
            className="w-full sm:w-auto text-lg px-12 h-16 group relative overflow-hidden bg-secondary text-secondary-foreground hover:bg-secondary/90"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <span className="animate-pulse">CONNECTING...</span>
            ) : (
              <span className="flex items-center gap-3">
                <Sword className="group-hover:rotate-12 transition-transform" />
                ENTER THE ARENA
              </span>
            )}
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 border-t border-border/50 pt-12"
        >
          <div className="flex flex-col items-center">
            <span className="font-mono text-3xl text-secondary mb-2">{stats?.totalPlayers || "1,896"}</span>
            <span className="text-sm font-serif tracking-widest text-muted-foreground uppercase">Warriors</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-mono text-3xl text-primary mb-2">{stats?.totalMatches || "14,203"}</span>
            <span className="text-sm font-serif tracking-widest text-muted-foreground uppercase">Battles Fought</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-mono text-3xl text-foreground mb-2">{stats?.activeGames || "42"}</span>
            <span className="text-sm font-serif tracking-widest text-muted-foreground uppercase">Active Fronts</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-mono text-3xl text-accent mb-2">1.5M</span>
            <span className="text-sm font-serif tracking-widest text-muted-foreground uppercase">ADWA Distributed</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
