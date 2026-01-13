import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { startBot } from "./bot";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // API Routes
  app.get(api.warnings.list.path, async (req, res) => {
    const warnings = await storage.getWarnings();
    res.json(warnings);
  });

  // Bot Blacklist Routes
  app.get("/api/blacklist/bot", async (_req, res) => {
    const list = await storage.getBotBlacklist();
    res.json(list);
  });

  app.post("/api/blacklist/bot", async (req, res) => {
    const { userId, reason } = req.body;
    if (!userId || !reason) return res.status(400).send("Missing userId or reason");
    await storage.addToBotBlacklist(userId, reason);
    res.json({ success: true });
  });

  app.delete("/api/blacklist/bot/:userId", async (req, res) => {
    const { userId } = req.params;
    await storage.removeFromBotBlacklist(userId);
    res.json({ success: true });
  });

  app.get(api.stats.get.path, async (req, res) => {
    const stats = await storage.getStats();
    // Simple check if bot process is running (in a real app we'd check the client status)
    const botStatus = process.env.DISCORD_TOKEN ? "online" : "offline";
    res.json({ ...stats, botStatus });
  });

  // Start the Discord Bot
  if (process.env.DISCORD_TOKEN) {
    try {
      await startBot();
      console.log("Discord bot started successfully.");
    } catch (error) {
      console.error("Failed to start Discord bot:", error);
    }
  } else {
    console.warn("DISCORD_TOKEN not found. Bot will not start.");
  }

  return httpServer;
}
