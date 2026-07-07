import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, badgesTable, playersTable } from "@workspace/db";
import {
  GetPlayerBadgesParams,
  GetPlayerBadgesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/badges/:address", async (req, res): Promise<void> => {
  const params = GetPlayerBadgesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "invalid_params", message: params.error.message });
    return;
  }

  // Look up player by address
  const [player] = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.walletAddress, params.data.address));

  if (!player) {
    res.json(GetPlayerBadgesResponse.parse({ badges: [], total: 0 }));
    return;
  }

  const badges = await db
    .select()
    .from(badgesTable)
    .where(eq(badgesTable.playerId, player.id));

  res.json(
    GetPlayerBadgesResponse.parse({
      badges: badges.map((b) => ({
        id: b.id,
        badgeId: b.badgeId,
        name: b.name,
        description: b.description,
        historicalBasis: b.historicalBasis,
        tier: b.tier,
        issuedAt: b.issuedAt,
      })),
      total: badges.length,
    }),
  );
});

export default router;
