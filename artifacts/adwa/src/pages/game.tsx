import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { usePlayer } from "@/hooks/use-player";
import { useGetMatch, useCompleteMatch, getGetMatchQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Chess, Square } from "chess.js";
import { Flag, Handshake, Shield, User, Trophy } from "lucide-react";

// Unicode chess pieces mapping
const PIECE_SYMBOLS: Record<string, string> = {
  p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚",
  P: "♙", N: "♘", B: "♗", R: "♖", Q: "♕", K: "♔"
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export default function Game() {
  const { id } = useParams();
  const [location, setLocation] = useLocation();
  const { localPlayer } = usePlayer();
  
  const gameId = id ?? '';
  const { data: match, isLoading } = useGetMatch(gameId, { query: { enabled: !!id, queryKey: getGetMatchQueryKey(gameId) } });
  const completeMatch = useCompleteMatch();

  const [game, setGame] = useState(new Chess());
  const [board, setBoard] = useState(game.board());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [gameOver, setGameOver] = useState<{ isOver: boolean, result: string | null, winner: 'white' | 'black' | 'draw' | null }>({ isOver: false, result: null, winner: null });
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  
  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize game state based on match data
  useEffect(() => {
    if (match && localPlayer) {
      const color = match.whiteAddress === localPlayer.walletAddress ? 'w' : 'b';
      setPlayerColor(color);
      setIsPlayerTurn(game.turn() === color);
      
      // Load PGN if match is continuing
      if (match.pgn && game.history().length === 0) {
        try {
          const newGame = new Chess();
          newGame.loadPgn(match.pgn);
          setGame(newGame);
          setBoard(newGame.board());
          setIsPlayerTurn(newGame.turn() === color);
        } catch (e) {
          console.error("Failed to load PGN", e);
        }
      }
    }
  }, [match, localPlayer, game]);

  // AI Move logic
  useEffect(() => {
    if (!gameOver.isOver && !isPlayerTurn && match) {
      aiTimeoutRef.current = setTimeout(() => {
        const moves = game.moves({ verbose: true });
        if (moves.length > 0) {
          const randomMove = moves[Math.floor(Math.random() * moves.length)];
          makeMove(randomMove.from, randomMove.to);
        }
      }, 1000);
    }
    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    };
  }, [isPlayerTurn, game, gameOver, match]);

  const checkGameOver = useCallback((currentGame: Chess) => {
    if (currentGame.isGameOver()) {
      let winner: 'white' | 'black' | 'draw' | null = null;
      let resultStr = "";

      if (currentGame.isCheckmate()) {
        winner = currentGame.turn() === 'w' ? 'black' : 'white';
        resultStr = "Checkmate";
      } else if (currentGame.isDraw()) {
        winner = 'draw';
        resultStr = "Draw";
      } else if (currentGame.isStalemate()) {
        winner = 'draw';
        resultStr = "Stalemate";
      }

      setGameOver({ isOver: true, result: resultStr, winner });
      
      // Send match completion
      if (match) {
        let outcome: any = 'abandoned';
        if (winner === 'white') outcome = 'white_wins';
        if (winner === 'black') outcome = 'black_wins';
        if (winner === 'draw') outcome = 'draw';

        const verboseMoves = currentGame.history({ verbose: true });
        completeMatch.mutate({
          matchId: match.id,
          data: {
            outcome,
            moves: verboseMoves.map(m => ({ san: m.san, from: m.from, to: m.to, timestamp: Date.now() })),
            pgn: currentGame.pgn()
          }
        });
      }
    }
  }, [match, completeMatch]);

  const makeMove = (from: string, to: string) => {
    try {
      const move = game.move({ from, to, promotion: 'q' });
      if (move) {
        setBoard(game.board());
        setSelectedSquare(null);
        setValidMoves([]);
        setIsPlayerTurn(game.turn() === playerColor);
        checkGameOver(game);
        return true;
      }
    } catch (e) {
      // Invalid move
    }
    return false;
  };

  const handleSquareClick = (square: Square) => {
    if (gameOver.isOver || !isPlayerTurn) return;

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }

      const isValid = validMoves.includes(square);
      if (isValid) {
        makeMove(selectedSquare, square);
        return;
      }
    }

    // Select piece
    const piece = game.get(square);
    if (piece && piece.color === playerColor) {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true });
      setValidMoves(moves.map(m => m.to));
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const handleResign = () => {
    if (gameOver.isOver) return;
    const winner = playerColor === 'w' ? 'black' : 'white';
    setGameOver({ isOver: true, result: "Resignation", winner });
    
    if (match) {
      const verboseMoves = game.history({ verbose: true });
      completeMatch.mutate({
        matchId: match.id,
        data: {
          outcome: winner === 'white' ? 'white_wins' : 'black_wins',
          moves: verboseMoves.map(m => ({ san: m.san, from: m.from, to: m.to, timestamp: Date.now() })),
          pgn: game.pgn()
        }
      });
    }
  };

  if (isLoading || !match) {
    return <div className="flex-1 flex items-center justify-center">Loading Arena...</div>;
  }

  const isWhite = playerColor === 'w';
  const opponentName = isWhite ? match.blackName : match.whiteName;
  const opponentHouse = isWhite ? match.blackHouse : match.whiteHouse;
  const opponentElo = isWhite ? match.blackElo : match.whiteElo;

  // Determine board orientation
  const renderRanks = isWhite ? RANKS : [...RANKS].reverse();
  const renderFiles = isWhite ? FILES : [...FILES].reverse();

  return (
    <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full p-4 gap-8">
      
      {/* Sidebar: Move History & Controls */}
      <div className="w-full lg:w-80 flex flex-col order-2 lg:order-1 gap-6">
        <div className="bg-card border border-border/50 rounded-sm p-4 flex flex-col h-[400px]">
          <h3 className="font-display text-secondary tracking-widest border-b border-border/50 pb-2 mb-2">CHRONICLE</h3>
          <div className="flex-1 overflow-y-auto font-mono text-sm space-y-1 pr-2">
            {game.history().reduce((result: any[], move, index) => {
              if (index % 2 === 0) {
                result.push([move]);
              } else {
                result[result.length - 1].push(move);
              }
              return result;
            }, []).map((turn, i) => (
              <div key={i} className="flex gap-4 p-1 hover:bg-white/5 rounded-sm">
                <span className="text-muted-foreground w-8">{i + 1}.</span>
                <span className="w-16">{turn[0]}</span>
                <span className="w-16">{turn[1] || ''}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <Button variant="outline" className="flex-1 text-destructive border-destructive/50 hover:bg-destructive/10" onClick={handleResign} disabled={gameOver.isOver}>
            <Flag size={16} className="mr-2" /> RESIGN
          </Button>
          <Button variant="outline" className="flex-1" disabled={gameOver.isOver}>
            <Handshake size={16} className="mr-2" /> DRAW
          </Button>
        </div>
      </div>

      {/* Main Board Area */}
      <div className="flex-1 flex flex-col order-1 lg:order-2 items-center">
        
        {/* Opponent Info */}
        <div className="w-full max-w-[600px] flex items-center justify-between bg-card border border-border/50 p-4 rounded-t-sm mb-1">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center">
              <User size={20} className="text-muted-foreground" />
            </div>
            <div>
              <div className="font-serif tracking-widest">{opponentName || "Unknown Warrior"}</div>
              <div className="font-mono text-xs text-muted-foreground">Elo: {opponentElo} • {opponentHouse}</div>
            </div>
          </div>
          <div className="font-mono text-xl tracking-widest opacity-50 text-secondary">
            10:00
          </div>
        </div>

        {/* The Board */}
        <div className="chess-board-grid shadow-2xl relative">
          {renderRanks.map((rank, rIdx) => 
            renderFiles.map((file, fIdx) => {
              const square = `${file}${rank}` as Square;
              const isDark = (rIdx + fIdx) % 2 !== 0;
              const piece = game.get(square);
              const isSelected = selectedSquare === square;
              const isValidMove = validMoves.includes(square);
              
              return (
                <div
                  key={square}
                  onClick={() => handleSquareClick(square)}
                  className={`
                    chess-square 
                    ${isDark ? 'dark' : 'light'}
                    ${isSelected ? 'highlight' : ''}
                    ${isValidMove ? 'valid-move' : ''}
                  `}
                >
                  {piece && (
                    <span 
                      className={`chess-piece ${piece.color === 'w' ? 'white' : 'black'}`}
                      style={{ 
                        textShadow: piece.color === 'w' ? '0 2px 4px rgba(0,0,0,0.5)' : 'none'
                      }}
                    >
                      {piece.color === 'w' ? PIECE_SYMBOLS[piece.type.toUpperCase()] : PIECE_SYMBOLS[piece.type.toLowerCase()]}
                    </span>
                  )}
                  
                  {/* Coordinates */}
                  {fIdx === 0 && <span className="absolute top-1 left-1 text-[10px] font-mono opacity-50">{rank}</span>}
                  {rIdx === 7 && <span className="absolute bottom-0 right-1 text-[10px] font-mono opacity-50">{file}</span>}
                </div>
              );
            })
          )}
        </div>

        {/* Player Info */}
        <div className="w-full max-w-[600px] flex items-center justify-between bg-card border border-border/50 p-4 rounded-b-sm mt-1">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-background border border-secondary flex items-center justify-center">
              <Shield size={20} className="text-secondary" />
            </div>
            <div>
              <div className="font-serif tracking-widest text-secondary">{localPlayer?.displayName}</div>
              <div className="font-mono text-xs text-muted-foreground">Elo: {localPlayer ? 1200 : '---'} • {localPlayer?.house}</div>
            </div>
          </div>
          <div className="font-mono text-xl tracking-widest text-secondary">
            10:00
          </div>
        </div>
      </div>

      {/* Game Over Modal */}
      <AnimatePresence>
        {gameOver.isOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-background/90`}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className={`max-w-lg w-full border border-border p-8 text-center rounded-sm relative overflow-hidden
                ${gameOver.winner === (isWhite ? 'white' : 'black') ? 'bg-[#14532d]/20 border-[#c9a84c]' : 
                  gameOver.winner === 'draw' ? 'bg-card border-border' : 'bg-[#8b0000]/20 border-[#8b0000]'}
              `}
            >
              <div className="relative z-10 flex flex-col items-center">
                <Trophy size={64} className={`mb-6 ${
                  gameOver.winner === (isWhite ? 'white' : 'black') ? 'text-[#c9a84c]' : 
                  gameOver.winner === 'draw' ? 'text-muted-foreground' : 'text-[#8b0000]'
                }`} />
                
                <h2 className="text-5xl font-display tracking-widest mb-2 text-foreground">
                  {gameOver.winner === (isWhite ? 'white' : 'black') ? 'VICTORY' : 
                   gameOver.winner === 'draw' ? 'DRAW' : 'DEFEAT'}
                </h2>
                
                <p className="font-serif text-muted-foreground tracking-wider mb-8 text-lg">
                  {gameOver.result}
                </p>

                <div className="flex gap-8 mb-8 justify-center">
                  <div className="text-center">
                    <div className={`font-mono text-2xl ${
                      gameOver.winner === (isWhite ? 'white' : 'black') ? 'text-[#c9a84c]' : 
                      gameOver.winner === 'draw' ? 'text-muted-foreground' : 'text-[#8b0000]'
                    }`}>
                      {gameOver.winner === (isWhite ? 'white' : 'black') ? '+25' : 
                       gameOver.winner === 'draw' ? '+0' : '-15'}
                    </div>
                    <div className="text-xs font-serif text-muted-foreground tracking-widest uppercase">Elo Rating</div>
                  </div>
                  {gameOver.winner === (isWhite ? 'white' : 'black') && (
                    <div className="text-center border-l border-border/50 pl-8">
                      <div className="font-mono text-2xl text-secondary">+50</div>
                      <div className="text-xs font-serif text-muted-foreground tracking-widest uppercase">ADWA Tokens</div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 w-full justify-center">
                  <Button variant="outline" onClick={() => setLocation("/dashboard")}>
                    RETURN TO CAMP
                  </Button>
                  <Button className="bg-secondary text-secondary-foreground" onClick={() => setLocation("/play")}>
                    PLAY AGAIN
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
