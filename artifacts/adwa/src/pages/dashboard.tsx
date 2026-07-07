import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { usePlayer } from "@/hooks/use-player";
import { useGetMatches, useGetStatsSummary, getGetMatchesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sword, History, Shield, Trophy, Activity, Hexagon } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const [location, setLocation] = useLocation();
  const { player, localPlayer, isLoading } = usePlayer();
  const matchParams = { address: localPlayer?.walletAddress };
  const { data: matchesData } = useGetMatches(
    matchParams,
    { query: { enabled: !!localPlayer?.walletAddress, queryKey: getGetMatchesQueryKey(matchParams) } }
  );
  const { data: stats } = useGetStatsSummary();

  useEffect(() => {
    if (!isLoading && !localPlayer) {
      setLocation("/");
    }
  }, [localPlayer, isLoading, setLocation]);

  if (isLoading || !localPlayer) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Use local fallback if server hasn't created profile yet
  const displayPlayer = player || {
    ...localPlayer,
    title: "ato",
    eloRating: 1200,
    adwaTokens: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    activityPoints: 0
  };

  const winRate = displayPlayer.wins + displayPlayer.losses > 0 
    ? Math.round((displayPlayer.wins / (displayPlayer.wins + displayPlayer.losses)) * 100) 
    : 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between border border-border/50 bg-card/30 p-8 rounded-sm">
        <div className="flex items-center gap-6">
          <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center bg-background
            ${displayPlayer.house === 'shewa' ? 'border-[#c9a84c] text-[#c9a84c]' : ''}
            ${displayPlayer.house === 'tigray' ? 'border-[#8b0000] text-[#8b0000]' : ''}
            ${displayPlayer.house === 'gojjam' ? 'border-[#1a4a2e] text-[#1a4a2e]' : ''}
            ${displayPlayer.house === 'wollo' ? 'border-[#b87333] text-[#b87333]' : ''}
            ${displayPlayer.house === 'harar' ? 'border-[#1e3a5f] text-[#1e3a5f]' : ''}
          `}>
            <Hexagon size={40} />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-display tracking-widest">{displayPlayer.displayName}</h1>
              <span className="px-2 py-0.5 border border-secondary text-secondary text-xs font-mono uppercase rounded-sm">
                {displayPlayer.title.replace('_', ' ')}
              </span>
            </div>
            <p className="text-muted-foreground font-serif tracking-widest uppercase text-sm">
              House of {displayPlayer.house}
            </p>
            <div className="font-mono text-xs text-muted-foreground mt-2 opacity-50">
              {displayPlayer.walletAddress}
            </div>
          </div>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <Button asChild size="lg" className="w-full md:w-auto">
            <Link href="/play" className="flex items-center gap-2">
              <Sword size={18} /> PLAY NOW
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
              <Shield size={18} /> RATING
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-mono text-foreground mb-2">{displayPlayer.eloRating}</div>
            <p className="text-sm font-serif text-muted-foreground tracking-widest uppercase">Elo Score</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
              <Trophy size={18} /> RECORD
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-mono text-foreground mb-2 flex items-baseline gap-2">
              <span className="text-secondary">{displayPlayer.wins}</span>
              <span className="text-2xl text-muted-foreground">-</span>
              <span className="text-destructive">{displayPlayer.losses}</span>
              <span className="text-2xl text-muted-foreground">-</span>
              <span className="text-muted-foreground">{displayPlayer.draws}</span>
            </div>
            <p className="text-sm font-serif text-muted-foreground tracking-widest uppercase">
              {winRate}% Win Rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-secondary/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Hexagon size={100} className="text-secondary" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-secondary">
              <Activity size={18} /> TREASURY
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-mono text-secondary mb-2">{displayPlayer.adwaTokens}</div>
            <p className="text-sm font-serif text-secondary/70 tracking-widest uppercase">ADWA Tokens</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-display tracking-widest text-secondary border-b border-border/50 pb-4">RECENT BATTLES</h2>
          
          <div className="space-y-4">
            {!matchesData?.matches || matchesData.matches.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border/50 rounded-sm">
                <History size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="font-serif text-muted-foreground tracking-widest uppercase">No battles fought yet</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/play">ENTER MATCHMAKING</Link>
                </Button>
              </div>
            ) : (
              matchesData.matches.map(match => {
                const isWhite = match.whiteAddress === displayPlayer.walletAddress;
                const opponentName = isWhite ? match.blackName : match.whiteName;
                const opponentElo = isWhite ? match.blackElo : match.whiteElo;
                const isWin = (isWhite && match.outcome === 'white_wins') || (!isWhite && match.outcome === 'black_wins');
                const isDraw = match.outcome === 'draw';
                
                return (
                  <Link key={match.id} href={`/replay/${match.id}`}>
                    <div className="flex items-center justify-between p-4 border border-border/50 hover:bg-white/5 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-12 rounded-full ${isWin ? 'bg-secondary' : isDraw ? 'bg-muted-foreground' : 'bg-destructive'}`} />
                        <div>
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-serif font-bold text-lg">{opponentName}</span>
                            <span className="font-mono text-xs text-muted-foreground">({opponentElo})</span>
                          </div>
                          <div className="font-mono text-xs text-muted-foreground">
                            {format(new Date(match.startedAt), "MMM d, yyyy • HH:mm")}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-serif tracking-widest mb-1 ${isWin ? 'text-secondary' : isDraw ? 'text-muted-foreground' : 'text-destructive'}`}>
                          {isWin ? 'VICTORY' : isDraw ? 'DRAW' : 'DEFEAT'}
                        </div>
                        <div className="font-mono text-sm text-muted-foreground uppercase">
                          {match.mode} • {match.moves.length} Moves
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-display tracking-widest text-secondary border-b border-border/50 pb-4">WAR EFFORT</h2>
          <Card className="bg-card/50">
            <CardContent className="pt-6 space-y-6">
              <div>
                <div className="flex justify-between font-mono text-sm mb-2">
                  <span className="text-muted-foreground">Global Campaigns</span>
                  <span className="text-primary">{stats?.totalMatches || 0}</span>
                </div>
                <div className="w-full h-1 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[75%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between font-mono text-sm mb-2">
                  <span className="text-muted-foreground">Active Fronts</span>
                  <span className="text-accent">{stats?.activeGames || 0}</span>
                </div>
                <div className="w-full h-1 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-accent w-[30%] animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
