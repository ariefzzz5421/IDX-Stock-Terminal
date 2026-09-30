"use client";

import { useState } from "react";

// Logos were verified on 30 Sep 2026. Operator sites are preferred; SpaceDC,
// BDx and MettaDC use reputable published brand images because their own sites
// did not serve a usable small logo. The fallback avoids broken image tiles.
// This tiny map avoids bundling the full 978-issuer catalogue.
const OPERATOR_LOGOS: Record<string, string> = {
  "NTT Global Data Centers": "https://services.global.ntt/-/media/ntt/global/icons/brand/ntt_data_favicon_future_blue_png.png",
  NeutraDC: "https://www.neutradc.com/build/assets/logo-fav-DYf1wdhl.webp",
  "Princeton Digital Group": "https://princetondg.com/wp-content/uploads/2026/08/PDG-logo_cropped.webp",
  "Digital Edge Indonesia": "https://www.digitaledgedc.com/wp-content/uploads/2024/06/favicon-32x32-1.png",
  SpaceDC: "https://media.datacenterdynamics.com/media/images/SPACE_LOGO_HORIZONTAL_W1.2e16d0ba.fill-279x140.jpg",
  "Equinix / Astra JV": "https://newsroom.equinix.com/images/favicon-128.png",
  "BDx Indonesia": "https://mma.prnewswire.com/media/2167334/BDx_Data_Centers_Logo.jpg",
  "Biznet Data Center": "https://www.biznetdatacenter.com/wp-content/uploads/2024/09/biznet-data-center-favicon.png",
  MettaDC: "https://cdn.baxtel.com/data-centers/mettadc/logo/mettadc-logo..jpg",
  ZanKore: "https://cdn.prod.website-files.com/6a6896179801b6c9ce976a27/6a75cd2c6c05667ca4b240d2_zankore-fav-icon%5B512*512%5D.png",
};
const ISSUER_LOGOS: Record<string, string> = {
  BUMI: "https://bumiresources.com/assets/img/bumi-logo-new.png",
  AADI: "https://www.adaroindonesia.com/theme/images/Logo-Adaro-Andalan-Indonesia-Color.png",
  BYAN: "https://s3-symbol-logo.tradingview.com/bayan-resources-tbk--big.svg",
  GEMS: "https://s3-symbol-logo.tradingview.com/golden-energy--big.svg",
  PTBA: "https://s3-symbol-logo.tradingview.com/bukit-asam-tbk--big.svg",
  INDY: "https://s3-symbol-logo.tradingview.com/indika-energy--big.svg",
  ITMG: "https://s3-symbol-logo.tradingview.com/indo-tambangraya-megah--big.svg",
  BSSR: "https://s3-symbol-logo.tradingview.com/baramulti-suksessarana-tbk--big.svg",
  UNTR: "https://s3-symbol-logo.tradingview.com/united-tractors--big.svg",
  MCOL: "https://s3-symbol-logo.tradingview.com/prima-andalan-mandiri-tbk--big.svg",
  DCII: "https://s3-symbol-logo.tradingview.com/dci-indonesia-tbk--big.svg",
  TLKM: "https://s3-symbol-logo.tradingview.com/telekom-indonesia--big.svg",
  ASII: "https://s3-symbol-logo.tradingview.com/astra-international--big.svg",
  ISAT: "https://s3-symbol-logo.tradingview.com/indosat--big.svg",
};

export function BusinessCompanyLogo({ company, ticker }: { company: string; ticker?: string }) {
  const [failed, setFailed] = useState(false);
  const operatorLogo = OPERATOR_LOGOS[company] ?? (ticker ? ISSUER_LOGOS[ticker] : undefined);

  if (operatorLogo && !failed) {
    // Operator-owned URLs are outside the fixed Next image host allowlist.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={operatorLogo} alt={`${company} logo`} width={32} height={32} loading="lazy" onError={() => setFailed(true)} className="h-8 w-8 shrink-0 border border-rule bg-white object-contain p-0.5" />;
  }

  return <span aria-label={`${company} · logo tidak tersedia`} title="Logo belum tersedia" className="grid h-8 w-8 shrink-0 place-items-center border border-rule-hi bg-panel-hi text-micro font-bold text-cyan">{company.slice(0, 2).toUpperCase()}</span>;
}
