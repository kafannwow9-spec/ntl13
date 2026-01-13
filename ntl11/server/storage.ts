import fs from "fs";
import path from "path";
import { 
  type InsertWarning, 
  type InsertPanel, 
  type Warning, 
  type Panel, 
  type Ticket, 
  type InsertTicket, 
  type SupportPoints,
  type BotBlacklist
} from "@shared/schema";

export interface IStorage {
  // Warnings
  createWarning(warning: InsertWarning): Promise<Warning>;
  getWarnings(userId?: string): Promise<Warning[]>;
  deleteWarning(id: number): Promise<void>;
  
  // Panels
  createPanel(panel: InsertPanel): Promise<Panel>;
  getPanel(id: number): Promise<Panel | undefined>;
  getPanels(): Promise<Panel[]>;

  // Stats
  getStats(): Promise<{ warningCount: number; panelCount: number; ticketCount: number }>;

  // Tickets
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  getTicketByChannel(channelId: string): Promise<Ticket | undefined>;
  getOpenTicketsByUser(userId: string): Promise<Ticket[]>;
  updateTicket(id: number, updates: Partial<InsertTicket>): Promise<Ticket>;
  deleteTicketByChannel(channelId: string): Promise<void>;

  // Support Points
  getSupportPoints(userId: string): Promise<number>;
  addSupportPoint(userId: string): Promise<void>;
  
  // Athkar
  setAthkarChannel(channelId: string, guildId: string): Promise<void>;
  getAthkarChannels(): Promise<string[]>;

  // Blacklist
  setBlacklist(guildId: string, words: string[]): Promise<void>;
  getBlacklist(guildId: string): Promise<string[]>;
  // Custom Commands / Shortcuts
  setShortcut(guildId: string, shortcut: string, command: string, restrictions: { roles?: string[], channels?: string[] }): Promise<void>;
  getShortcuts(guildId: string): Promise<any[]>;
  // Protection Settings
  setProtectionSetting(guildId: string, type: 'words' | 'links' | 'spam' | 'bots', value: boolean): Promise<void>;
  getProtectionSettings(guildId: string): Promise<{ words: boolean; links: boolean; spam: boolean; bots: boolean }>;
  
  // Bot Blacklist
  addToBotBlacklist(userId: string, reason: string): Promise<void>;
  removeFromBotBlacklist(userId: string): Promise<void>;
  isBotBlacklisted(userId: string): Promise<boolean>;
  getBotBlacklist(): Promise<BotBlacklist[]>;
}

export class FileStorage implements IStorage {
  private dataDir: string;
  private warnings: Warning[] = [];
  private panels: Panel[] = [];
  private tickets: Ticket[] = [];
  private supportPoints: SupportPoints[] = [];
  private athkarSettings: any[] = [];
  private blacklist: any[] = [];
  private shortcuts: any[] = [];
  private protectionSettings: any[] = [];
  private botBlacklist: BotBlacklist[] = [];
  private nextIds: Record<string, number> = {
    warnings: 1,
    panels: 1,
    tickets: 1,
    athkarSettings: 1,
    blacklist: 1,
    shortcuts: 1,
    protectionSettings: 1,
    botBlacklist: 1
  };

  constructor() {
    this.dataDir = path.resolve(process.cwd(), "data");
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir);
    }
    this.loadData();
  }

  private loadData() {
    const files = ["warnings.json", "panels.json", "tickets.json", "supportPoints.json", "athkarSettings.json", "blacklist.json", "shortcuts.json", "protectionSettings.json"];
    files.forEach(file => {
      const filePath = path.join(this.dataDir, file);
      const key = file.replace(".json", "");
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        (this as any)[key] = JSON.parse(content);
        
        // Update next IDs
        if (Array.isArray((this as any)[key])) {
          const maxId = (this as any)[key].reduce((max: number, item: any) => Math.max(max, item.id || 0), 0);
          this.nextIds[key] = maxId + 1;
        }
      }
    });
  }

  private saveData(key: string) {
    const filePath = path.join(this.dataDir, `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify((this as any)[key], null, 2));
  }

  async createWarning(warning: InsertWarning): Promise<Warning> {
    const newWarning: Warning = {
      ...warning,
      id: this.nextIds.warnings++,
      createdAt: new Date()
    };
    this.warnings.push(newWarning);
    this.saveData("warnings");
    return newWarning;
  }

  async getWarnings(userId?: string): Promise<Warning[]> {
    if (userId) {
      return this.warnings.filter(w => w.userId === userId).sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
    }
    return [...this.warnings].sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async deleteWarning(id: number): Promise<void> {
    this.warnings = this.warnings.filter(w => w.id !== id);
    this.saveData("warnings");
  }

  async createPanel(panel: InsertPanel): Promise<Panel> {
    const newPanel: Panel = {
      ...panel,
      id: this.nextIds.panels++,
      buttonName: panel.buttonName || null,
      buttonEmoji: panel.buttonEmoji || null,
      welcomeMessage: panel.welcomeMessage || null,
      supportRoles: panel.supportRoles || null,
      categoryId: panel.categoryId || null,
      imageUrl: panel.imageUrl || null,
      ticketWelcomeImageUrl: panel.ticketWelcomeImageUrl || null
    };
    this.panels.push(newPanel);
    this.saveData("panels");
    return newPanel;
  }

  async getPanel(id: number): Promise<Panel | undefined> {
    return this.panels.find(p => p.id === id);
  }

  async getPanels(): Promise<Panel[]> {
    return this.panels;
  }

  async getStats(): Promise<{ warningCount: number; panelCount: number; ticketCount: number }> {
    return {
      warningCount: this.warnings.length,
      panelCount: this.panels.length,
      ticketCount: this.tickets.length
    };
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const newTicket: Ticket = {
      ...ticket,
      id: this.nextIds.tickets++,
      claimedBy: ticket.claimedBy || null,
      panelId: ticket.panelId || null,
      pointsAwarded: ticket.pointsAwarded || false,
      createdAt: new Date()
    };
    this.tickets.push(newTicket);
    this.saveData("tickets");
    return newTicket;
  }

  async getTicketByChannel(channelId: string): Promise<Ticket | undefined> {
    return this.tickets.find(t => t.channelId === channelId);
  }

  async getOpenTicketsByUser(userId: string): Promise<Ticket[]> {
    return this.tickets.filter(t => t.creatorId === userId);
  }

  async deleteTicketByChannel(channelId: string): Promise<void> {
    const index = this.tickets.findIndex(t => t.channelId === channelId);
    if (index !== -1) {
      this.tickets.splice(index, 1);
      this.saveData("tickets");
    }
  }

  async updateTicket(id: number, updates: Partial<InsertTicket>): Promise<Ticket> {
    const index = this.tickets.findIndex(t => t.id === id);
    if (index === -1) throw new Error("Ticket not found");
    this.tickets[index] = { ...this.tickets[index], ...updates };
    this.saveData("tickets");
    return this.tickets[index];
  }

  async getSupportPoints(userId: string): Promise<number> {
    const entry = this.supportPoints.find(p => p.userId === userId);
    return entry ? entry.points : 0;
  }

  async addSupportPoint(userId: string): Promise<void> {
    const index = this.supportPoints.findIndex(p => p.userId === userId);
    if (index === -1) {
      this.supportPoints.push({ userId, points: 1 });
    } else {
      this.supportPoints[index].points += 1;
    }
    this.saveData("supportPoints");
  }

  async setAthkarChannel(channelId: string, guildId: string): Promise<void> {
    this.athkarSettings = this.athkarSettings.filter(s => s.guildId !== guildId);
    this.athkarSettings.push({
      id: this.nextIds.athkarSettings++,
      channelId,
      guildId,
      isEnabled: true
    });
    this.saveData("athkarSettings");
  }

  async getAthkarChannels(): Promise<string[]> {
    return this.athkarSettings.filter(s => s.isEnabled).map(s => s.channelId);
  }

  async setBlacklist(guildId: string, words: string[]): Promise<void> {
    this.blacklist = this.blacklist.filter(b => b.guildId !== guildId);
    this.blacklist.push({
      id: this.nextIds.blacklist++,
      guildId,
      words
    });
    this.saveData("blacklist");
  }

  async getBlacklist(guildId: string): Promise<string[]> {
    const entry = this.blacklist.find(b => b.guildId === guildId);
    return entry ? entry.words : [];
  }

  async setShortcut(guildId: string, shortcut: string, command: string, restrictions: { roles?: string[], channels?: string[] }): Promise<void> {
    this.shortcuts = this.shortcuts.filter(s => !(s.guildId === guildId && s.shortcut === shortcut));
    this.shortcuts.push({
      id: this.nextIds.shortcuts++,
      guildId,
      shortcut,
      command,
      restrictions
    });
    this.saveData("shortcuts");
  }

  async getShortcuts(guildId: string): Promise<any[]> {
    return this.shortcuts.filter(s => s.guildId === guildId);
  }

  async setProtectionSetting(guildId: string, type: 'words' | 'links' | 'spam' | 'bots', value: boolean): Promise<void> {
    let settings = this.protectionSettings.find(s => s.guildId === guildId);
    if (!settings) {
      settings = { id: this.nextIds.protectionSettings++, guildId, words: false, links: false, spam: false, bots: false };
      this.protectionSettings.push(settings);
    }
    settings[type] = value;
    this.saveData("protectionSettings");
  }

  async getProtectionSettings(guildId: string): Promise<{ words: boolean; links: boolean; spam: boolean; bots: boolean }> {
    const settings = this.protectionSettings.find(s => s.guildId === guildId);
    return settings ? { 
      words: settings.words || false, 
      links: settings.links || false, 
      spam: settings.spam || false,
      bots: settings.bots || false
    } : { words: false, links: false, spam: false, bots: false };
  }

  async addToBotBlacklist(userId: string, reason: string): Promise<void> {
    this.botBlacklist = this.botBlacklist.filter(b => b.userId !== userId);
    this.botBlacklist.push({ userId, reason, createdAt: new Date() });
    this.saveData("botBlacklist");
  }

  async removeFromBotBlacklist(userId: string): Promise<void> {
    this.botBlacklist = this.botBlacklist.filter(b => b.userId !== userId);
    this.saveData("botBlacklist");
  }

  async isBotBlacklisted(userId: string): Promise<boolean> {
    return this.botBlacklist.some(b => b.userId === userId);
  }

  async getBotBlacklist(): Promise<BotBlacklist[]> {
    return this.botBlacklist;
  }
}

export const storage = new FileStorage();
