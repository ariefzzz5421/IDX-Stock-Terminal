# Supabase setup for IDX Terminal

Project: `hxeafinzruofbmrtuysk`

The six Prisma tables have already been created in the project's `public` schema. Row level security is enabled on all six tables with no browser policies. The `stocks` table already contains 962 listed BEI issuers, 962 logo links, and 23 market caps marked unavailable rather than zero. The application uses a server-side PostgreSQL connection, so do not put the database password in a `NEXT_PUBLIC_` variable.

## Finish the connection

1. In Supabase, open **Connect → ORM → Prisma**. Use the exact current pooler hosts shown there. Set a database password yourself if one is not known; never put it in a chat or commit it. URL-encode special password characters.
2. In Vercel project settings, add `DATABASE_URL` using the transaction pooler on port `6543`, and `DIRECT_URL` using the session pooler on port `5432`. Set both for the intended environment. The examples in `.env.example` show the format.
3. On a trusted machine, put the same variables in an untracked `.env` or process environment. Because the tables were created through Supabase SQL Editor, first run `npx prisma migrate resolve --applied 20260930_init --config prisma.supabase.config.ts`. This records the existing schema as the applied initial migration; do not rerun the initial `CREATE TABLE` statements.
4. Run `npm run db:supabase:deploy`, then `npm run db:supabase:seed` to reconcile the imported catalogue. The seed upserts all 962 current BEI issuers without overwriting stored prices and marks older off-board rows as not listed. Check the count with `SELECT count(*) FROM public.stocks WHERE is_listed = true;`.
5. Redeploy Vercel and open `/market` and `/asset/AADI` to verify the server uses Supabase. Keep `SESSION_SECRET` unchanged if accounts already exist.

The production app chooses PostgreSQL when `DATABASE_URL` starts with `postgresql://` or `postgres://`. Local development can still use SQLite through `SQLITE_DATABASE_URL` or the default local file. Never use a SQLite URL in `DATABASE_URL` for a Vercel deployment.

The listed-universe snapshot is from the [BEI company profiles](https://www.idx.co.id/id/perusahaan-tercatat/profil-perusahaan-tercatat) on 30 September 2026. A CSV export of the imported rows is available at `public/idx-listed-catalog-20260930.csv`. KSEI provides holding data and TradingView provides most display logos, sectors and market caps. Refresh the official ticker snapshot when BEI adds or removes listings, then run `npm run catalog:refresh` and reseed. Logo links cover the full catalogue, but most have not been individually confirmed against issuer brand assets; the two manual issuer overrides are in `data/logo-overrides.json`.
