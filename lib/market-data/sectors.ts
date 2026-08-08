/**
 * IDX-IC sector for the liquid names. Yahoo's screener doesn't return a
 * sector, so this fills it in for the tickers most likely to be looked at;
 * everything else stays null until a better source turns up.
 */
export const CURATED_SECTORS: Record<string, string> = {
  // Financials
  BBCA: "Financials", BBRI: "Financials", BMRI: "Financials", BBNI: "Financials",
  BBTN: "Financials", BRIS: "Financials", ARTO: "Financials", BTPS: "Financials",
  BFIN: "Financials", SRTG: "Financials", PNLF: "Financials", BJBR: "Financials",
  BJTM: "Financials", BNGA: "Financials", NISP: "Financials", PNBN: "Financials",
  BBKP: "Financials", MEGA: "Financials", BNLI: "Financials", ADMF: "Financials",

  // Energy
  ADRO: "Energy", PTBA: "Energy", ITMG: "Energy", PGAS: "Energy", MEDC: "Energy",
  AKRA: "Energy", BREN: "Energy", CUAN: "Energy", RAJA: "Energy", INDY: "Energy",
  HRUM: "Energy", ELSA: "Energy", DOID: "Energy", BUMI: "Energy", BYAN: "Energy",
  GEMS: "Energy", TOBA: "Energy", DSSA: "Energy", MBAP: "Energy", PTRO: "Energy",

  // Basic Materials
  ANTM: "Basic Materials", INCO: "Basic Materials", TINS: "Basic Materials",
  MDKA: "Basic Materials", AMMN: "Basic Materials", INTP: "Basic Materials",
  SMGR: "Basic Materials", BRPT: "Basic Materials", TPIA: "Basic Materials",
  ESSA: "Basic Materials", INKP: "Basic Materials", TKIM: "Basic Materials",
  NCKL: "Basic Materials", MBMA: "Basic Materials", ARCI: "Basic Materials",
  PSAB: "Basic Materials", SMBR: "Basic Materials", AVIA: "Basic Materials",

  // Consumer Non-Cyclicals
  UNVR: "Consumer Non-Cyclicals", ICBP: "Consumer Non-Cyclicals",
  INDF: "Consumer Non-Cyclicals", MYOR: "Consumer Non-Cyclicals",
  GGRM: "Consumer Non-Cyclicals", HMSP: "Consumer Non-Cyclicals",
  AMRT: "Consumer Non-Cyclicals", CPIN: "Consumer Non-Cyclicals",
  JPFA: "Consumer Non-Cyclicals", AALI: "Consumer Non-Cyclicals",
  LSIP: "Consumer Non-Cyclicals", ULTJ: "Consumer Non-Cyclicals",
  ROTI: "Consumer Non-Cyclicals", DSNG: "Consumer Non-Cyclicals",
  TBLA: "Consumer Non-Cyclicals", SSMS: "Consumer Non-Cyclicals",
  MIDI: "Consumer Non-Cyclicals", CLEO: "Consumer Non-Cyclicals",

  // Consumer Cyclicals
  MAPI: "Consumer Cyclicals", ACES: "Consumer Cyclicals", ERAA: "Consumer Cyclicals",
  SCMA: "Consumer Cyclicals", MNCN: "Consumer Cyclicals", MAPA: "Consumer Cyclicals",
  ASRI: "Consumer Cyclicals", LPPF: "Consumer Cyclicals", RALS: "Consumer Cyclicals",
  PZZA: "Consumer Cyclicals", FAST: "Consumer Cyclicals", CSAP: "Consumer Cyclicals",

  // Healthcare
  KLBF: "Healthcare", MIKA: "Healthcare", SIDO: "Healthcare", HEAL: "Healthcare",
  SILO: "Healthcare", PRDA: "Healthcare", KAEF: "Healthcare", INAF: "Healthcare",
  PEHA: "Healthcare", SAME: "Healthcare",

  // Industrials
  ASII: "Industrials", UNTR: "Industrials", ARNA: "Industrials", IMPC: "Industrials",
  KRAS: "Industrials", GJTL: "Industrials", SMSM: "Industrials", AUTO: "Industrials",
  MARK: "Industrials", HEXA: "Industrials",

  // Technology
  GOTO: "Technology", BUKA: "Technology", EMTK: "Technology", DCII: "Technology",
  MTDL: "Technology", MLPT: "Technology", WIFI: "Technology", EDGE: "Technology",
  TOSK: "Technology", KIOS: "Technology",

  // Infrastructures
  TLKM: "Infrastructures", ISAT: "Infrastructures", EXCL: "Infrastructures",
  TOWR: "Infrastructures", TBIG: "Infrastructures", JSMR: "Infrastructures",
  WIKA: "Infrastructures", PTPP: "Infrastructures", ADHI: "Infrastructures",
  WSKT: "Infrastructures", WTON: "Infrastructures", META: "Infrastructures",
  IPCC: "Infrastructures", PGEO: "Infrastructures",

  // Properties & Real Estate
  BSDE: "Properties & Real Estate", CTRA: "Properties & Real Estate",
  PWON: "Properties & Real Estate", SMRA: "Properties & Real Estate",
  PANI: "Properties & Real Estate", LPKR: "Properties & Real Estate",
  DMAS: "Properties & Real Estate", MTLA: "Properties & Real Estate",
  APLN: "Properties & Real Estate", BEST: "Properties & Real Estate",

  // Transportation & Logistic
  ASSA: "Transportation & Logistic", BIRD: "Transportation & Logistic",
  SMDR: "Transportation & Logistic", TMAS: "Transportation & Logistic",
  GIAA: "Transportation & Logistic", IPCM: "Transportation & Logistic",
  NELY: "Transportation & Logistic", HAIS: "Transportation & Logistic",
};
