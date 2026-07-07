import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useGetMatch, getGetMatchQueryKey } from "@workspace/api-client-react";
import { Chess, Square } from "chess.js";
import { ChevronLeft, ChevronRight, SkipBack, SkipForward, Play as PlayIcon, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

const PIECE_SYMBOLS: Record<string, string> = {
  p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚",
  P: "♙", N: "♘", B: "♗", R: "♖", Q: "♕", K: "♔"
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export default function Replay() {
  const { id } = useParams();
  const replayId = id ?? '';
  const { data: match, isLoading } = useGetMatch(replayId, { query: { enabled: !!id, queryKey: getGetMatchQueryKey(replayId) } });
  
  const [game] = useState(new Chess());
  const [boardHistory, setBoardHistory] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (match?.pgn) {
      const tempGame = new Chess();
      tempGame.loadPgn(match.pgn);
      const moves = tempGame.history();
      
      const history = [new Chess().board()]; // Initial state
      const replayGame = new Chess();
      
      moves.forEach(move => {
        replayGame.move(move);
        history.push(replayGame.board());
      });
      
      setBoardHistory(history);
      setCurrentStep(history.length - 1);
    }
  }, [match]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && currentStep < boardHistory.length - 1) {
      timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 1000);
    } else if (currentStep >= boardHistory.length - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, boardHistory.length]);

  if (isLoading || !match || boardHistory.length === 0) {
    return <div className="flex-1 flex items-center justify-center">Loading Replay...</div>;
  }

  const currentBoard = boardHistory[currentStep];
  const isWhiteWin = match.outcome === 'white_wins';
  const isBlackWin = match.outcome === 'black_wins';

  return (
    <div className="flex-1 flex flex-col items-center py-12 px-4 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-display text-secondary tracking-widest">BATTLE REPLAY</h1>
        <p className="font-mono text-sm text-muted-foreground uppercase">{match.id}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 w-full max-w-5xl justify-center items-start">
        
        {/* Board */}
        <div className="w-full max-w-[500px]">
          <div className="flex justify-between items-center mb-4 px-2">
            <span className="font-serif tracking-widest">{match.blackName}</span>
            <span className="font-mono text-sm text-muted-foreground">{match.blackElo}</span>
          </div>

          <div className="chess-board-grid pointer-events-none shadow-xl">
            {RANKS.map((rank, rIdx) => 
              FILES.map((file, fIdx) => {
                const isDark = (rIdx + fIdx) % 2 !== 0;
                const piece = currentBoard[rIdx][fIdx];
                
                return (
                  <div key={`${file}${rank}`} className={`chess-square ${isDark ? 'dark' : 'light'}`}>
                    {piece && (
                      <span className={`chess-piece ${piece.color === 'w' ? 'white' : 'black'}`} style={{ textShadow: piece.color === 'w' ? '0 2px 4px rgba(0,0,0,0.5)' : 'none' }}>
                        {piece.color === 'w' ? PIECE_SYMBOLS[piece.type.toUpperCase()] : PIECE_SYMBOLS[piece.type.toLowerCase()]}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-between items-center mt-4 px-2">
            <span className="font-serif tracking-widest text-secondary">{match.whiteName}</span>
            <span className="font-mono text-sm text-muted-foreground">{match.whiteElo}</span>
          </div>
        </div>

        {/* Controls & Info */}
        <div className="w-full lg:w-80 space-y-8">
          <div className="border border-border/50 bg-card p-6 text-center space-y-4 rounded-sm">
            <div className="text-sm font-serif tracking-widest text-muted-foreground uppercase border-b border-border/50 pb-2">Outcome</div>
            <div className={`text-2xl font-display tracking-widest ${isWhiteWin ? 'text-secondary' : isBlackWin ? 'text-[#8b0000]' : 'text-muted-foreground'}`}>
              {isWhiteWin ? 'WHITE VICTORY' : isBlackWin ? 'BLACK VICTORY' : 'DRAW'}
            </div>
            {match.resultHash && (
              <div className="text-[10px] font-mono text-muted-foreground truncate opacity-50 bg-background p-2 border border-border">
                {match.resultHash}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 border border-border/50 bg-card p-4 rounded-sm">
            <Button variant="ghost" size="icon" onClick={() => setCurrentStep(0)} disabled={currentStep === 0}>
              <SkipBack size={18} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setCurrentStep(p => Math.max(0, p - 1))} disabled={currentStep === 0}>
              <ChevronLeft size={24} />
            </Button>
            
            <Button variant="outline" size="icon" className="w-12 h-12 rounded-full text-secondary border-secondary" onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? <Pause size={20} /> : <PlayIcon size={20} className="ml-1" />}
            </Button>

            <Button variant="ghost" size="icon" onClick={() => setCurrentStep(p => Math.min(boardHistory.length - 1, p + 1))} disabled={currentStep === boardHistory.length - 1}>
              <ChevronRight size={24} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setCurrentStep(boardHistory.length - 1)} disabled={currentStep === boardHistory.length - 1}>
              <SkipForward size={18} />
            </Button>
          </div>

          <div className="text-center font-mono text-sm text-muted-foreground">
            Move {Math.floor(currentStep / 2) + (currentStep % 2 !== 0 ? 1 : 0)} / {Math.floor((boardHistory.length - 1) / 2)}
          </div>
        </div>
      </div>
    </div>
  );
}
