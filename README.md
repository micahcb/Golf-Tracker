# Golf Tracker

A live PGA Tour leaderboard tracker built with Next.js. Follow the action hole-by-hole, track your favorite players, browse pairings, and build parlays — all updating automatically every 60 seconds.

**[View live →](https://web-production-572f1.up.railway.app/)**

---

## Features

**Leaderboard** — Real-time standings with position, country flag, total score, round-by-round scores (R1–R4), holes completed (Thru), and tee time. A projected or actual cut line is drawn automatically based on the tournament format (top 50 + ties for The Masters, top 65 + ties for all other PGA Tour events).

**Starred Players** — Click the ☆ next to any player to star them. Switch to the Starred tab to see just your picks on a clean leaderboard.

**Pairings** — Browse the full field grouped by tee time. Each group shows which players are paired together and their current scores.

**Followed Pairings** — Follow a specific tee-time group to pin it to its own tab, so you can keep up with a particular group of players all day.

**Parlay Builder** — From the Pairings view, pick players from different groups and save a parlay. Each saved parlay gets its own color, and matched rows are highlighted with a stripe across the leaderboard.

**Position Movement** — After each refresh, arrows show which players have moved up or down since the last update.

**Hole-by-Hole Scoring** — Expand any player row to see their score on each hole of the active round.

**Auto-Refresh** — Data refreshes every 60 seconds from the ESPN API. A countdown timer shows when the next refresh is due, and you can trigger a manual refresh any time.

**Dark Mode** — Press `D` to toggle between dark and light mode.

**Search** — Filter the leaderboard or pairings view by player name or country.

---

## Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Monorepo**: [Turborepo](https://turbo.build/)
- **UI**: [shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/)
- **Data**: [ESPN PGA Tour Scoreboard API](https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard)
- **Deployment**: [Railway](https://railway.app/)

---

## Project Structure

```
Golf-Tracker/
├── apps/
│   └── web/                  # Next.js app
│       ├── app/
│       │   ├── page.tsx
│       │   └── api/tournament/route.ts   # ESPN proxy endpoint
│       ├── components/       # UI components
│       └── lib/              # ESPN data parsing + types
└── packages/
    ├── ui/                   # Shared shadcn/ui components
    ├── eslint-config/
    └── typescript-config/
```

---

## Getting Started

**Prerequisites**: Node.js 18+, pnpm

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will be available at `http://localhost:3000`.

```bash
# Build for production
pnpm build
```

---

## Adding UI Components

To add a new shadcn/ui component, run from the repo root:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

Components land in `packages/ui/src/components` and can be imported anywhere via:

```tsx
import { Button } from "@workspace/ui/components/button";
```
