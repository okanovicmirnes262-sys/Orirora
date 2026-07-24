# ORDIORA — landing page

Samostalna, dvojezična (HR/EN) marketinška stranica za ORDIORA. Jedna datoteka
(`index.html`) — sve je uključeno, ništa se izvana ne učitava.

## Deploy na Vercel (auto-update)

Napravi **novi Vercel projekt** (odvojen od aplikacije) povezan na ovaj repo:

1. Vercel → **Add New… → Project → Import** `okanovicmirnes262-sys/Orirora`
2. **Root Directory:** `landing`
3. **Framework Preset:** `Other` (statična stranica, bez builda)
4. **Production Branch:** grana koju želiš pratiti
5. **Deploy**

Nakon toga svaki `push` na tu granu automatski pokreće novi deploy (~1–2 min).

Za promjene: uredi `landing/index.html`, commitaj i pushaj.
