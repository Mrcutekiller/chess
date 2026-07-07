import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, playersTable, matchesTable, badgesTable } from "@workspace/db";
import {
  CreatePlayerBody,
  GetPlayerParams,
  GetPlayerResponse,
  CreatePlayerResponse,
  GetStatsSummaryResponse,
} from "@workspace/api-zod";
import { randomUUID } from "crypto";

const router: IRouter = Router();

// Compute title from activity points
function computeTitle(
  activityPoints: number,
  eloRating: number,
): "ato" | "grazmach" | "fitawrari" | "dejazmach" | "ras" | "negus" | "negus_negast" {
  if (eloRating >= 2400 || activityPoints >= 500) return "negus_negast";
  if (eloRating >= 2200 || activityPoints >= 300) return "negus";
  if (eloRating >= 2000 || activityPoints >= 150) return "ras";
  if (eloRating >= 1800 || activityPoints >= 75) return "dejazmach";
  if (eloRating >= 1600 || activityPoints >= 35) return "fitawrari";
  if (eloRating >= 1400 || activityPoints >= 10) return "grazmach";
  return "ato";
}

router.get("/players/:address", async (req, res): Promise<void> => {
  const params = GetPlayerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "invalid_params", message: params.error.message });
    return;
  }

  const [player] = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.walletAddress, params.data.address));

  if (!player) {
    res.status(404).json({ error: "not_found", message: "Player not found" });
    return;
  }

  res.json(GetPlayerResponse.parse(player));
});

router.post("/players", async (req, res): Promise<void> => {
  const parsed = CreatePlayerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", message: parsed.error.message });
    return;
  }

  const { walletAddress, displayName, house } = parsed.data;

  // Upsert player
  const existing = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.walletAddress, walletAddress));

  if (existing.length > 0) {
    const [updated] = await db
      .update(playersTable)
      .set({ displayName, house })
      .where(eq(playersTable.walletAddress, walletAddress))
      .returning();
    res.json(CreatePlayerResponse.parse(updated));
    return;
  }

  const id = randomUUID();
  const [player] = await db
    .insert(playersTable)
    .values({ id, walletAddress, displayName, house })
    .returning();

  res.status(201).json(CreatePlayerResponse.parse(player));
});

router.get("/stats/summary", async (_req, res): Promise<void> => {
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(playersTable);
  const totalPlayers = Number(countResult?.count ?? 0);

  const [matchCountResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(matchesTable);
  const totalMatches = Number(matchCountResult?.count ?? 0);

  const [activCountResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(matchesTable)
    .where(eq(matchesTable.status, "in_progress"));
  const activeGames = Number(activCountResult?.count ?? 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [todayCountResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(matchesTable)
    .where(sql`${matchesTable.startedAt} >= ${today}`);
  const matchesToday = Number(todayCountResult?.count ?? 0);

  const [topPlayer] = await db
    .select()
    .from(playersTable)
    .orderBy(desc(playersTable.eloRating))
    .limit(1);

  const response: Record<string, unknown> = {
    totalPlayers,
    totalMatches,
    activeGames,
    matchesToday,
  };
  if (topPlayer) response.topPlayer = topPlayer;

  res.json(GetStatsSummaryResponse.parse(response));
});

export default router;
export { computeTitle };
