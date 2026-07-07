import { useParams } from "wouter";
import { useGetPlayer, useGetPlayerBadges, useGetMatches, getGetPlayerQueryKey, getGetPlayerBadgesQueryKey, getGetMatchesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Hexagon, Calendar, History } from "lucide-react";
import { format } from "date-fns";

export default function Profile() {
  const { address } = useParams();
  
  const addr = address ?? '';
  const profileMatchParams = { address: addr };
  const { data: player, isLoading } = useGetPlayer(addr, { query: { enabled: !!address, queryKey: getGetPlayerQueryKey(addr) } });
  const { data: badgesData } = useGetPlayerBadges(addr, { query: { enabled: !!address, queryKey: getGetPlayerBadgesQueryKey(addr) } });
  const { data: matchesData } = useGetMatches(profileMatchParams, { query: { enabled: !!address, queryKey: getGetMatchesQueryKey(profileMatchParams) } });

  if (isLoading || !player) {
    return <div className="flex-1 flex items-center justify-center animate-pulse">Loading Records...</div>;
  }

  const winRate = player.wins + player.losses > 0 
    ? Math.round((player.wins / (player.wins + player.losses)) * 100) 
    : 0;

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl space-y-12">
      
      {/* Hero Header */}
      <div className="relative p-12 border border-border bg-card overflow-hidden flex flex-col items-center text-center rounded-sm">
        <div className={`absolute inset-0 opacity-10 bg-gradient-to-b
          ${player.house === 'shewa' ? 'from-[#c9a84c]' : ''}
          ${player.house === 'tigray' ? 'from-[#8b0000]' : ''}
          ${player.house === 'gojjam' ? 'from-[#1a4a2e]' : ''}
          ${player.house === 'wollo' ? 'from-[#b87333]' : ''}
          ${player.house === 'harar' ? 'from-[#1e3a5f]' : ''}
        `} />
        
        <div className="relative z-10 w-24 h-24 rounded-full border border-secondary flex items-center justify-center bg-background mb-6">
          <Hexagon size={48} className="text-secondary" />
        </div>
        
        <h1 className="text-5xl font-display tracking-widest text-foreground mb-2">{player.displayName}</h1>
        <div className="font-serif uppercase tracking-widest text-secondary text-lg mb-6">
          {player.title.replace('_', ' ')} • House of {player.house}
        </div>
        
        <div className="flex gap-4 items-center justify-center font-mono text-sm text-muted-foreground bg-background/50 px-4 py-2 border border-border/50">
          <span>{player.walletAddress}</span>
          <span>•</span>
          <span className="flex items-center gap-2"><Calendar size={14} /> Joined {format(new Date(player.createdAt), "MMM yyyy")}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card/50">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <Trophy className="text-secondary mb-4" size={32} />
            <div className="text-4xl font-mono text-foreground mb-1">{player.eloRating}</div>
            <p className="text-sm font-serif text-muted-foreground tracking-widest uppercase">Elo Rating</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <History className="text-primary mb-4" size={32} />
            <div className="text-4xl font-mono text-foreground mb-1">{player.wins + player.losses + player.draws}</div>
            <p className="text-sm font-serif text-muted-foreground tracking-widest uppercase">Battles</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <Medal className="text-accent mb-4" size={32} />
            <div className="text-4xl font-mono text-foreground mb-1">{winRate}%</div>
            <p className="text-sm font-serif text-muted-foreground tracking-widest uppercase">Win Rate</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <Hexagon className="text-secondary mb-4" size={32} />
            <div className="text-4xl font-mono text-foreground mb-1">{player.adwaTokens}</div>
            <p className="text-sm font-serif text-muted-foreground tracking-widest uppercase">Tokens</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-display tracking-widest text-secondary border-b border-border/50 pb-4">HONORS & DECORATIONS</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {!badgesData?.badges || badgesData.badges.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground font-serif tracking-widest uppercase border border-dashed border-border/50">
              No honors awarded yet
            </div>
          ) : (
            badgesData.badges.map(badge => (
              <div key={badge.id} className="flex gap-4 p-4 border border-border/50 bg-card">
                <div className={`w-16 h-16 shrink-0 flex items-center justify-center border rounded-sm
                  ${badge.tier === 'imperial' ? 'border-purple-500 text-purple-500 bg-purple-500/10' : ''}
                  ${badge.tier === 'gold' ? 'border-[#c9a84c] text-[#c9a84c] bg-[#c9a84c]/10' : ''}
                  ${badge.tier === 'silver' ? 'border-gray-400 text-gray-400 bg-gray-400/10' : ''}
                  ${badge.tier === 'bronze' ? 'border-[#b87333] text-[#b87333] bg-[#b87333]/10' : ''}
                `}>
                  <Medal size={32} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-foreground mb-1 leading-tight">{badge.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{badge.description}</p>
                  <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest">{badge.historicalBasis}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
