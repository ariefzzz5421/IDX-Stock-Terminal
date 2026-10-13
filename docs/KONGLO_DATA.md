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

## 13 October 2026 Konglo audit

The page now maps additional registered holders to Forbes people/families using issuer or group documents. The KSEI percentages below are **registered holdings of the named legal entity**, not automatically the person's beneficial percentage:

| Profile | New BEI ticker mapping | Relationship evidence |
| --- | --- | --- |
| Sri Prakash Lohia | INDR | Indorama Corporation identifies Indo-Rama Synthetics as its subsidiary; Lohia is group chairman. |
| Lim Hariyanto | NCKL, CITA, TIRT | [Harita Nickel annual report](https://api.tbpnickel.com/storage/images/PDF/laporan%20tahunan%202024/Harita%20Nickel%202024%20Annual%20Report.pdf) traces Lim family to PT Harita Jayaraya. |
| Theodore Permadi Rachmat | AADI, ADRO, ASSA, DSNG, TAPG direct; ASSA, DRMA, DSNG, TAPG through PT Triputra Investindo Arya | [Triputra group history](https://triputra-group.com/tentang-kami/profil/) confirms founder and legal entity; KSEI lists the abbreviated personal name `T PERMADI RACHMAT`. |
| Chairul Tanjung | MEGA, BBHI | [Bank Mega investor relations](https://bankmega.com/id/tentang-kami/hubungan-investor-new/) confirms Chairul family's CT Corpora → Mega Corpora structure. |
| Susilo Wonowidjojo family | GGRM | [Gudang Garam company page](https://gudanggaramtbk.com/tentang-kami/) confirms Susilo's connection to Suryaduta and Suryamitra. His reported 19.85% of Suryaduta must not be confused with Suryaduta's 69.29% of GGRM. |
| Ciliandra Fangiono family | ANJT | [ANJT 2025 report](https://www.first-resources.com/wp-content/uploads/2026/06/ANJ-AR-SR-2025.pdf) links First Resources, Ciliandra Perkasa, and the Fangiono family trust; each beneficiary's economic share is undetermined. |
| Djoko Susanto family | AMRT | [Alfamart annual report](https://alfamart.co.id/storage/annual-report/July2025/zkhkrsugc3gCo4L4NSh9.pdf) identifies family affiliation with PT Sigmantara Alfindo. |
| Hamami family | ABMM | [ABM Investama 2025 report](https://www.abm-investama.com/upload/2025_ABMM_AR_2025.pdf) identifies PT Tiara Marga Trakindo and Hamami family positions. |
| Soegiarto Adikoesoemo | AKRA | [AKR governance page](https://www.akr.co.id/gcg/gcg-organs/board-of-commissioners) identifies his interest in PT Arthakencana Rayatama. |
| Irwan Hidayat family | SIDO | [Sido Muncul 2024 report](https://investor.sidomuncul.co.id/misc/ar/AR-2024.pdf) traces the family to PT Hotel Candi Baru. |
| Agoes Projosasmito and Alexander Ramlie | AMMN | [AMMN 2025 financial statements](https://www.amman.co.id/rails/active_storage/blobs/proxy/eyJfcmFpbHMiOnsiZGF0YSI6NDk4MiwicHVyIjoiYmxvYl9pZCJ9fQ%3D%3D--f967e5138cdb0cb5fbcc19b1c35a4a0a4c27bbcd/FY%202025%20FINANCIAL%20STATEMENTS.pdf?disposition=inline) report direct holdings below the KSEI 1% threshold. Agoes's reported ties to MEDC, BUMI, and BRMS remain unvalued until current percentages are verified. |
| Bakrie family | BNBR | BNBR's own 2025 integrated report identifies PT Bakrie Capital Indonesia; the KSEI snapshot reports its registered BNBR holding. |

The highlight cards now show the **separate indicative values** of direct shares and shares held by connected entities for Haji Isam and the Bakrie family. Values are derived from available KSEI percentages and the catalog's dated market caps. Some group positions cannot be valued, and summing holding-company and subsidiary stakes can double count economic exposure. For that reason the cards never call those figures personal net worth. [Bisnis.com's 21 September 2026 portfolio analysis](https://market.bisnis.com/read/20260921/192/2005815/deretan-portofolio-bisnis-haji-isam-dari-sawit-pertambangan-hingga-transportasi) independently estimated roughly Rp83.9 trillion in **related listed equity at 17 September prices**, which is also not personal net worth. The app's current indicative amount can differ because the price and ownership dates differ.

Foreign-flow transaction data and its API are intentionally marked **Coming soon** until a licensed, verifiable daily buy/sell feed is connected. MSCI/FTSE benchmark weights and ETF AUM remain available, and neither is used as a proxy for trading flow.
