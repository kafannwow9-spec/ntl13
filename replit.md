# ModPanel - Discord Bot Dashboard

## Overview

ModPanel is a Discord bot management dashboard that provides a web interface for monitoring and managing moderation activities. The application combines a Discord.js bot with a React-based admin panel, allowing server administrators to view warnings, track ticket systems, manage blacklists, and monitor bot status in real-time.

The bot handles moderation commands (timeout, warnings), ticket panel systems, athkar (Islamic reminders) scheduling, and server protection features (spam/link/word filtering).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack Query (React Query) for server state
- **Styling**: Tailwind CSS with Discord-inspired dark theme
- **UI Components**: shadcn/ui component library (Radix primitives)
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **Discord Integration**: discord.js v14 with slash commands
- **API Pattern**: Simple REST endpoints defined in `shared/routes.ts`
- **Build**: esbuild for server bundling, Vite for client

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Current Storage**: FileStorage class using JSON files in `/data` directory
- **Database Ready**: Schema exists for PostgreSQL migration (warnings, panels, tickets, support_points, athkar_settings, blacklist, protection_settings tables)

### Project Structure
```
├── client/          # React frontend
│   └── src/
│       ├── components/  # UI components (Sidebar, StatsCard, etc.)
│       ├── hooks/       # Custom hooks (useStats, useWarnings)
│       ├── pages/       # Route pages (Home, Warnings)
│       └── lib/         # Utilities and query client
├── server/          # Express backend + Discord bot
│   ├── bot.ts       # Discord.js bot implementation
│   ├── routes.ts    # API route handlers
│   ├── storage.ts   # Data persistence layer
│   └── db.ts        # Drizzle database connection
├── shared/          # Shared types and schemas
│   ├── schema.ts    # Drizzle table definitions
│   └── routes.ts    # API route contracts with Zod
└── data/            # JSON file storage (temporary)
```

### Key Design Decisions

1. **Shared Schema Pattern**: Database schema defined once in `shared/schema.ts`, used by both server and client via path aliases (`@shared/*`)

2. **File-based Storage with DB Ready**: Currently uses JSON files for persistence but has full PostgreSQL schema ready for migration when DATABASE_URL is configured

3. **Discord Bot Integration**: Bot starts automatically with server if DISCORD_TOKEN environment variable is present

4. **Type-safe API Routes**: Routes defined in `shared/routes.ts` with Zod schemas for request/response validation

## External Dependencies

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (required for Drizzle)
- `DISCORD_TOKEN` - Discord bot token (required for bot functionality)
- `DISCORD_CLIENT_ID` - Discord application client ID (for slash command registration)

### Third-Party Services
- **Discord API**: Bot functionality via discord.js
- **PostgreSQL**: Primary database (Drizzle ORM)
- **Canvas**: Image generation for welcome cards and Hijri date displays

### Key NPM Packages
- `discord.js` - Discord bot framework
- `drizzle-orm` / `drizzle-kit` - Database ORM and migrations
- `express` - HTTP server
- `@tanstack/react-query` - Data fetching and caching
- `framer-motion` - Animations
- `date-fns` - Date formatting
- `moment-hijri` - Islamic calendar support
- `canvas` - Server-side image generation