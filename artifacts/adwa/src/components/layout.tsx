import { Link, useLocation } from "wouter";
import { usePlayer } from "@/hooks/use-player";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { LogOut, Sword, Trophy, User } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { localPlayer, logout } = usePlayer();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <div className="min-h-[100dvh] flex flex-col relative text-foreground">
      <div className="texture-overlay" />
      
      <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-sm bg-secondary flex items-center justify-center text-secondary-foreground font-display font-bold text-xl group-hover:bg-secondary/80 transition-colors">
              A
            </div>
            <span className="font-display font-bold text-xl tracking-widest text-foreground group-hover:text-secondary transition-colors">
              ADWA
            </span>
          </Link>

          {localPlayer && (
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="text-sm font-serif tracking-widest text-muted-foreground hover:text-secondary transition-colors flex items-center gap-2">
                <User size={16} /> CAMP
              </Link>
              <Link href="/play" className="text-sm font-serif tracking-widest text-muted-foreground hover:text-secondary transition-colors flex items-center gap-2">
                <Sword size={16} /> BATTLE
              </Link>
              <Link href="/leaderboard" className="text-sm font-serif tracking-widest text-muted-foreground hover:text-secondary transition-colors flex items-center gap-2">
                <Trophy size={16} /> GLORY
              </Link>
            </nav>
          )}

          <div className="flex items-center gap-4">
            {localPlayer ? (
              <div className="flex items-center gap-4">
                <Link href={`/profile/${localPlayer.walletAddress}`} className="text-sm font-mono text-secondary hover:underline">
                  {localPlayer.displayName}
                </Link>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
                  <LogOut size={18} />
                </Button>
              </div>
            ) : (
              <Button asChild variant="outline" className="border-secondary text-secondary">
                <Link href="/">CONNECT</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative z-10">
        <motion.div
          key={location}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex-1 flex flex-col"
        >
          {children}
        </motion.div>
      </main>

      <footer className="border-t border-border/50 py-8 relative z-10">
        <div className="container mx-auto px-4 text-center">
          <p className="font-serif text-muted-foreground text-sm tracking-widest">
            HONOR THE PAST. CONQUER THE FUTURE.
          </p>
        </div>
      </footer>
    </div>
  );
}
