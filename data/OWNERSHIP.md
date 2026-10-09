# Ownership data

The active shareholder dataset is `shareholders-2026-09.json`: **7,154 positions across 961 tickers, as of 30 September 2026**. It is imported directly from the BEI/KSEI public workbook [Pemegang Saham di Atas 1% per 30 September 2026](https://www.idx.co.id/Media/yqjhhsee/peng-2026-09-00024-satu-persen.xlsx), linked on [BEI Data Kepemilikan Saham](https://www.idx.co.id/id/perusahaan-tercatat/data-kepemilikan-saham/). Downloaded workbook SHA-256: `804b3bb705860c8cee22addf63649c890d8cd66f8ae5e8a5d02730aec86bdd60`.

Regenerate the compact JSON with:

```text
python scripts/import-ownership-idx-xlsx.py source.xlsx data/shareholders-2026-09.json
```

The importer retains BEI/KSEI's investor names, classification, local/foreign flag, domicile, share counts, and percentages. It validates the common source date, per-row share totals, and ticker-level disclosed percentages. Four `TRINITI DINAMIK Tbk` rows have `SHARE_CODE=1` in the official workbook because Excel converted the ticker `TRUE` to a boolean. Only those four rows are mapped back to the catalog's `TRUE` ticker; the importer rejects other unrecognized source codes. Classification labels are preserved as published, including unusual labels; they are not evidence of affiliation.

The prior May 2026 dataset is retained as an archive. It was reconstructed from a third-party CSV; it is not used by the active pages. The September data records holders with at least 1% as of the workbook date. It is not a live ownership feed. TradingView free-float figures are fetched separately and have their own check time; their ratio is a vendor estimate, not an official BEI free-float determination.
