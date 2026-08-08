# IDX Terminal

A Bloomberg-style terminal for the Indonesia Stock Exchange (IDX/BEI). Dark, dense,
monospace, multi-panel — a watchlist that ticks in real time, a candlestick chart, a
curated news feed, and automatic alerts when a stock starts pumping.

Built for personal use, open sourced under MIT.

> **Status: in development.** Milestones 1–3 are complete, so the app is usable
> end to end: register, sign in, and work a live-ish dashboard with charts, backed by
> the built-in offline data provider. Realtime push, news and pump detection are
> still to come — see [Roadmap](#roadmap).

## Interface preview

An interactive mockup of the target interface — watchlist, chart, depth ladder, news
feed, pump alerts:

**[View the interface preview →](https://claude.ai/code/artifact/be647251-b587-4d75-a749-9ffae0e884f2)**

All figures in the preview are synthetic sample data, not live market data.

## Features

- **The whole board** — 978 active IDX equity securities from KSEI's latest master file
- **Company logos** — 973 issuer/share-class logos with a deterministic monogram fallback for five legacy securities
- **Ticker detail** — chart, delayed best bid/offer, company profile, key ratios and dated holder percentages
- **Foreign flow** — Top Net Buy and Top Net Sell, using IDX EOD data with an authenticated Invezgo fallback
- **Terminal dashboard** — multi-panel grid: watchlist left, chart centre, news right
- **Market status** — Open / Closed on the real BEI schedule, including Friday's shifted
  session hours, pre-opening, break, pre-closing and post-trading
- **Sections** — Dashboard, Watchlist, Top 10, Foreign Flow, Hot, Market and Account
- **Command bar** — type `BBCA` and press `<GO>` to jump to a ticker, Bloomberg-style
- **Realtime prices** — internal WebSocket relay pushes quote updates; cells flash on tick
- **News curation** — RSS aggregation from Indonesian finance media, keyword-tagged to
  ticker codes, cached so you can scroll back through history
- **Pump detection** — rolling baseline on price and volume; crossing a threshold fires
  a clickable alert that routes to the stock's detail page
- **Swappable data providers** — one adapter interface, several backends (see below)
- **Open by default** — the dashboard loads with no login step; accounts are opt-in
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
| `yahoo` **(default)**             | REST      | Real IDX prices via `TICKER.JK`. **No API key, no signup.** Delayed and unofficial. |
| `mock`                            | —         | Synthetic ticks for working offline.              |
| [GoAPI.io](https://goapi.io)      | REST      | IDX snapshots, free tier                          |
| [iTick](https://itick.org)        | WebSocket | Live streaming quotes, `region=ID`, free tier     |
| [Invezgo](https://invezgo.com)    | REST      | Prices, broker summary, foreign flow              |

Pick one with `MARKET_DATA_PROVIDER` in `.env`. The browser never sees a provider key —
only server code touches them. If a provider is selected but its key is missing, the app
logs a warning and falls back to `mock` rather than showing you an empty screen.

> **Heads up on the three real adapters.** Their endpoint paths and response field
> mappings are a best-effort implementation and have **not** been verified against live
> accounts. Each one isolates the wire format in a `mapQuote` / `mapCandle` function and
> takes a `*_BASE_URL` override, so reconciling them with the current docs is a small
> edit rather than a rewrite. `mock` is the only provider that is known-good today.

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

On Windows `psql` is usually not on your PATH, and **Windows PowerShell needs the call
operator `&`** to run a program at a quoted path:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -f "scripts\setup-db.sql"
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

### 4. Create the tables and load the tickers

```bash
npm run db:setup
npm run db:seed
```

The seed loads **978 active IDX equity securities** from the latest monthly KSEI
master snapshot into `prisma/idx-listing.json`, which is committed so a fresh clone
needs no network access. The catalogue also stores dated local/foreign ownership,
listing metadata, and available company logos.
It is idempotent: re-running refreshes company metadata without clobbering stored prices.

To refresh the board after new listings, delistings or ticker renames:

```bash
npm run catalog:refresh
```

> Use `db:setup` (`prisma migrate deploy`) for first-time setup — it applies the
> committed migrations and needs no special database privileges. `npm run db:migrate`
> (`prisma migrate dev`) is for *authoring* new migrations after you change
> `schema.prisma`; it additionally needs `CREATEDB` on the database role.

**Windows PowerShell users:** `&&` is not a statement separator in Windows PowerShell
5.1. Run each command on its own line, or join them with `;`.

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000.

## First run

1. Open http://localhost:3000. The dashboard opens immediately — **no login step** —
   with a starter watchlist of eight tickers across sectors, plus top gainers, top
   losers and most-active panels.
2. Type a ticker in the command bar and press Enter (or `<GO>`) to open it — `AMMN`,
   `BBRI`, `GOTO`. Press `/` anywhere to jump to the command bar. On a stock page,
   **+ Watchlist** adds it; the **×** on a watchlist row removes it.
3. Set a display name, bio and avatar at `/profile`. Avatars are stored as data URIs in
   Postgres, so there's no blob store to configure. Your avatar shows in the terminal
   header, top right.

### Accounts

By default the terminal runs open: everything hangs off a shared `guest` account,
created automatically on first visit. That keeps it a one-click personal tool.

Accounts still exist — `/register` and `/login` work, and signing in switches you to
your own watchlist and profile. To require an account before anything is visible:

```bash
AUTH_REQUIRED="true"
```

Then `/` and `/dashboard` redirect to the login page and the APIs return 401.

Registration is username + password only, minimum 8 characters. No email, no
verification.

Quotes refresh once per page load for the tickers you follow. Continuous streaming
arrives with Milestone 4.

## Scripts

| Command             | Does                                              |
| ------------------- | ------------------------------------------------- |
| `npm run dev`       | Next.js dev server + internal WebSocket relay      |
| `npm run build`     | Production build                                   |
| `npm start`         | Serve the production build                         |
| `npm run db:migrate`| `prisma migrate dev`                               |
| `npm run db:seed`   | Load the IDX ticker universe                       |
| `npm run catalog:refresh` | Refresh KSEI securities, holder snapshots and logos |
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

**`P3014 — Prisma Migrate could not create the shadow database`**
`prisma migrate dev` builds a throwaway shadow database to check migrations against, so
the role needs `CREATEDB`. First-time setup doesn't need it — run `npm run db:setup`
instead. To grant it, as a superuser:
`psql -U postgres -c "ALTER ROLE idx CREATEDB;"`

**PowerShell: `The token '&&' is not a valid statement separator`**
Windows PowerShell 5.1 has no `&&`. Use `;`, or one command per line. Likewise a program
at a quoted path needs the call operator: `& "C:\path\to\psql.exe" ...` — without it
PowerShell treats the line as a string and reports `Unexpected token`.

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
reach a database on your laptop.

Every page now requires a database, so **a Vercel deployment without a managed Postgres
attached will show the "database not ready" screen.** To deploy properly you need:

| Piece | Where it can live |
| --- | --- |
| Next.js app | Vercel |
| PostgreSQL | Supabase, Neon, or any managed Postgres — set `DATABASE_URL` |
| WebSocket relay + pollers (M4–M6) | An always-on host: Railway, Render, Fly |

Alternatively deploy the whole thing to a single always-on host, which matches this
architecture 1:1 and needs no changes. A full guide lands with Milestone 8.

## Roadmap

- [x] **M1** — Project scaffold, Prisma schema, PostgreSQL, seed data
- [x] **M2** — Auth (register/login) and profile page
- [x] **M3** — Market data adapter and static watchlist dashboard
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
