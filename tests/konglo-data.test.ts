import assert from "node:assert/strict";
import test from "node:test";
import { KONGLO_PROFILES, kongloHoldings, kongloPortfolioSummary } from "../lib/konglo";
import { shareholdersFor } from "../lib/shareholders";

function profile(slug: string) {
  const found = KONGLO_PROFILES.find((item) => item.slug === slug);
  assert.ok(found, `Profil ${slug} harus tersedia`);
  return found;
}

test("new issuer-backed mappings resolve against the dated KSEI snapshot", () => {
  const expected: Record<string, [string, number][]> = {
    "sri-prakash-lohia": [["INDR", 67.28]],
    "lim-hariyanto-wijaya-sarwono": [["NCKL", 79.79], ["CITA", 60.46], ["TIRT", 71.13]],
    "theodore-rachmat": [["AADI", 3.48], ["DSNG", 28.63]],
    "chairul-tanjung": [["MEGA", 58.02], ["BBHI", 60.88]],
    "susilo-wonowidjojo-family": [["GGRM", 75.55]],
    "ciliandra-fangiono-family": [["ANJT", 98.38]],
    "djoko-susanto": [["AMRT", 38.9]],
    "hamami-family": [["ABMM", 53.56]],
    "soegiarto-adikoesoemo": [["AKRA", 64.63]],
    "irwan-hidayat-family": [["SIDO", 77.59]],
    "bakrie": [["BNBR", 25.31]],
    "martua-sitorus": [["CMNT", 87.37]],
    "haji-isam": [["PACK", 20.04], ["RANS", 1.4]],
    "mochtar-riady-family": [["LPKR", 20.25]],
    "arini-subianto-family": [["DSNG", 1.77]],
    "hartati-murdaya": [["MKPI", 47.45]],
    "eddy-katuari-family": [["LTLS", 3.15]],
  };

  for (const [slug, positions] of Object.entries(expected)) {
    const holdings = kongloHoldings(profile(slug));
    for (const [code, percentage] of positions) {
      assert.ok(holdings.some((holding) => holding.code === code && Math.abs((holding.percentage ?? 0) - percentage) < 0.0001), `${slug}: ${code} ${percentage}%`);
    }
  }
});

test("profiles with missing data retain sourced context without overstating ownership", () => {
  const dewi = kongloHoldings(profile("dewi-kam"));
  assert.ok(dewi.some((holding) => holding.code === "BYAN" && holding.percentage === null && holding.indicativeValue === null));

  for (const slug of ["bachtiar-karim-family", "sukanto-tanoto", "putera-sampoerna-family", "sulistyo-family", "husain-djojonegoro-family"]) {
    assert.equal(kongloHoldings(profile(slug)).length, 0, `${slug} tidak boleh mendapat ticker tanpa bukti posisi terkini`);
  }

  for (const slug of ["dewi-kam", "bachtiar-karim-family", "sukanto-tanoto", "martua-sitorus", "putera-sampoerna-family", "sulistyo-family", "husain-djojonegoro-family"]) {
    assert.ok((profile(slug).researchSources?.length ?? 0) > 0, `${slug} harus memiliki sumber audit`);
  }
});

test("all 50 dated Forbes ranks are unique and every legal holder resolves to its issuer row", () => {
  const ranked = KONGLO_PROFILES.filter((item) => item.rank !== undefined);
  assert.deepEqual(ranked.map((item) => item.rank), Array.from({ length: 50 }, (_, index) => index + 1));
  assert.equal(new Set(KONGLO_PROFILES.map((item) => item.slug)).size, KONGLO_PROFILES.length);

  for (const person of KONGLO_PROFILES) {
    const holdings = kongloHoldings(person);
    for (const relation of person.groupExposure ?? []) {
      for (const holderName of relation.holderNames ?? []) {
        assert.ok(shareholdersFor(relation.code).some((row) => row.name.toUpperCase() === holderName.toUpperCase()),
          `${person.name}: ${relation.code} / ${holderName} hilang dari snapshot KSEI`);
      }
    }
    for (const holding of holdings) {
      assert.ok(holding.percentage === null || holding.percentage > 0 && holding.percentage <= 100,
        `${person.name}: persentase ${holding.code} tidak valid`);
      assert.ok(holding.indicativeValue === null || holding.priceAsOf,
        `${person.name}: nilai ${holding.code} tanpa tanggal kapitalisasi`);
    }
  }
});

test("direct and group holdings stay separate from Forbes net worth", () => {
  for (const slug of ["haji-isam", "bakrie"]) {
    const person = profile(slug);
    assert.equal(person.netWorthUsd, undefined);
    const summary = kongloPortfolioSummary(kongloHoldings(person));
    assert.ok((summary.groupValue ?? 0) > 0);
  }
  const agoes = kongloHoldings(profile("agoes-projosasmito"));
  assert.ok(agoes.some((holding) => holding.code === "AMMN" && holding.kind === "direct" && holding.percentage === 0.3988));
  assert.ok(agoes.some((holding) => holding.code === "AMMN" && holding.kind === "group" && holding.percentage === 15.45));
});
