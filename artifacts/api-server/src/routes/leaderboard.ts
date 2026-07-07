import { Router, type IRouter } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db, playersTable, matchesTable } from "@workspace/db";
import {
  GetLeaderboardQueryParams,
  GetLeaderboardResponse,
  GetHouseLeaderboardResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const HOUSE_NAMES: Record<string, string> = {
  shewa: "House of Shewa",
  tigray: "House of Tigray",
  gojjam: "House of Gojjam",
  wollo: "House of Wollo",
  harar: "House of Harar",
};

router.get("/leaderboard", async (req, res): Promise<void> => {
  const params = GetLeaderboardQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: "invalid_params", message: params.error.message });
    return;
  }

  const limit = params.data.limit ?? 50;
  const offset = params.data.offset ?? 0;

  const players = await db
    .select()
    .from(playersTable)
    .orderBy(desc(playersTable.eloRating))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(playersTable);

  const entries = players.map((player, idx) => {
    const total = player.wins + player.losses + player.draws;
    const winRate = total > 0 ? player.wins / total : 0;
    return { rank: offset + idx + 1, player, winRate };
  });

  res.json(
    GetLeaderboardResponse.parse({
      entries,
      total: Number(countResult?.count ?? 0),
    }),
  );
});

router.get("/leaderboard/houses", async (_req, res): Promise<void> => {
  const houses = ["shewa", "tigray", "gojjam", "wollo", "harar"];

  const standings = await Promise.all(
    houses.map(async (house) => {
      const players = await db
        .select()
        .from(playersTable)
        .where(eq(playersTable.house, house as "shewa" | "tigray" | "gojjam" | "wollo" | "harar"));

      const playerCount = players.length;
      const totalWins = players.reduce((sum, p) => sum + p.wins, 0);
      const totalMatches = players.reduce(
        (sum, p) => sum + p.wins + p.losses + p.draws,
        0,
      );
      const averageElo =
        playerCount > 0
          ? Math.round(
              players.reduce((sum, p) => sum + p.eloRating, 0) / playerCount,
            )
          : 1200;

      return {
        house: house as "shewa" | "tigray" | "gojjam" | "wollo" | "harar",
        houseName: HOUSE_NAMES[house] ?? house,
        totalWins,
        totalMatches,
        averageElo,
        playerCount,
        rank: 0, // computed after sorting
      };
    }),
  );

  standings.sort((a, b) => b.totalWins - a.totalWins || b.averageElo - a.averageElo);
  standings.forEach((s, i) => {
    s.rank = i + 1;
  });

  res.json(GetHouseLeaderboardResponse.parse({ standings }));
});

export default router;
