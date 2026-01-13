import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Warnings table to store user warnings
export const warnings = pgTable("warnings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  moderatorId: text("moderator_id").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Panels table to store ticket panel configurations
export const panels = pgTable("panels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  buttonName: text("button_name"),
  buttonEmoji: text("button_emoji"),
  welcomeMessage: text("welcome_message"),
  supportRoles: text("support_roles").array(), // Array of role IDs
  categoryId: text("category_id"),
  imageUrl: text("image_url"),
  ticketWelcomeImageUrl: text("ticket_welcome_image_url"),
});

// Tickets table for management
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  channelId: text("channel_id").notNull().unique(),
  creatorId: text("creator_id").notNull(),
  claimedBy: text("claimed_by"),
  panelId: integer("panel_id").references(() => panels.id),
  pointsAwarded: boolean("points_awarded").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Support points table
export const supportPoints = pgTable("support_points", {
  userId: text("user_id").primaryKey(),
  points: integer("points").notNull().default(0),
});

// Athkar settings table
export const athkarSettings = pgTable("athkar_settings", {
  id: serial("id").primaryKey(),
  channelId: text("channel_id").notNull(),
  guildId: text("guild_id").notNull(),
  isEnabled: boolean("is_enabled").default(true),
});

// Bot Blacklist table to block users from using the bot
export const botBlacklist = pgTable("bot_blacklist", {
  userId: text("user_id").primaryKey(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBotBlacklistSchema = createInsertSchema(botBlacklist).omit({ createdAt: true });
export type BotBlacklist = typeof botBlacklist.$inferSelect;
export type InsertBotBlacklist = z.infer<typeof insertBotBlacklistSchema>;

export const insertWarningSchema = createInsertSchema(warnings).omit({ id: true, createdAt: true });
export const insertPanelSchema = createInsertSchema(panels).omit({ id: true });
export const insertTicketSchema = createInsertSchema(tickets).omit({ id: true, createdAt: true });
export const insertSupportPointsSchema = createInsertSchema(supportPoints);

export type Warning = typeof warnings.$inferSelect;
export type InsertWarning = z.infer<typeof insertWarningSchema>;
export type Panel = typeof panels.$inferSelect;
export type InsertPanel = z.infer<typeof insertPanelSchema>;
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type SupportPoints = typeof supportPoints.$inferSelect;
