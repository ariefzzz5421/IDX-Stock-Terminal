# Konglo data and coverage

The page starts with all 50 entries and USD net-worth estimates in Forbes Indonesia's **10 December 2025** list. Those historical estimates are not live wealth or a sum of listed holdings. The displayed rupiah estimate converts the Forbes figure using the dated Bank Indonesia JISDOR reference in `lib/konglo-format.ts`.

Listed-share positions use the BEI/KSEI ownership snapshot dated **30 September 2026** (`data/shareholders-2026-09.json`). It reports named holders at or above 1%. An absent row is **unknown**, not evidence that someone owns no listed shares. A few smaller positions are added only when an issuer report gives the amount and date explicitly. Group companies and personal positions are displayed separately; overlapping companies must not be added together as someone's net worth.

The official BEI XLSX returned HTTP 403 to the automated reader during this update, so the embedded September snapshot was audited but could not be refreshed directly. The page must not claim October ownership coverage from that file.

Additional issuer-verified mappings in this update:

| Forbes person or family | Listed stock | Evidence |
| --- | --- | --- |
| Jogi Hendra Atmadja | MYOR | Mayora 2025 annual report; September 2026 BEI/KSEI snapshot |
| Bambang Sutantio | CMRY | Cimory 2025 annual report; BEI/KSEI snapshot |
| Manoj Punjabi (Manoj Dhamoo Punjabi) | FILM | MD Entertainment rights-issue disclosure; BEI/KSEI snapshot |
| Eddy Kusnadi Sariaatmadja | EMTK | EMTEK 2025 annual report; BEI/KSEI snapshot |
| Ciputra family, through PT Sang Pelopor | CTRA | Ciputra Development 2025 annual report; BEI/KSEI snapshot |
| Peter Sondakh, through PT Rajawali Capital International | BWPT | Eagle High Plantations 2025 prospectus; BEI/KSEI snapshot |
| Setiawan family, through PT Santa Seha Sanadi | KLBF | Kalbe 2024 annual report for the relationship; BEI/KSEI snapshot for current registered holding |
| Hilmi Panigoro | MEDC | MedcoEnergi 2025 annual report, dated personal stake of 0.15% |
| Jenny Quantero and Engki Wibowo | BYAN, MYOH | Separate named positions in the BEI/KSEI snapshot; combined only within the joint Forbes profile |

Each profile links the original ownership document and, where a name differs from the registered shareholder name, the issuer document used to verify identity. Other Forbes profiles with no verified mapped holding show an explicit coverage gap. No current net worth is invented for the Haji Isam or Bakrie family highlights because they have no comparable entry in the Forbes 2025 top-50 list.

Foreign-flow transaction data and its API are intentionally marked **Coming soon** until a licensed, verifiable daily buy/sell feed is connected. MSCI/FTSE benchmark weights and ETF AUM remain available, and neither is used as a proxy for trading flow.
