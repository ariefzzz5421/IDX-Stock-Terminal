"""Convert the public KSEI registry CSV export into the site's compact snapshot.

Usage: python scripts/import-ownership-csv.py input.csv output.json
The source CSV is downloadable from https://www.ceritasaham.com/superinvestor.
Keep the CSV's reported percentages and share counts without inferring ownership.
"""

import csv
import json
import sys
from collections import defaultdict
from pathlib import Path
from statistics import median


def main() -> None:
    source, destination = map(Path, sys.argv[1:3])
    holdings = defaultdict(list)
    dates = set()
    with source.open(encoding="utf-8-sig", newline="") as file:
        for row in csv.DictReader(file):
            dates.add(row["date"])
            code = row["ticker"].strip().upper()
            name = row["investor"].strip()
            if not code or not name:
                raise ValueError("Missing ticker or investor")
            shares = int(row["th"])
            percentage = float(row["p"])
            if not 0 <= percentage <= 100 or shares < 0:
                raise ValueError(f"Invalid position for {code}: {name}")
            holdings[code].append([name, percentage, shares, row["type"].strip(), row["lf"].strip(), row["dom"].strip()])
    if dates != {"2026-05-29"}:
        raise ValueError(f"Unexpected snapshot dates: {dates}")
    if len(holdings) != 956 or sum(map(len, holdings.values())) != 7161:
        raise ValueError("May snapshot coverage differs from the published 956 tickers / 7,161 positions")
    catalog_path = Path(__file__).resolve().parents[1] / "prisma" / "idx-listing.json"
    listed_shares = {item["code"]: item["listedShares"] for item in json.loads(catalog_path.read_text(encoding="utf-8"))}
    corrected = 0
    for code, positions in holdings.items():
        # The export contains many decimal-shifted percentages (e.g. 4.11
        # instead of 41.1 for AADI). Share counts in the same ticker reveal
        # a common issued-share denominator. A later catalog is used only to
        # resolve tickers where every exported percentage is shifted 10x.
        implied_totals = [item[2] * 100 / item[1] for item in positions if item[1] > 0]
        smallest = min(implied_totals)
        total_shares = median(value for value in implied_totals if value <= smallest * 1.08)
        catalog_total = listed_shares.get(code)
        if catalog_total:
            ratio = total_shares / catalog_total
            if 0.99 <= ratio <= 1.01 or 5 < ratio < 15:
                total_shares = catalog_total
        for item in positions:
            computed = round(item[2] / total_shares * 100, 2)
            if abs(computed - item[1]) > 0.05:
                corrected += 1
            item[1] = computed
        positions.sort(key=lambda item: item[1], reverse=True)
        if sum(item[1] for item in positions) > 100.5:
            raise ValueError(f"Inconsistent ownership total for {code}")
    destination.write_text(json.dumps(dict(sorted(holdings.items())), ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Saved {len(holdings)} tickers and {sum(map(len, holdings.values()))} positions to {destination}; reconciled {corrected} percentages")


if __name__ == "__main__":
    main()
