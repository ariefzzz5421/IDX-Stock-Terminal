import assert from "node:assert/strict";
import test from "node:test";
import { KONGLO_PROFILES, kongloHoldings, kongloPortfolioSummary } from "../lib/konglo";

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
  };

  for (const [slug, positions] of Object.entries(expected)) {
    const holdings = kongloHoldings(profile(slug));
    for (const [code, percentage] of positions) {
      assert.ok(holdings.some((holding) => holding.code === code && Math.abs((holding.percentage ?? 0) - percentage) < 0.0001), `${slug}: ${code} ${percentage}%`);
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
