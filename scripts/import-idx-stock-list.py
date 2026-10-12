"""Import the public BEI 'Daftar Saham' Excel export without extra packages.

Usage: python scripts/import-idx-stock-list.py <downloaded.xlsx> YYYY-MM-DD
The workbook must come from https://www.idx.co.id/id/data-pasar/data-saham/daftar-saham/.
"""
import json
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NS = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
BOARDS = {"UTAMA", "PENGEMBANGAN", "AKSELERASI", "EKONOMI BARU", "PEMANTAUAN KHUSUS"}


def main() -> None:
    if len(sys.argv) != 3 or not re.fullmatch(r"20\d\d-\d\d-\d\d", sys.argv[2]):
        raise SystemExit(__doc__)
    workbook = Path(sys.argv[1])
    with zipfile.ZipFile(workbook) as archive:
        sheet = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))
    parsed = []
    for row in sheet.findall(".//x:sheetData/x:row", NS):
        cells = {re.match(r"[A-Z]+", cell.attrib["r"]).group(): (cell.findtext("x:v", default="", namespaces=NS) or "").strip()
                 for cell in row.findall("x:c", NS)}
        if cells.get("B") == "Kode":
            if [cells.get(letter) for letter in "ABCDEF"] != ["No", "Kode", "Nama Perusahaan", "Tanggal Pencatatan", "Saham", "Papan Pencatatan"]:
                raise ValueError("Unexpected BEI workbook columns")
            continue
        code = cells.get("B", "").upper()
        board = cells.get("F", "").upper()
        if not re.fullmatch(r"[A-Z]{4,5}", code) or board not in BOARDS:
            raise ValueError(f"Unexpected BEI row: {cells}")
        parsed.append({"code": code, "board": board, "listingDate": cells.get("D"), "listedShares": int(cells.get("E", "0").replace(".", ""))})
    codes = [row["code"] for row in parsed]
    if len(codes) < 900 or len(codes) != len(set(codes)):
        raise ValueError("Incomplete or duplicate BEI stock list")
    catalog = json.loads((ROOT / "prisma/idx-listing.json").read_text(encoding="utf-8"))
    local = {row["code"] for row in catalog}
    official = set(codes)
    result = {
        "source": "https://www.idx.co.id/id/data-pasar/data-saham/daftar-saham/",
        "downloadedAt": sys.argv[2],
        "stocks": sorted(parsed, key=lambda row: row["code"]),
    }
    output = ROOT / "data" / f"idx-stock-list-{sys.argv[2].replace('-', '')}.json"
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Saved {len(parsed)} BEI rows to {output}")
    print("Boards:", dict(Counter(row["board"] for row in parsed)))
    print("Only in BEI:", sorted(official - local))
    print("Only in site catalog:", sorted(local - official))


if __name__ == "__main__":
    main()
