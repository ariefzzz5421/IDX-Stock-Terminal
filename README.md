# IDX Terminal

A Bloomberg-style terminal for the Indonesia Stock Exchange (IDX/BEI). Dark, dense,
monospace, multi-panel — the whole IDX board, a live watchlist, candlestick charts and
company fundamentals, running entirely on your own machine.

Built for personal use, open sourced under MIT.

> **Status: in development, but usable end to end today.** Clone it, `npm install`,
> `npm run dev` — no database to install, no login required. Browse all 962 listed
> securities, follow a watchlist, read charts and fundamentals, with real prices from
> Yahoo Finance and no API key. Streaming push, news and pump detection are **not built
> yet** — see [Roadmap](#roadmap).

## Interface preview

An early interactive mockup of the target interface:

**[View the interface preview →](https://claude.ai/code/artifact/be647251-b587-4d75-a749-9ffae0e884f2)**

It's a mockup from early in the build and shows some ideas (a news panel, pump alerts)
that are not implemented yet — see [Not built yet](#not-built-yet) for what that
actually means today. All figures in it are synthetic sample data.

## Features

- **The whole board** — 962 issuers from BEI's listed-company profile snapshot,
  enriched with KSEI, TradingView and Yahoo data
- **Company logos** — logo images for all 962 listed tickers from market data
  providers or manual overrides; these are display assets, not issuer endorsements
- **Ticker detail** — `/asset/{ticker}` chart, delayed best bid/offer, company profile, key ratios and
  dated holder percentages
- **Foreign flow** — Top Net Buy and Top Net Sell. Needs `INVEZGO_KEY`: IDX's own
  endpoint sits behind Cloudflare and returns 403 to servers, so without a key this
  panel explains itself rather than showing data
- **Terminal dashboard** — multi-panel grid: watchlist, top gainers, top losers, turnover
- **Resizable panels** — drag the divider between panels to resize, click the grip to
  collapse either side to a slim rail; both persist per page
- **Market status** — Open / Closed on the real BEI schedule, including Friday's shifted
  session hours, pre-opening, break, pre-closing and post-trading
- **Sections** — Dashboard, Watchlist, Top 10, Foreign Flow, Hot, Market and Account
- **Command bar** — type `BBCA` and press `<GO>` to jump to a ticker, Bloomberg-style
- **Swappable data providers** — one adapter interface, several backends (see below)
- **Open by default** — the dashboard loads with no login step; accounts are opt-in
- **Simple auth** — username + password, bcrypt, no email or OTP
- **Zero-setup local storage** — embedded SQLite for development; Supabase PostgreSQL
  support for hosted deployment (see [Supabase setup](docs/SUPABASE.md))
- **Profiles** — display name, bio, avatar

### Not built yet

These are planned, not shipped. There is no code behind them today:

- **Streaming prices** — an internal WebSocket relay pushing ticks, instead of the
  current per-request snapshot
- **News curation** — RSS aggregation from Indonesian finance media, tagged to tickers
- **Pump detection** — rolling price/volume baseline firing a clickable alert

## Tech stack

| Layer      | Choice                                                    |
| ---------- | --------------------------------------------------------- |
| Framework  | Next.js 16 (App Router), React 19, TypeScript              |
| Styling    | Tailwind CSS v4, JetBrains Mono                            |
| Database   | SQLite locally or Supabase PostgreSQL in production, via Prisma 7 |
| Realtime   | *(planned)* `ws` relay — today quotes refresh per request  |
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
> edit rather than a rewrite. `yahoo` and `mock` are the only providers known-good today.

## Prerequisites

- **Node.js 20+** (developed on 24.14)

That's it. The database is embedded SQLite — nothing to install, no service to start,
no connection string required.

## Setup

```bash
git clone https://github.com/ariefzzz5421/IDX-Stock-Terminal.git
cd IDX-Stock-Terminal
npm install
npm run dev
```

`npm install` generates both Prisma clients. `npm run dev` applies local SQLite
migrations and seeds the 962 listed tickers from the committed catalogue.

Open http://localhost:3000. The dashboard loads immediately — no account, no setup
screen, no separate migrate/seed step.

### Optional: configure environment

There is nothing required in `.env` for local use. Copy `.env.example` to `.env` only if
you want to change a default — a different market data provider, a different database
file location, or a real `SESSION_SECRET` (see [Accounts](#accounts)):

```bash
cp .env.example .env
```

Every variable is documented inline in `.env.example`.

**Windows PowerShell users:** `&&` is not a statement separator in Windows PowerShell
5.1. Run each command on its own line, or join them with `;`.

## First run

1. Open http://localhost:3000. The dashboard opens immediately — **no login step** —
   with a starter watchlist of eight tickers across sectors, plus top gainers, top
   losers and most-active panels.
2. Type a ticker in the command bar and press Enter (or `<GO>`) to open it — `AMMN`,
   `BBRI`, `GOTO`. Press `/` anywhere to jump to the command bar. On a stock page,
   **+ Watchlist** adds it; the **×** on a watchlist row removes it.
3. Drag the thin divider between panels to resize either side; hover it for a grip
   button that collapses that panel to a slim rail. Both choices are remembered per
   page.
4. Set a display name, bio and avatar at `/account`. Avatars are stored as data URIs in
   the database, so there's no blob store to configure. Your avatar shows in the
   terminal header, top right.

### Pages

| Route | What it is |
| --- | --- |
| `/` | Public landing page — what the terminal is, live movers, sign-up |
| `/dashboard` | Watchlist, top gainers, top losers, most active |
| `/watchlist` | Everything you follow, with up/down counts |
| `/top10` | Top 10 gainers, losers and turnover |
| `/foreign-flow` | Net foreign accumulation and distribution |
| `/hot` | Biggest moves among actively traded names |
| `/market` | The full board, searchable and paged |
| `/account` | Display name, bio, avatar, session info |
| `/asset/[ticker]` | Quote, chart, best bid/offer, company profile |
| `/stock/[code]` | Redirect to the canonical asset page |

### Company logos

Every listed ticker has a logo URL in the 30 September 2026 catalogue. Most
come from market data providers and have not been individually checked against
issuer brand assets. AADI and BUMI use manual issuer URLs. A monogram remains
the fallback when no logo URL is available.

To see what's missing, and to add your own:

```bash
npm run logos:check
```

Drop an image into `public/logos/<TICKER>.png` and run `npm run logos:sync`, or
add a URL straight into `data/logo-overrides.json`. Your entries always beat the
bundled catalogue. Full guide: **[docs/LOGOS.md](docs/LOGOS.md)**.

### Accounts

By default the terminal runs open: everything hangs off a shared `guest` account,
created automatically on first visit. That keeps it a one-click personal tool.

**Anyone can sign up for their own account** from the landing page, the **Sign up**
button in the terminal header, or `/register` directly — username and password only,
minimum 8 characters, no email and no verification. Passwords are hashed with bcrypt
and the account, watchlist and profile are written to the configured database
(local SQLite or Supabase PostgreSQL). The browser never receives database credentials.

Signing in switches you from the shared guest watchlist to your own; signing out
switches back. To require an account before anything is visible:

```bash
AUTH_REQUIRED="true"
```

Then `/` and `/dashboard` redirect to the login page and the APIs return 401.

`SESSION_SECRET` (which encrypts the login cookie) is optional for local development —
if it's unset, an insecure fixed development secret is used automatically, with a
console warning. **A real deployment must set a real one**: it refuses to start without
it once `NODE_ENV=production`. Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Quotes refresh once per page load for the tickers you follow. Continuous streaming is
not built yet — see [Not built yet](#not-built-yet).

## Scripts

| Command                   | Does                                                        |
| -------------------------- | ------------------------------------------------------------ |
| `npm run dev`              | Next.js dev server (runs `predev` first, see below)         |
| `npm run build`            | Production build                                              |
| `npm start`                | Serve the production build                                    |
| `npm run predev`           | Apply and seed local SQLite before `dev` |
| `npm run postinstall`      | Generate SQLite and PostgreSQL clients |
| `npm run db:setup`         | Apply local SQLite migrations and seed listed tickers |
| `npm run db:migrate`       | `prisma migrate dev` — for authoring new migrations           |
| `npm run db:seed`          | Load the IDX ticker universe                                  |
| `npm run catalog:refresh`  | Refresh KSEI securities, holder snapshots and logos from source |
| `npm run db:studio`        | Prisma Studio, a GUI over the database                        |
| `npm run db:reset`         | Drop, re-migrate and re-seed. **Destroys data.**               |
| `npm run logos:check`      | List tickers with no logo; `-- --verify` also checks for dead URLs |
| `npm run logos:sync`       | Fold `public/logos/*` into `data/logo-overrides.json`          |

## Troubleshooting

**Dashboard looks empty on first load**
`npm run dev` seeds all 962 listed tickers on startup. If that step failed,
run `npm run db:setup` again.

**`@prisma/client did not initialize yet`**
Run `npx prisma generate`. The client is generated into `lib/db/generated`, which is
gitignored rather than committed.

**Something looks stuck or corrupted in the database**
The database is a single file. To start over from scratch:

```bash
rm prisma/dev.db
npm run db:setup
npm run db:seed
```

This destroys your accounts and watchlists. There is no way to selectively reset just
one table's data other than `npm run db:reset`, which does the same thing via Prisma.

**`SQLITE_BUSY: database is locked`**
SQLite allows one writer at a time. This can happen if two `npm run dev` instances are
pointed at the same `prisma/dev.db`, or a `db:studio` session is mid-write. Stop the
other process and retry.

**Prices are flat and the provider says `MOCK`**
That's the offline default. Set `MARKET_DATA_PROVIDER=yahoo` (already the default in
`.env.example`) or another provider with its matching API key in `.env`.

**Prices look wrong during market hours**
IDX trades 09:00–15:50 WIB with a break, Monday to Friday. Free-tier providers usually
lag by 10–15 minutes; none of them are a substitute for a real feed.

**Resizable panel is stuck too narrow / too wide**
Width and collapsed state are stored in your browser's `localStorage`, keyed per page.
Clear the `idx-split-*` keys (or just clear site data for `localhost:3000`) to reset to
defaults.

## Deployment

Use Supabase PostgreSQL for Vercel. Set the server-only `DATABASE_URL` and
`DIRECT_URL`, apply the PostgreSQL migration, and seed the listed universe.
See [Supabase setup](docs/SUPABASE.md). SQLite remains for local development.

## Roadmap

- [x] **M1** — Project scaffold, Prisma schema, database, seed data
- [x] **M2** — Auth (register/login) and profile page
- [x] **M3** — Market data adapter and static watchlist dashboard
- [ ] **M4** — WebSocket relay, live prices and chart
- [ ] **M5** — News aggregation and broadcast
- [ ] **M6** — Pump detector and alert popup
- [x] **M7** — Bloomberg-style UI polish, command bar, resizable panels
- [ ] **M8** — Documentation and deployment guide

## Disclaimer

This is a personal project for tracking and learning, not investment advice. Data comes
from free-tier third-party APIs and may be delayed, incomplete or wrong. Don't trade on it.

## License

MIT — see [LICENSE](LICENSE).
