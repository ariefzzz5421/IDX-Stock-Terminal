# Business location research

`coal.ts` and `data-centers.ts` contain curated physical asset locations. Each marker requires at least one source with a verification date. All current coordinates are representative city, district, regency, or industrial-estate points and are marked `approximate`; they are not surveyed mine pits or facility entrances.

`coal-groups.ts` holds comparable consolidated production disclosures. A group figure must never be copied into an individual mine's production field. Missing production, RKAB, reserves, or data-center operational IT load stays `N/D`.

For data centers, `disclosedCapacityMw` describes a published facility capacity and may be a fully fitted or marketed specification. It does not mean occupied/live load. `plannedItLoadMw` is a future campus or buildout figure and must remain separate. ZanKore is an AI infrastructure pipeline entry, outside the operational operator ranking.

To add a sector: extend `BusinessSector` and `SECTORS` in `lib/business-locations.ts`, add a typed dataset under this directory, export it through `index.ts`, then provide sector-specific metric and ranking presentation. Keep sources, status, precision, and verification dates on every asset.

`market-caps.ts` is a 30 September 2026 TradingView IDX scanner snapshot for the mapped listed tickers. These issuer market caps are in IDR and are not live prices. An operator without its own IDX listing has no market cap displayed; TLKM, ASII and ISAT figures are marked as listed-company exposure rather than operator values. The small logos use operator sites where possible, with a published brand-image fallback for SpaceDC (Data Center Dynamics), BDx (PR Newswire) and MettaDC (Baxtel).
