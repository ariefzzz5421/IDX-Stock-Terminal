# AI Analyst configuration

`/ai-analyst` already shows a deterministic, source-linked IDX market brief. It does not need an AI key. The optional AI summary uses a server-side OpenAI-compatible chat-completions endpoint, without a paid SDK.

Add these **server-only** environment variables in Vercel Production and Preview when the chosen provider is ready:

```text
AI_ANALYST_BASE_URL=https://your-provider.example/v1
AI_ANALYST_MODEL=your-model-name
AI_ANALYST_API_KEY=your-secret-key
```

Use the provider's documented HTTPS base URL, model name, and secret. Do not add `NEXT_PUBLIC_` to these names or commit the key to Git. Redeploy after saving the variables. Until all three values are valid, the page continues to show the verified deterministic brief.

The provider receives only a bounded, dated market snapshot: ticker, price, change, and volume. It receives no account profile, watchlist, password, or user-entered prompt. AI text is shown separately from source figures and must not be treated as a verified explanation for a price move. If the provider fails, the source-linked brief stays visible. The scanner is delayed and does not contain company news or trading catalysts.

## Corporate Intelligence pipeline

The corporate-intelligence section is separate from the existing market brief and optional chat-completions narrative. It uses the official OpenAI Responses API with structured JSON, configured with server-only `OPENAI_API_KEY` and `OPENAI_MODEL`. It scans public KSEI corporate-action schedule tables and follows their official PDF links. The currently active adapters cover HMETD, cash/share/mixed dividends, share bonus, and mandatory tender-offer schedules. Source text and fingerprints are stored in the existing database. The model sees only bounded excerpts from the disclosure; its claimed quotes, ticker, phase, and numeric facts are checked against the PDF before publication. A missing API key or invalid model response leaves evidence in the database and records a partial run rather than publishing invented research.

The pipeline has an explicit coverage panel. IDX disclosure/surveillance feeds, issuer/OJK feeds, stock splits, the complete warrant-series catalog, and MSCI/FTSE/VanEck index notices are **not yet connected**. No run claims full BEI coverage. Index announcements, ETF holdings and observed flows must be independently sourced and must not be treated as interchangeable. The 5–6 October BUVA, BTPS, INPS and other historical notes supplied in the task are import candidates only; none are automatically seeded or marked confirmed.

The research page shows a live Jakarta clock, the exact publication time of each research version, the last scan start/end times, and paginated, dated scan history. It also lists discovered official documents with their source publication date and original link before AI analysis finishes. These documents remain labelled as awaiting review or unavailable; they are not presented as verified research. It says no new material findings **only after a successful scan completed on the current Jakarta day**, scoped to the connected KSEI feeds. A partial, failed, running, or stale scan never claims that the market had no corporate actions. Previous findings and substantive versions remain accessible as an archive. Ticker logos use the terminal's existing issuer logo catalog and manual overrides; unavailable logos use a ticker monogram.

### Data model and migrations

Both `prisma/schema.prisma` (SQLite) and `prisma/supabase/schema.prisma` (PostgreSQL) contain the same six intelligence models. The matching migration SQL is in `prisma/migrations/20261006162049_intelligence` and `prisma/supabase/migrations/20261006162049_intelligence`. Apply with:

```text
npm run db:setup                  # local SQLite, including existing seed
npm run db:supabase:deploy        # production PostgreSQL, DIRECT_URL required
```

The production build script also applies pending Supabase migrations when `DIRECT_URL` is set. Back up the production database before first deployment. Existing stock, watchlist, stream and user tables are not replaced. Event identity is issuer + normalized category + action series/period. Each substantive fact/lifecycle change creates an `IntelligenceEventVersion` linked to its predecessor; unchanged documents bypass OpenAI. A source document with failed retrieval is marked unavailable. Runs retain per-source errors and a checkpoint cursor for documents not processed within the invocation budget.

### Activate in Vercel

1. Set production `DATABASE_URL`, `DIRECT_URL`, and `SESSION_SECRET` as already required by this app.
2. Set `OPENAI_API_KEY` and a Responses API model in `OPENAI_MODEL`. The default example is `gpt-6-luna`; confirm that the account can use the chosen model. The document extractor uses `reasoning.effort: none` for Luna to keep bounded, source-grounded JSON output within the response budget.
3. Generate a random `CRON_SECRET` of at least 32 characters and add it to Vercel Production. Do not reuse the session secret.
4. Optionally set `AI_ANALYST_ADMIN_USERNAMES` to signed-in usernames allowed to inspect diagnostics and run manual scans. This is **not required for automatic research**. Leave empty to disable manual scans.
5. Deploy the app with `vercel.json`. Vercel Cron calls `/api/intelligence/cron/morning` at `0 1 * * 1-5` UTC (08:00 WIB) and `/api/intelligence/cron/evening` at `0 14 * * 1-5` UTC (21:00 WIB), Monday–Friday. They are separate daily cron jobs. On Vercel Hobby, each can run anywhere within its scheduled hour; the actual start/end time is shown in scan history. Weekend runs are not scheduled.
6. Open `/ai-analyst` after the next scheduled window and inspect the dated scan history and source coverage. The admin-only **Uji sumber** and **Jalankan riset** controls remain optional for troubleshooting; ordinary users do not need to press them. The dry run does not publish events.

The cron routes require `Authorization: Bearer <CRON_SECRET>`. The manual route requires a signed-in allowlisted account plus a same-origin POST. Visitors cannot trigger scans or read the API key. Scans are serialized with a database lease and unique morning/evening slots per Jakarta date, so repeated delivery does not duplicate the same scheduled run. A batch processes at most ten new/changed PDFs and persists remaining work for the next run; a partial or failed run never displays the clean-scan message. No external notifications are sent. In-app unread state is unique per user and event version. The schedule begins after the production deployment; missed past windows are not backfilled automatically.

### Interpretation and limits

Materiality is a transparent 0–100 score with transaction-to-market-cap size, potential dilution, control, debt/governance, index relevance, official evidence, and newness. Priority is separate from share-price direction. When a denominator or amount is unavailable, that component contributes zero rather than a made-up figure. A `CONFIRMED` card means quoted statements in the official disclosure were verified; it does not turn a proposed deal into a completed one. The detail page retains the precise stage and original document link.

The scanner is intentionally event-driven: it reads disclosure lists, not every ticker. It cannot guarantee coverage outside the connected KSEI schedule categories. PDF text extraction can fail for scanned images; those documents remain unavailable until OCR or manual review is added. Token counts are logged per run. Optional `OPENAI_INPUT_USD_PER_MILLION` and `OPENAI_OUTPUT_USD_PER_MILLION` display an admin-only cost estimate; otherwise cost is N/D.
