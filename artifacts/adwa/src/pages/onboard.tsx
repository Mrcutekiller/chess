import { useState } from "react";
import { useLocation } from "wouter";
import { usePlayer } from "@/hooks/use-player";
import { useCreatePlayer } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const HOUSES = [
  {
    id: "shewa",
    name: "House of Shewa",
    color: "var(--adwa-shewa)",
    bg: "from-[#c9a84c]/20 to-transparent",
    border: "border-[#c9a84c]",
    lore: "The Imperial Center. Master strategists and coordinators of the unified front.",
    ability: "Council's Foresight"
  },
  {
    id: "tigray",
    name: "House of Tigray",
    color: "var(--adwa-tigray)",
    bg: "from-[#8b0000]/20 to-transparent",
    border: "border-[#8b0000]",
    lore: "The Northern Shield. Fierce frontier warriors with unmatched tactical aggression.",
    ability: "Frontier Charge"
  },
  {
    id: "gojjam",
    name: "House of Gojjam",
    color: "var(--adwa-gojjam)",
    bg: "from-[#1a4a2e]/20 to-transparent",
    border: "border-[#1a4a2e]",
    lore: "The Mountain Wall. Unbreakable defenders relying on solid, impenetrable structures.",
    ability: "Mountain Wall"
  },
  {
    id: "wollo",
    name: "House of Wollo",
    color: "var(--adwa-wollo)",
    bg: "from-[#b87333]/20 to-transparent",
    border: "border-[#b87333]",
    lore: "Taytu's Vanguard. Masters of intelligence, logistics, and sudden strikes.",
    ability: "Taytu's Vanguard"
  },
  {
    id: "harar",
    name: "House of Harar",
    color: "var(--adwa-harar)",
    bg: "from-[#1e3a5f]/20 to-transparent",
    border: "border-[#1e3a5f]",
    lore: "The Eastern Flank. Swift, unpredictable cavalry capable of devastating maneuvers.",
    ability: "Flanking March"
  }
];

export default function Onboard() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const address = searchParams.get("address");
  const { login } = usePlayer();
  const createPlayer = useCreatePlayer();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [selectedHouse, setSelectedHouse] = useState<string | null>(null);

  if (!address) {
    setLocation("/");
    return null;
  }

  const handleComplete = async () => {
    if (!name || !selectedHouse) return;

    try {
      await createPlayer.mutateAsync({
        data: {
          walletAddress: address,
          displayName: name,
          house: selectedHouse as any
        }
      });
      login(address, name, selectedHouse as any);
      setLocation("/dashboard");
    } catch (e) {
      console.error("Failed to create player", e);
      // Fallback for prototype if API fails
      login(address, name, selectedHouse as any);
      setLocation("/dashboard");
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 relative">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5 }}
            className="max-w-md w-full space-y-8 text-center"
          >
            <div>
              <h2 className="text-3xl font-display text-secondary tracking-widest mb-4">WHAT IS YOUR NAME, WARRIOR?</h2>
              <p className="text-muted-foreground font-serif tracking-wider">The chroniclers wait to record your deeds.</p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter display name"
                className="w-full bg-background border border-border focus:border-secondary rounded-sm px-6 py-4 text-center font-serif text-2xl tracking-widest outline-none transition-colors"
                autoFocus
              />
            </div>

            <Button
              size="lg"
              className="w-full"
              disabled={!name.trim()}
              onClick={() => setStep(2)}
            >
              PROCEED TO COUNCIL
            </Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-6xl mx-auto space-y-12"
          >
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-display text-secondary tracking-widest">PLEDGE YOUR BANNER</h2>
              <p className="text-muted-foreground font-serif text-lg tracking-wider">Choose the provincial house you will represent in the arena.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {HOUSES.map((house, idx) => (
                <motion.div
                  key={house.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => setSelectedHouse(house.id)}
                  className={`
                    relative cursor-pointer overflow-hidden rounded-sm border-2 transition-all duration-300 h-96 flex flex-col p-6
                    ${selectedHouse === house.id ? house.border : 'border-border/40 hover:border-secondary/50'}
                  `}
                >
                  <div className={`absolute inset-0 bg-gradient-to-b ${house.bg} opacity-20`} />
                  
                  {selectedHouse === house.id && (
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-0" />
                  )}

                  <div className="relative z-10 flex-1 flex flex-col">
                    <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center border border-current rounded-full" style={{ color: house.color }}>
                      <span className="font-display text-2xl font-bold">{house.name.charAt(9)}</span>
                    </div>
                    
                    <h3 className="font-display text-xl text-center mb-4 tracking-wider" style={{ color: selectedHouse === house.id ? house.color : 'inherit' }}>
                      {house.name}
                    </h3>
                    
                    <p className="font-serif text-sm text-center text-muted-foreground flex-1">
                      {house.lore}
                    </p>

                    <div className="mt-auto pt-4 border-t border-border/30">
                      <span className="block text-xs font-mono text-center text-muted-foreground mb-1">ABILITY</span>
                      <span className="block font-serif text-sm text-center text-secondary tracking-widest">{house.ability}</span>
                    </div>
                  </div>
                  
                  {selectedHouse === house.id && (
                    <motion.div 
                      layoutId="outline"
                      className="absolute inset-0 border-4 pointer-events-none z-20"
                      style={{ borderColor: house.color }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.div>
              ))}
            </div>

            <div className="flex justify-center pt-8">
              <Button
                size="lg"
                className="w-full max-w-md h-16 text-lg bg-secondary text-secondary-foreground hover:bg-secondary/90"
                disabled={!selectedHouse || createPlayer.isPending}
                onClick={handleComplete}
              >
                {createPlayer.isPending ? "SEALING PACT..." : "SWEAR ALLEGIANCE"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
