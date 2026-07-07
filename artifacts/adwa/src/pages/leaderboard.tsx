import { useState } from "react";
import { Link } from "wouter";
import { useGetLeaderboard, useGetHouseLeaderboard, getGetLeaderboardQueryKey, getGetHouseLeaderboardQueryKey } from "@workspace/api-client-react";
import { Trophy, Users, Shield, Hexagon } from "lucide-react";

export default function Leaderboard() {
  const [view, setView] = useState<'global' | 'houses'>('global');
  
  const leaderboardParams = { limit: 50 };
  const { data: globalData, isLoading: isLoadingGlobal } = useGetLeaderboard(
    leaderboardParams,
    { query: { enabled: view === 'global', queryKey: getGetLeaderboardQueryKey(leaderboardParams) } }
  );
  
  const { data: houseData, isLoading: isLoadingHouses } = useGetHouseLeaderboard(
    { query: { enabled: view === 'houses', queryKey: getGetHouseLeaderboardQueryKey() } }
  );

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-display text-secondary tracking-widest">THE HALL OF GLORY</h1>
        <p className="text-muted-foreground font-serif tracking-wider">Honor belongs to those who take it.</p>
      </div>

      <div className="flex justify-center mb-12">
        <div className="inline-flex border border-border p-1 bg-card rounded-sm">
          <button
            className={`px-8 py-3 font-serif tracking-widest text-sm transition-colors rounded-sm ${view === 'global' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setView('global')}
          >
            GLOBAL STANDINGS
          </button>
          <button
            className={`px-8 py-3 font-serif tracking-widest text-sm transition-colors rounded-sm ${view === 'houses' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setView('houses')}
          >
            HOUSE WARS
          </button>
        </div>
      </div>

      {view === 'global' && (
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 font-serif tracking-widest text-sm text-muted-foreground uppercase border-b border-border/50">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-5">Warrior</div>
            <div className="col-span-2 text-center">House</div>
            <div className="col-span-2 text-center">Win Rate</div>
            <div className="col-span-2 text-right">Rating</div>
          </div>

          {isLoadingGlobal ? (
            <div className="text-center py-12 text-muted-foreground animate-pulse">Consulting the chroniclers...</div>
          ) : (
            globalData?.entries?.map((entry, idx) => (
              <Link key={entry.player.id} href={`/profile/${entry.player.walletAddress}`}>
                <div className={`grid grid-cols-12 gap-4 items-center px-6 py-4 rounded-sm border transition-colors cursor-pointer group
                  ${idx === 0 ? 'bg-secondary/10 border-secondary/50' : 
                    idx === 1 ? 'bg-zinc-300/10 border-zinc-400/50' :
                    idx === 2 ? 'bg-orange-800/10 border-orange-700/50' :
                    'bg-card border-border/50 hover:bg-white/5'}
                `}>
                  <div className="col-span-1 text-center font-mono text-lg">
                    {idx === 0 ? <Trophy className="mx-auto text-secondary" size={20} /> : entry.rank}
                  </div>
                  <div className="col-span-5 flex items-center gap-3">
                    <div>
                      <div className="font-serif text-lg tracking-wide group-hover:text-secondary transition-colors">
                        {entry.player.displayName}
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground uppercase">
                        {entry.player.title.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className={`text-xs font-serif uppercase tracking-widest px-2 py-1 border rounded-sm
                      ${entry.player.house === 'shewa' ? 'text-[#c9a84c] border-[#c9a84c]/30' : ''}
                      ${entry.player.house === 'tigray' ? 'text-[#8b0000] border-[#8b0000]/30' : ''}
                      ${entry.player.house === 'gojjam' ? 'text-[#1a4a2e] border-[#1a4a2e]/30' : ''}
                      ${entry.player.house === 'wollo' ? 'text-[#b87333] border-[#b87333]/30' : ''}
                      ${entry.player.house === 'harar' ? 'text-[#1e3a5f] border-[#1e3a5f]/30' : ''}
                    `}>
                      {entry.player.house}
                    </span>
                  </div>
                  <div className="col-span-2 text-center font-mono text-muted-foreground">
                    {Math.round(entry.winRate * 100)}%
                  </div>
                  <div className={`col-span-2 text-right font-mono text-xl ${idx < 3 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {entry.player.eloRating}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {view === 'houses' && (
        <div className="grid grid-cols-1 gap-6">
          {isLoadingHouses ? (
            <div className="text-center py-12 text-muted-foreground animate-pulse">Tallying the war efforts...</div>
          ) : (
            houseData?.standings?.map((standing, idx) => (
              <div key={standing.house} className={`flex flex-col md:flex-row gap-6 items-center p-8 rounded-sm border relative overflow-hidden
                ${idx === 0 ? 'border-secondary bg-secondary/5' : 'border-border bg-card'}
              `}>
                <div className={`absolute top-0 right-0 p-8 opacity-10
                  ${standing.house === 'shewa' ? 'text-[#c9a84c]' : ''}
                  ${standing.house === 'tigray' ? 'text-[#8b0000]' : ''}
                  ${standing.house === 'gojjam' ? 'text-[#1a4a2e]' : ''}
                  ${standing.house === 'wollo' ? 'text-[#b87333]' : ''}
                  ${standing.house === 'harar' ? 'text-[#1e3a5f]' : ''}
                `}>
                  <Hexagon size={160} />
                </div>
                
                <div className="flex-1 z-10 flex flex-col items-center md:items-start text-center md:text-left">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="font-mono text-3xl opacity-50">#{standing.rank}</span>
                    <h2 className="text-3xl font-display tracking-widest text-foreground">{standing.houseName}</h2>
                  </div>
                  <p className="font-serif text-muted-foreground uppercase tracking-widest text-sm mb-6">
                    House of {standing.house}
                  </p>
                  
                  <div className="flex gap-8">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-muted-foreground" />
                      <span className="font-mono">{standing.playerCount}</span>
                      <span className="text-xs font-serif uppercase tracking-widest text-muted-foreground">Warriors</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield size={16} className="text-muted-foreground" />
                      <span className="font-mono">{Math.round(standing.averageElo)}</span>
                      <span className="text-xs font-serif uppercase tracking-widest text-muted-foreground">Avg Elo</span>
                    </div>
                  </div>
                </div>
                
                <div className="z-10 flex flex-col items-center justify-center p-6 border border-border/50 bg-background/50 rounded-sm min-w-[200px]">
                  <span className="text-5xl font-mono text-secondary mb-2">{standing.totalWins}</span>
                  <span className="text-sm font-serif tracking-widest uppercase text-muted-foreground">Total Victories</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
