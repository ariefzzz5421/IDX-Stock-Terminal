# IDX Terminal

A Bloomberg-style terminal for the Indonesia Stock Exchange (IDX/BEI). Dark, dense,
monospace, multi-panel — a watchlist that ticks in real time, a candlestick chart, a
curated news feed, and automatic alerts when a stock starts pumping.

Built for personal use, open sourced under MIT.

> **Status: in development.** Milestone 1 of 8 is complete (project scaffold, database
> schema, seed data). The dashboard, auth, realtime feed and pump detector are still
> being built — see [Roadmap](#roadmap). The app currently boots to the default
> Next.js page.

## Interface preview

An interactive mockup of the target interface — watchlist, chart, depth ladder, news
feed, pump alerts:

**[View the interface preview →](https://claude.ai/code/artifact/be647251-b587-4d75-a749-9ffae0e884f2)**

All figures in the preview are synthetic sample data, not live market data.

## Features

- **Terminal dashboard** — multi-panel grid: watchlist left, chart centre, news right
- **Command bar** — type `BBCA` and press `<GO>` to jump to a ticker, Bloomberg-style
- **Realtime prices** — internal WebSocket relay pushes quote updates; cells flash on tick
- **News curation** — RSS aggregation from Indonesian finance media, keyword-tagged to
  ticker codes, cached so you can scroll back through history
- **Pump detection** — rolling baseline on price and volume; crossing a threshold fires
  a clickable alert that routes to the stock's detail page
- **Swappable data providers** — one adapter interface, several backends (see below)
- **Simple auth** — username + password, bcrypt, no email or OTP
- **Profiles** — display name, bio, avatar

## Tech stack

| Layer      | Choice                                                    |
| ---------- | --------------------------------------------------------- |
| Framework  | Next.js 16 (App Router), React 19, TypeScript              |
| Styling    | Tailwind CSS v4, JetBrains Mono                            |
| Database   | PostgreSQL 18 + Prisma 7 (via `@prisma/adapter-pg`)        |
| Realtime   | `ws` — an internal relay server, so provider keys stay server-side |
| Auth       | `iron-session` + bcrypt                                    |
| State      | Zustand                                                    |
| Charting   | lightweight-charts (TradingView)                           |

## Market data providers

Market data lives behind one interface in `lib/market-data/`, so providers swap without
touching the UI:

```ts
getQuote(code)              // latest snapshot
getOHLCV(code, interval)    // candles
subscribeLive(codes, cb)    // push updates
```

| Provider                          | Transport | Notes                                            |
| --------------------------------- | --------- | ------------------------------------------------ |
| `mock`                            | —         | Synthetic ticks. **No API key needed** — use this to run the terminal end to end. |
| [GoAPI.io](https://goapi.io)      | REST      | IDX snapshots, free tier                          |
| [iTick](https://itick.org)        | WebSocket | Live streaming quotes, `region=ID`, free tier     |
| [Invezgo](https://invezgo.com)    | REST      | Prices, broker summary, foreign flow              |

Pick one with `MARKET_DATA_PROVIDER` in `.env`. The browser never sees a provider key —
the internal WebSocket server is the only thing that talks to them.

## Prerequisites

- **Node.js 20+** (developed on 24.14)
- **PostgreSQL 16+** (developed on 18.4) — installed natively, or via the included
  `docker-compose.yml`

## Setup

### 1. Clone and install

```bash
git clone https://github.com/ariefzzz5421/IDX-Stock-Terminal.git
cd IDX-Stock-Terminal
npm install
```

`npm install` runs `prisma generate` automatically.

### 2. Start PostgreSQL

**Option A — Docker (easiest).** Creates the role, database and password that
`.env.example` already expects:

```bash
docker compose up -d
```

**Option B — a PostgreSQL you installed yourself.** Run the bundled script once as a
superuser to create the `idx` role and `idx_terminal` database. It will prompt for your
`postgres` password:

```bash
psql -U postgres -h localhost -f scripts/setup-db.sql
```

On Windows, `psql` is usually not on your PATH — call it by full path instead:

```bash
"/c/Program Files/PostgreSQL/18/bin/psql" -U postgres -h localhost -f scripts/setup-db.sql
```

### 3. Configure environment

```bash
cp .env.example .env
```

Then edit `.env`. At minimum:

- `DATABASE_URL` — already correct if you used either option above
- `SESSION_SECRET` — must be 32+ characters. Generate one:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- `MARKET_DATA_PROVIDER` — leave as `mock` to run without signing up for anything

Every other variable has a working default and is documented inline in `.env.example`.

### 4. Migrate and seed

```bash
npx prisma migrate dev
npx prisma db seed
```

The seed loads ~80 liquid IDX tickers across all 10 IDX-IC sectors. It is idempotent —
re-running refreshes company metadata without clobbering stored prices.

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000.

## First run

1. Go to `/register` and create an account — username and password only, minimum 8
   characters. No email, no verification.
2. You land on `/dashboard` with a starter watchlist.
3. Add a ticker by typing its code in the command bar and pressing `<GO>`, then hitting
   the **+** on the stock page. Remove one from the watchlist row menu.
4. Set a display name, bio and avatar at `/profile`. Your avatar shows in the terminal
   header, top right.

## Scripts

| Command             | Does                                              |
| ------------------- | ------------------------------------------------- |
| `npm run dev`       | Next.js dev server + internal WebSocket relay      |
| `npm run build`     | Production build                                   |
| `npm start`         | Serve the production build                         |
| `npm run db:migrate`| `prisma migrate dev`                               |
| `npm run db:seed`   | Load the IDX ticker universe                       |
| `npm run db:studio` | Prisma Studio, a GUI over the database             |
| `npm run db:reset`  | Drop, re-migrate and re-seed. **Destroys data.**   |

## Troubleshooting

**`Can't reach database server at localhost:5432`**
Postgres isn't running, or it's on another port. Check with `docker compose ps`, or on
Windows `Get-Service postgresql*`. If you already had Postgres on 5432, the Docker
container can't bind that port — change the host side of the mapping in
`docker-compose.yml` to `5433:5432` and update `DATABASE_URL` to match.

**`Authentication failed for user "idx"`**
The role exists but the password differs from `DATABASE_URL`. Reset it:
`psql -U postgres -c "ALTER ROLE idx PASSWORD 'idx';"`

**`DATABASE_URL is not set`**
You skipped step 3, or `.env` is somewhere other than the project root. Prisma 7 reads
it through `prisma.config.ts`, which imports `dotenv/config`.

**WebSocket won't connect / prices never move**
Check `WS_PORT` and `NEXT_PUBLIC_WS_URL` agree — if you change the port, change both.
Anything already listening on 4001 will block the relay. Confirm the status bar at the
bottom of the terminal: it shows the socket state and the active provider.

**Prices are flat and the provider says `MOCK`**
That's the offline default. Set `MARKET_DATA_PROVIDER` and the matching API key in
`.env` to pull real quotes.

**`@prisma/client did not initialize yet`**
Run `npx prisma generate`. The client is generated into `lib/db/generated`, which is
gitignored rather than committed.

**Prices look wrong during market hours**
IDX trades 09:00–15:50 WIB with a break, Monday to Friday. Free-tier providers usually
lag by 10–15 minutes; none of them are a substitute for a real feed.

## Deployment

The default architecture is deliberately local-first: a Postgres on your machine and a
long-lived WebSocket process. That does not map onto serverless hosting — Vercel can host
the Next.js app, but not the persistent socket server or the polling jobs, and it can't
reach a database on your laptop. To deploy you need a managed Postgres and a separate
always-on host for the realtime worker. See `docs/deployment.md` (coming with Milestone 8).

## Roadmap

- [x] **M1** — Project scaffold, Prisma schema, PostgreSQL, seed data
- [ ] **M2** — Auth (register/login) and profile page
- [ ] **M3** — Market data adapter and static watchlist dashboard
- [ ] **M4** — WebSocket relay, live prices and chart
- [ ] **M5** — News aggregation and broadcast
- [ ] **M6** — Pump detector and alert popup
- [ ] **M7** — Bloomberg-style UI polish and command bar
- [ ] **M8** — Documentation and deployment guide

## Disclaimer

This is a personal project for tracking and learning, not investment advice. Data comes
from free-tier third-party APIs and may be delayed, incomplete or wrong. Don't trade on it.

## License

MIT — see [LICENSE](LICENSE).
