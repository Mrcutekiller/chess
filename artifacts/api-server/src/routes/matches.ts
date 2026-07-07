import { Router, type IRouter } from "express";
import { eq, desc, or, sql, and } from "drizzle-orm";
import { db, matchesTable, playersTable, badgesTable } from "@workspace/db";
import {
  CreateMatchBody,
  CreateMatchResponse,
  GetMatchParams,
  GetMatchResponse,
  GetMatchesQueryParams,
  GetMatchesResponse,
  CompleteMatchParams,
  CompleteMatchBody,
  CompleteMatchResponse,
} from "@workspace/api-zod";
import { createHash, randomUUID } from "crypto";
import { computeTitle } from "./players";

const router: IRouter = Router();

// Elo calculation
function computeEloDelta(
  winnerElo: number,
  loserElo: number,
  k = 32,
): { winnerDelta: number; loserDelta: number } {
  const expected = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const winnerDelta = Math.round(k * (1 - expected));
  const loserDelta = Math.round(k * (0 - (1 - expected)));
  return { winnerDelta, loserDelta };
}

// Badge definitions
const BADGE_DEFS = [
  {
    badgeId: "star_of_highlands",
    name: "Star of the Highlands",
    description: "Awarded for 10 ranked victories",
    historicalBasis: "Order of the Star of Ethiopia",
    tier: "bronze" as const,
    condition: (wins: number) => wins >= 10,
  },
  {
    badgeId: "meneliks_seal",
    name: "Menelik's Seal",
    description: "Awarded for 50 ranked victories",
    historicalBasis: "Order of Menelik II",
    tier: "gold" as const,
    condition: (wins: number) => wins >= 50,
  },
  {
    badgeId: "lions_vanguard",
    name: "Lion's Vanguard",
    description: "Reach the top 100 of the global leaderboard",
    historicalBasis: "Imperial Ethiopian standard",
    tier: "silver" as const,
    condition: (wins: number) => wins >= 25,
  },
];

router.get("/matches", async (req, res): Promise<void> => {
  const params = GetMatchesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: "invalid_params", message: params.error.message });
    return;
  }

  const limit = params.data.limit ?? 20;
  const offset = params.data.offset ?? 0;

  let query = db.select().from(matchesTable);

  if (params.data.address) {
    const addr = params.data.address;
    query = query.where(
      or(
        eq(matchesTable.whiteAddress, addr),
        eq(matchesTable.blackAddress, addr),
      ),
    ) as typeof query;
  }

  const matches = await query
    .orderBy(desc(matchesTable.startedAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(matchesTable);

  res.json(
    GetMatchesResponse.parse({
      matches,
      total: Number(countResult?.count ?? 0),
    }),
  );
});

router.post("/matches", async (req, res): Promise<void> => {
  const parsed = CreateMatchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", message: parsed.error.message });
    return;
  }

  const { whiteAddress, blackAddress, mode } = parsed.data;

  const [white] = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.walletAddress, whiteAddress));
  const [black] = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.walletAddress, blackAddress));

  if (!white || !black) {
    res.status(400).json({ error: "players_not_found", message: "One or both players not found" });
    return;
  }

  const id = randomUUID();
  const [match] = await db
    .insert(matchesTable)
    .values({
      id,
      mode,
      whiteAddress,
      blackAddress,
      whiteName: white.displayName,
      blackName: black.displayName,
      whiteHouse: white.house,
      blackHouse: black.house,
      whiteElo: white.eloRating,
      blackElo: black.eloRating,
      status: "in_progress",
      moves: [],
    })
    .returning();

  res.status(201).json(CreateMatchResponse.parse(match));
});

router.get("/matches/:matchId", async (req, res): Promise<void> => {
  const params = GetMatchParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "invalid_params", message: params.error.message });
    return;
  }

  const [match] = await db
    .select()
    .from(matchesTable)
    .where(eq(matchesTable.id, params.data.matchId));

  if (!match) {
    res.status(404).json({ error: "not_found", message: "Match not found" });
    return;
  }

  res.json(GetMatchResponse.parse(match));
});

router.post("/matches/:matchId/complete", async (req, res): Promise<void> => {
  const matchParams = CompleteMatchParams.safeParse(req.params);
  if (!matchParams.success) {
    res.status(400).json({ error: "invalid_params", message: matchParams.error.message });
    return;
  }

  const body = CompleteMatchBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "invalid_body", message: body.error.message });
    return;
  }

  const [match] = await db
    .select()
    .from(matchesTable)
    .where(eq(matchesTable.id, matchParams.data.matchId));

  if (!match) {
    res.status(404).json({ error: "not_found", message: "Match not found" });
    return;
  }

  const { outcome, moves, pgn } = body.data;

  // Compute result hash
  const moveListHash = createHash("sha256")
    .update(JSON.stringify(moves))
    .digest("hex");
  const resultHash = createHash("sha256")
    .update(
      `${match.id}${match.whiteAddress}${match.blackAddress}${outcome ?? "draw"}${moveListHash}${Date.now()}`,
    )
    .digest("hex");

  // Determine winner/loser and compute elo deltas
  let whiteEloDelta = 0;
  let blackEloDelta = 0;
  let tokensAwarded = 10; // participation tokens

  if (outcome === "white_wins") {
    const deltas = computeEloDelta(match.whiteElo, match.blackElo);
    whiteEloDelta = deltas.winnerDelta;
    blackEloDelta = deltas.loserDelta;
    tokensAwarded = 50;
  } else if (outcome === "black_wins") {
    const deltas = computeEloDelta(match.blackElo, match.whiteElo);
    blackEloDelta = deltas.winnerDelta;
    whiteEloDelta = deltas.loserDelta;
    tokensAwarded = 50;
  } else if (outcome === "draw") {
    whiteEloDelta = 5;
    blackEloDelta = 5;
    tokensAwarded = 20;
  }

  // Update match record
  await db
    .update(matchesTable)
    .set({
      status: "completed",
      outcome,
      moves: moves as unknown[],
      pgn,
      resultHash,
      endedAt: new Date(),
    })
    .where(eq(matchesTable.id, match.id));

  // Update white player stats
  const [whitePlayer] = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.walletAddress, match.whiteAddress));
  if (whitePlayer) {
    const newWhiteElo = whitePlayer.eloRating + whiteEloDelta;
    const whiteWins =
      outcome === "white_wins" ? whitePlayer.wins + 1 : whitePlayer.wins;
    const whiteLosses =
      outcome === "black_wins" ? whitePlayer.losses + 1 : whitePlayer.losses;
    const whiteDraws =
      outcome === "draw" ? whitePlayer.draws + 1 : whitePlayer.draws;
    const whiteAP =
      outcome === "white_wins"
        ? whitePlayer.activityPoints + 10
        : whitePlayer.activityPoints + 3;
    const whiteTitle = computeTitle(whiteAP, newWhiteElo);
    await db
      .update(playersTable)
      .set({
        eloRating: newWhiteElo,
        wins: whiteWins,
        losses: whiteLosses,
        draws: whiteDraws,
        activityPoints: whiteAP,
        adwaTokens:
          outcome === "white_wins"
            ? whitePlayer.adwaTokens + tokensAwarded
            : whitePlayer.adwaTokens + 10,
        title: whiteTitle,
      })
      .where(eq(playersTable.walletAddress, match.whiteAddress));
  }

  // Update black player stats
  const [blackPlayer] = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.walletAddress, match.blackAddress));
  if (blackPlayer) {
    const newBlackElo = blackPlayer.eloRating + blackEloDelta;
    const blackWins =
      outcome === "black_wins" ? blackPlayer.wins + 1 : blackPlayer.wins;
    const blackLosses =
      outcome === "white_wins" ? blackPlayer.losses + 1 : blackPlayer.losses;
    const blackDraws =
      outcome === "draw" ? blackPlayer.draws + 1 : blackPlayer.draws;
    const blackAP =
      outcome === "black_wins"
        ? blackPlayer.activityPoints + 10
        : blackPlayer.activityPoints + 3;
    const blackTitle = computeTitle(blackAP, newBlackElo);
    await db
      .update(playersTable)
      .set({
        eloRating: newBlackElo,
        wins: blackWins,
        losses: blackLosses,
        draws: blackDraws,
        activityPoints: blackAP,
        adwaTokens:
          outcome === "black_wins"
            ? blackPlayer.adwaTokens + tokensAwarded
            : blackPlayer.adwaTokens + 10,
        title: blackTitle,
      })
      .where(eq(playersTable.walletAddress, match.blackAddress));
  }

  // Check and award badges
  const newBadges: Array<{
    id: string;
    badgeId: string;
    name: string;
    description: string;
    historicalBasis: string;
    tier: "bronze" | "silver" | "gold" | "imperial";
    issuedAt: Date;
  }> = [];
  const winnerAddress =
    outcome === "white_wins"
      ? match.whiteAddress
      : outcome === "black_wins"
        ? match.blackAddress
        : null;

  if (winnerAddress) {
    const [winner] = await db
      .select()
      .from(playersTable)
      .where(eq(playersTable.walletAddress, winnerAddress));
    if (winner) {
      for (const badge of BADGE_DEFS) {
        if (badge.condition(winner.wins)) {
          const existingBadge = await db
            .select()
            .from(badgesTable)
            .where(and(eq(badgesTable.badgeId, badge.badgeId), eq(badgesTable.playerId, winner.id)));
          if (existingBadge.length === 0) {
            const badgeId = randomUUID();
            const [newBadge] = await db
              .insert(badgesTable)
              .values({
                id: badgeId,
                badgeId: badge.badgeId,
                playerId: winner.id,
                name: badge.name,
                description: badge.description,
                historicalBasis: badge.historicalBasis,
                tier: badge.tier,
              })
              .returning();
            newBadges.push(newBadge);
          }
        }
      }
    }
  }

  res.json(
    CompleteMatchResponse.parse({
      matchId: match.id,
      outcome,
      resultHash,
      whiteEloDelta,
      blackEloDelta,
      tokensAwarded,
      newBadges: newBadges.map((b) => ({
        id: b.id,
        badgeId: b.badgeId,
        name: b.name,
        description: b.description,
        historicalBasis: b.historicalBasis,
        tier: b.tier,
        issuedAt: b.issuedAt,
      })),
    }),
  );
});

export default router;
