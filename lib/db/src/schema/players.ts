import { pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const houseEnum = pgEnum("house", [
  "shewa",
  "tigray",
  "gojjam",
  "wollo",
  "harar",
]);

export const titleEnum = pgEnum("player_title", [
  "ato",
  "grazmach",
  "fitawrari",
  "dejazmach",
  "ras",
  "negus",
  "negus_negast",
]);

export const playersTable = pgTable("players", {
  id: text("id").primaryKey(),
  walletAddress: text("wallet_address").notNull().unique(),
  displayName: text("display_name").notNull(),
  house: houseEnum("house").notNull(),
  title: titleEnum("title").notNull().default("ato"),
  eloRating: integer("elo_rating").notNull().default(1200),
  activityPoints: integer("activity_points").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  draws: integer("draws").notNull().default(0),
  adwaTokens: integer("adwa_tokens").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPlayerSchema = createInsertSchema(playersTable).omit({
  createdAt: true,
});
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof playersTable.$inferSelect;
