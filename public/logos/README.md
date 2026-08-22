# Manual company logos

Drop an image here named after the ticker, in capitals:

    public/logos/ATPK.png
    public/logos/JASS.svg

Supported extensions: `.svg`, `.png`, `.webp`, `.jpg`, `.jpeg`.

Then run:

    npm run logos:sync

That writes the file into `data/logo-overrides.json`, which is what the app
reads. Commit both the image and the JSON.

Square images around 128×128 look best — they are rendered at 24px in tables
and 48px on a stock page.

See `docs/LOGOS.md` for the full guide.
