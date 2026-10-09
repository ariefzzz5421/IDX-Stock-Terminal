"""Import BEI/KSEI's monthly >=1% shareholder workbook without third-party data.

Usage: python scripts/import-ownership-idx-xlsx.py source.xlsx output.json

The workbook comes from the official BEI Data Kepemilikan Saham page. The
compact output is consumed by the Free Float, Overview, and Konglo routes.
"""

import json
import re
import sys
import zipfile
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path
from xml.etree import ElementTree


NS = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
HEADERS = {
    "A": "DATE", "B": "SHARE_CODE", "D": "INVESTOR_NAME",
    "E": "INVESTOR_CLASSIFICATION", "F": "LOCAL_FOREIGN",
    "H": "DOMICILE", "I": "HOLDINGS_SCRIPLESS",
    "J": "HOLDINGS_SCRIP", "K": "TOTAL_HOLDING_SHARES",
    "L": "PERCENTAGE",
}
# Excel exports TRUE as the boolean cell value 1. Confirmed by the issuer
# name in the same four rows and the BEI-listed company catalog.
SOURCE_CODE_CORRECTIONS = {("1", "TRINITI DINAMIK Tbk"): "TRUE"}


def rows_from_workbook(source: Path):
    with zipfile.ZipFile(source) as archive:
        strings = ["".join(node.itertext()) for node in ElementTree.fromstring(
            archive.read("xl/sharedStrings.xml")
        ).findall("x:si", NS)]
        worksheet = ElementTree.fromstring(archive.read("xl/worksheets/sheet1.xml"))
        for row in worksheet.findall(".//x:sheetData/x:row", NS):
            cells = {}
            for cell in row.findall("x:c", NS):
                column = re.match(r"[A-Z]+", cell.attrib["r"]).group()
                value = cell.find("x:v", NS)
                cells[column] = (strings[int(value.text)] if cell.get("t") == "s"
                                 else value.text if value is not None else "")
            yield int(row.attrib["r"]), cells


def main():
    source, destination = map(Path, sys.argv[1:3])
    workbook_rows = iter(rows_from_workbook(source))
    header = next(cells for number, cells in workbook_rows if number == 6)
    if any(header.get(column) != label for column, label in HEADERS.items()):
        raise ValueError("Unexpected BEI workbook columns")

    holdings = defaultdict(list)
    dates = set()
    corrected_codes = 0
    for row_number, row in workbook_rows:
        if not row.get("B"):
            continue
        date = datetime(1899, 12, 30) + timedelta(days=int(row["A"]))
        dates.add(date.date().isoformat())
        code = row["B"].strip().upper()
        if not re.fullmatch(r"[A-Z0-9]{4,5}", code):
            corrected = SOURCE_CODE_CORRECTIONS.get((code, row.get("C", "")))
            if not corrected:
                raise ValueError(f"Unknown source ticker in row {row_number}: {code}")
            code = corrected
            corrected_codes += 1
        name = row["D"].strip()
        shares = int(row["K"])
        percentage = round(float(row["L"]), 2)
        if not name or shares <= 0 or not 1 <= percentage <= 100:
            raise ValueError(f"Invalid holder in row {row_number}")
        if int(row["I"]) + int(row["J"]) != shares:
            raise ValueError(f"Share-count mismatch in row {row_number}")
        holdings[code].append([
            name, percentage, shares, row.get("E", "").strip(),
            row.get("F", "").strip(), row.get("H", "").strip(),
        ])

    if len(dates) != 1 or not holdings:
        raise ValueError(f"Missing or mixed workbook dates: {dates}")
    for code, positions in holdings.items():
        if sum(position[1] for position in positions) > 100.1:
            raise ValueError(f"Disclosed holdings exceed 100% for {code}")
        positions.sort(key=lambda position: (-position[1], position[0]))
    destination.write_text(json.dumps(dict(sorted(holdings.items())), ensure_ascii=False,
                                      separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"{next(iter(dates))}: {len(holdings)} tickers, "
          f"{sum(map(len, holdings.values()))} positions; "
          f"corrected {corrected_codes} TRUE ticker cells")


if __name__ == "__main__":
    main()
