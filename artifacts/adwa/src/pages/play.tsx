import { useState } from "react";
import { useLocation } from "wouter";
import { usePlayer } from "@/hooks/use-player";
import { useCreateMatch, useCreatePlayer, useGetStatsSummary } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Zap, Target, Search } from "lucide-react";

const MODES = [
  { id: "blitz", name: "BLITZ", time: "3+2", icon: Zap, desc: "Fast, unforgiving tactical combat." },
  { id: "rapid", name: "RAPID", time: "10+5", icon: Target, desc: "Balanced strategic warfare." },
  { id: "classical", name: "CLASSICAL", time: "30+0", icon: Clock, desc: "Deep analytical grand strategy." }
];

export default function Play() {
  const [location, setLocation] = useLocation();
  const { localPlayer } = usePlayer();
  const createMatch = useCreateMatch();
  const createPlayer = useCreatePlayer();
  const { data: stats } = useGetStatsSummary();

  const [selectedMode, setSelectedMode] = useState<string>("rapid");
  const [isQueueing, setIsQueueing] = useState(false);
  const [queueTime, setQueueTime] = useState(0);

  if (!localPlayer) {
    setLocation("/");
    return null;
  }

  const handleQueue = async () => {
    setIsQueueing(true);
    
    // Simulate matchmaking queue
    const timer = setInterval(() => {
      setQueueTime(prev => prev + 1);
    }, 1000);

    try {
      // Create a simulated AI opponent in the DB so the backend can pair them
      const AI_HOUSES: Array<'shewa' | 'tigray' | 'gojjam' | 'wollo' | 'harar'> = ['tigray', 'gojjam', 'wollo', 'harar', 'shewa'];
      const randomHouse = AI_HOUSES[Math.floor(Math.random() * AI_HOUSES.length)];
      const aiSuffix = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
      const opponentAddress = `0xAI${aiSuffix}000000000000000000000000000000000000`;
      const aiNames = ['Ras_Mikael', 'Taytu_Betul', 'Alula_Engida', 'Fitawrari_Gebeyehu', 'Ras_Makonnen'];
      const aiName = aiNames[Math.floor(Math.random() * aiNames.length)];

      await createPlayer.mutateAsync({
        data: { walletAddress: opponentAddress, displayName: aiName, house: randomHouse }
      });

      const res = await createMatch.mutateAsync({
        data: {
          whiteAddress: localPlayer.walletAddress,
          blackAddress: opponentAddress,
          mode: selectedMode as "blitz" | "rapid" | "classical" | "casual"
        }
      });

      clearInterval(timer);
      
      // Artificial delay for cinematic effect
      setTimeout(() => {
        setLocation(`/game/${res.id}`);
      }, 2000);

    } catch (e) {
      console.error("Matchmaking failed", e);
      clearInterval(timer);
      setIsQueueing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center justify-center">
      <AnimatePresence mode="wait">
        {!isQueueing ? (
          <motion.div
            key="selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-4xl space-y-12"
          >
            <div className="text-center space-y-4">
               <h1 className="text-4xl font-display text-secondary tracking-widest">CHOOSE YOUR BATTLE</h1>
               <p className="text-muted-foreground font-serif tracking-wider">The drums of war sound. How will you answer?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {MODES.map(mode => {
                const Icon = mode.icon;
                const isSelected = selectedMode === mode.id;
                
                return (
                  <div
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id)}
                    className={`
                      relative cursor-pointer rounded-sm border p-6 flex flex-col items-center text-center transition-all duration-300
                      ${isSelected ? 'border-secondary bg-secondary/10 shadow-[0_0_30px_rgba(201,168,76,0.15)]' : 'border-border/50 bg-card hover:border-secondary/50 hover:bg-white/5'}
                    `}
                  >
                    <Icon size={48} className={`mb-6 ${isSelected ? 'text-secondary' : 'text-muted-foreground'}`} />
                    <h3 className={`font-display text-2xl mb-2 tracking-widest ${isSelected ? 'text-secondary' : 'text-foreground'}`}>
                      {mode.name}
                    </h3>
                    <div className="font-mono text-xl mb-4 text-foreground/80">{mode.time}</div>
                    <p className="font-serif text-sm text-muted-foreground mt-auto">
                      {mode.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col items-center justify-center gap-6 pt-8 border-t border-border/50">
              <div className="flex items-center gap-6 font-mono text-sm text-muted-foreground">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-secondary animate-pulse" /> {stats?.activeGames || 42} Active Matches</span>
                <span>•</span>
                <span>{stats?.totalPlayers || 1896} Players Online</span>
              </div>
              
              <Button 
                size="lg" 
                className="w-full max-w-md h-16 text-xl bg-primary hover:bg-primary/90"
                onClick={handleQueue}
              >
                ENTER MATCHMAKING
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="queue"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center space-y-8"
          >
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-secondary/20 flex items-center justify-center">
                <Search size={40} className="text-secondary animate-pulse" />
              </div>
              <svg className="absolute inset-0 w-full h-full animate-[spin_3s_linear_infinite]" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="4" className="text-secondary" strokeDasharray="75 225" strokeLinecap="round" />
              </svg>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-display text-secondary tracking-widest">SEEKING OPPONENT</h2>
              <div className="font-mono text-4xl">{formatTime(queueTime)}</div>
              <p className="font-serif text-muted-foreground uppercase tracking-widest text-sm">
                Mode: {MODES.find(m => m.id === selectedMode)?.name}
              </p>
            </div>

            {queueTime > 1 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-primary font-serif tracking-widest animate-pulse"
              >
                OPPONENT FOUND. PREPARING ARENA...
              </motion.div>
            )}

            {queueTime <= 1 && (
              <Button variant="outline" onClick={() => { setIsQueueing(false); setQueueTime(0); }} className="mt-8">
                CANCEL
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
