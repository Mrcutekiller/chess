import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const badgeTierEnum = pgEnum("badge_tier", [
  "bronze",
  "silver",
  "gold",
  "imperial",
]);

export const badgesTable = pgTable("badges", {
  id: text("id").primaryKey(),
  badgeId: text("badge_id").notNull(),
  playerId: text("player_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  historicalBasis: text("historical_basis").notNull(),
  tier: badgeTierEnum("tier").notNull(),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
});

export const insertBadgeSchema = createInsertSchema(badgesTable).omit({
  issuedAt: true,
});
export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type Badge = typeof badgesTable.$inferSelect;
