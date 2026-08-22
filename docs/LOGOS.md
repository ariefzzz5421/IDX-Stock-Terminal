# Company logos

Every ticker in the terminal shows a logo tile beside its code — in the
watchlist, on every board, and on the stock page. This is how that resolves and
how you add the ones that are missing.

## How a logo is chosen

For each ticker, in order:

1. **`data/logo-overrides.json`** — your manual entries. Always wins.
2. **`prisma/idx-listing.json`** — the bundled catalogue (973 of 978 tickers).
3. **A monogram** — first two letters on a colour derived from the ticker.

The monogram is a deliberate fallback, not a placeholder for a broken image. It
never 404s, and its colour is stable, so a row stays recognisable even without
a real logo.

## Currently missing

Five tickers have no logo in the catalogue and render as monograms:

    ATPK   JASS   PAFI   SING   SUDI

Check this yourself at any time:

```bash
npm run logos:check
```

Add `--verify` to also HEAD every remote URL and list any that have gone dead:

```bash
npm run logos:check -- --verify
```

## Adding a logo — image file

Best for logos you have as a file.

1. Save the image into `public/logos/`, named after the ticker in capitals:

       public/logos/ATPK.png
       public/logos/JASS.svg

   Accepted: `.svg`, `.png`, `.webp`, `.jpg`, `.jpeg`.
   Square, roughly 128×128, works best — it renders at 24px in tables and 48px
   on a stock page.

2. Register it:

   ```bash
   npm run logos:sync
   ```

   This scans the folder and writes the entries into
   `data/logo-overrides.json`. Remote URLs already in that file are preserved.

3. Commit **both** the image and the JSON:

   ```bash
   git add public/logos data/logo-overrides.json
   git commit -m "Add ATPK logo"
   git push
   ```

## Adding a logo — remote URL

Best for a logo already hosted somewhere. Edit `data/logo-overrides.json`
directly:

```json
{
  "ATPK": "https://example.com/atpk.svg",
  "JASS": "/logos/JASS.png"
}
```

No `next.config.ts` change is needed. Images on hosts Next.js is not configured
to optimise are rendered with a plain `<img>` instead, so any URL works
immediately.

## Replacing a logo you don't like

The overrides file beats the catalogue, so to replace an existing logo just add
the ticker to `data/logo-overrides.json`. Nothing else needs touching.

## After deploying

Vercel rebuilds on every push, so a committed logo is live on the next deploy.
Nothing to configure and no environment variable involved — this is all static
files in the repository.

## Refreshing the whole catalogue

The bundled catalogue is regenerated from public sources:

```bash
npm run catalog:refresh
```

That rewrites `prisma/idx-listing.json`. It does **not** touch
`data/logo-overrides.json`, so your manual work survives a refresh.
