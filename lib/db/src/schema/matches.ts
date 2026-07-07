import {
  pgTable,
  text,
  integer,
  timestamp,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const matchModeEnum = pgEnum("match_mode", [
  "blitz",
  "rapid",
  "classical",
  "casual",
]);

export const matchStatusEnum = pgEnum("match_status", [
  "waiting",
  "in_progress",
  "completed",
  "archived",
]);

export const matchOutcomeEnum = pgEnum("match_outcome", [
  "white_wins",
  "black_wins",
  "draw",
  "abandoned",
]);

export const matchesTable = pgTable("matches", {
  id: text("id").primaryKey(),
  mode: matchModeEnum("mode").notNull(),
  status: matchStatusEnum("status").notNull().default("in_progress"),
  whiteAddress: text("white_address").notNull(),
  blackAddress: text("black_address").notNull(),
  whiteName: text("white_name").notNull(),
  blackName: text("black_name").notNull(),
  whiteHouse: text("white_house").notNull(),
  blackHouse: text("black_house").notNull(),
  whiteElo: integer("white_elo").notNull(),
  blackElo: integer("black_elo").notNull(),
  outcome: matchOutcomeEnum("outcome"),
  moves: jsonb("moves").notNull().default([]),
  resultHash: text("result_hash"),
  pgn: text("pgn"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
});

export const insertMatchSchema = createInsertSchema(matchesTable).omit({
  startedAt: true,
});
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matchesTable.$inferSelect;
