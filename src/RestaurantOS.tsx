import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Bell, Sun, Moon, Home, CalendarDays, Clock, MessageSquare,
  BarChart3, Users, ChevronRight, ChevronLeft, Plus, Check, LogOut,
  ChefHat, UtensilsCrossed, Phone, Mail, User as UserIcon, LayoutGrid,
  Settings as SettingsIcon, ArrowDownRight, Wine, MoreHorizontal,
  CircleUser, Loader2, ChevronDown, Trash2, Copy, CheckCircle2, Store,
  KeyRound, Search, Eye, EyeOff, Pencil,
  ShoppingCart, Upload, Download, Minus, FileText, Image as ImageIcon
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar,
  CartesianGrid, Cell
} from "recharts";
import { supabase, isSupabaseConfigured, KV_TABLE } from "./supabaseClient";

/* ------------------------------------------------------------------ */
/*  i18n — Hrvatski / English                                          */
/* ------------------------------------------------------------------ */
/* `tr("English text")` returns the Croatian translation when the language is
   set to "hr", otherwise the English source. Missing keys fall back to English,
   so the UI is never broken — only untranslated. App sets LANG each render.
   Named `tr` (not `t`) because `t` is used throughout as a loop variable for
   tables and time, which would shadow the translator inside those callbacks. */
let LANG = "hr";

const HR = {
  // — Auth / login / recovery —
  "Sign in to your restaurant.": "Prijavite se u svoj restoran.",
  "Reset your password.": "Ponovno postavite lozinku.",
  "Restaurant name": "Naziv restorana",
  "Your exact restaurant name": "Točan naziv vašeg restorana",
  "Password": "Lozinka",
  "Remember me on this device": "Zapamti me na ovom uređaju",
  "Sign in": "Prijava",
  "Signing in…": "Prijavljivanje…",
  "Forgot password?": "Zaboravljena lozinka?",
  "New team member? Ask your restaurant owner for your login — they'll share your password with you.": "Novi ste član tima? Zatražite od vlasnika svoje podatke za prijavu — podijelit će vam lozinku.",
  "or": "ili",
  "Set up a new restaurant": "Postavi novi restoran",
  "Enter your restaurant name and the recovery code you saved when you set up the restaurant, then choose a new owner password.": "Unesite naziv restorana i kod za oporavak koji ste spremili pri postavljanju, zatim odaberite novu lozinku vlasnika.",
  "Recovery code": "Kod za oporavak",
  "New password": "Nova lozinka",
  "At least 6 characters": "Najmanje 6 znakova",
  "Confirm new password": "Potvrdite novu lozinku",
  "Repeat password": "Ponovite lozinku",
  "Reset password": "Ponovno postavi lozinku",
  "Resetting…": "Postavljanje…",
  "Back to sign in": "Natrag na prijavu",
  "Incorrect restaurant name or password.": "Netočan naziv restorana ili lozinka.",
  "Enter your restaurant name and password.": "Unesite naziv restorana i lozinku.",
  "Password updated — you can sign in now.": "Lozinka je ažurirana — sada se možete prijaviti.",
  "Enter your restaurant name and recovery code.": "Unesite naziv restorana i kod za oporavak.",
  "New password must be at least 6 characters.": "Nova lozinka mora imati najmanje 6 znakova.",
  "New passwords don't match.": "Nove lozinke se ne podudaraju.",
  "Couldn't reset the password.": "Nije moguće ponovno postaviti lozinku.",
  "No restaurant found with that name.": "Nije pronađen restoran s tim nazivom.",
  "This restaurant has no recovery code set.": "Ovaj restoran nema postavljen kod za oporavak.",
  "Incorrect recovery code.": "Netočan kod za oporavak.",
  "No owner account found.": "Nije pronađen vlasnički račun.",
  "New reservation:": "Nova rezervacija:",
  "That password is already in use by a staff account. Choose a different one.": "Ta lozinka se već koristi za račun osoblja. Odaberite drugu.",

  // — Setup wizard —
  "Let's set up your restaurant.": "Postavimo vaš restoran.",
  "Restaurant": "Restoran",
  "Your account": "Vaš račun",
  "Tables": "Stolovi",
  "All restaurants": "Svi restorani",
  "Your restaurant": "Vaš restoran",
  "Enter your restaurant's name": "Unesite naziv restorana",
  "e.g. Rosemary & Rye": "npr. Ružmarin & Raž",
  "This appears on staff logins and reports.": "Prikazuje se pri prijavi osoblja i u izvještajima.",
  "Create your owner account": "Izradite vlasnički račun",
  "Full name": "Ime i prezime",
  "Your name": "Vaše ime",
  "Enter your name": "Unesite svoje ime",
  "Email": "E-mail",
  "you@email.com": "vi@email.com",
  "Enter a valid email": "Unesite ispravan e-mail",
  "Confirm password": "Potvrdite lozinku",
  "Passwords don't match": "Lozinke se ne podudaraju",
  "Add your tables": "Dodajte stolove",
  "Optional — add them all at once, group by section, or skip and do this later in Settings.": "Neobavezno — dodajte ih sve odjednom, grupirajte po sekcijama ili preskočite i učinite to kasnije u Postavkama.",
  "Back": "Natrag",
  "Next": "Dalje",
  "Finish setup": "Završi postavljanje",
  "Setting up…": "Postavljanje…",
  "Save your recovery code": "Spremite kod za oporavak",
  "If you ever forget your password, this code lets you reset it on the sign-in screen. Store it somewhere safe — you can view it again anytime in Settings.": "Ako ikad zaboravite lozinku, ovim kodom je možete ponovno postaviti na ekranu za prijavu. Spremite ga na sigurno — uvijek ga možete ponovno vidjeti u Postavkama.",
  "Copy code": "Kopiraj kod",
  "Copied": "Kopirano",
  "I've saved it": "Spremio sam",

  // — Config screen —
  "Connect your Supabase backend to get started.": "Povežite Supabase pozadinu za početak.",
  "Set up in 5 steps": "Postavljanje u 5 koraka",
  "Full instructions are in the project README. Use only the public anon key here — never the service_role key.": "Potpune upute su u README datoteci projekta. Ovdje koristite samo javni anon ključ — nikada service_role ključ.",
  "Couldn't load this restaurant's data. Check your connection and try again.": "Nije moguće učitati podatke restorana. Provjerite vezu i pokušajte ponovno.",
  "Retry": "Pokušaj ponovno",
  "Sign out": "Odjava",

  // — Nav / top —
  "Home": "Početna",
  "Bookings": "Rezervacije",
  "Chat": "Chat",
  "Analytics": "Analitika",
  "More": "Više",
  "Notifications": "Obavijesti",
  "You're all caught up.": "Sve je pregledano.",

  // — Dashboard —
  "Good day,": "Dobar dan,",
  "Live": "Uživo",
  "Dashboard": "Nadzorna ploča",
  "TODAY'S RESERVATIONS": "DANAŠNJE REZERVACIJE",
  "TODAY'S GUESTS": "DANAŠNJI GOSTI",
  "ACTIVE SHIFTS": "AKTIVNE SMJENE",
  "PENDING": "NA ČEKANJU",
  "bookings today": "rezervacija danas",
  "expected covers": "očekivanih gostiju",
  "staff on duty": "osoblja na dužnosti",
  "awaiting confirmation": "čeka potvrdu",
  "Upcoming Reservations": "Nadolazeće rezervacije",
  "View all": "Prikaži sve",
  "Nothing booked yet": "Još nema rezervacija",
  "Reservations you take today will show up here.": "Rezervacije koje danas zaprimite prikazat će se ovdje.",
  "New reservation": "Nova rezervacija",
  "Quick Actions": "Brze radnje",
  "New Reservation": "Nova rezervacija",
  "Book a table for a guest": "Rezerviraj stol za gosta",
  "View All Reservations": "Prikaži sve rezervacije",
  "Check today's bookings": "Pregledaj današnje rezervacije",
  "Staff Shifts": "Smjene osoblja",
  "View weekly schedule": "Prikaži tjedni raspored",
  "Team Chat": "Timski chat",
  "Message your team": "Poruka timu",

  // — Reservations —
  "Reservations": "Rezervacije",
  "All upcoming table bookings.": "Sve nadolazeće rezervacije stolova.",
  "Search by guest or table": "Pretraži po gostu ili stolu",
  "Viewing only — ask the front of house to add or edit bookings.": "Samo pregled — zatražite od sale dodavanje ili uređivanje rezervacija.",
  "No reservations yet": "Još nema rezervacija",
  "Bookings you create will appear here, grouped by date.": "Rezervacije koje izradite prikazat će se ovdje, grupirane po datumu.",
  "Once the team starts booking tables, they'll show up here.": "Kad tim počne rezervirati stolove, prikazat će se ovdje.",
  "No past reservations": "Nema prošlih rezervacija",
  "Finished bookings will appear here once their time has passed.": "Završene rezervacije prikazat će se ovdje kad im prođe vrijeme.",
  "Nothing coming up": "Nema nadolazećih",
  "No active reservations right now. Finished ones move to the Past tab automatically.": "Trenutno nema aktivnih rezervacija. Završene se automatski premještaju u karticu Prošle.",
  "No matches": "Nema rezultata",
  "Try a different name, table, or status filter.": "Pokušajte s drugim imenom, stolom ili filtrom statusa.",

  // — Reservation wizard —
  "Edit Reservation": "Uredi rezervaciju",
  "Update this table booking.": "Ažurirajte ovu rezervaciju stola.",
  "Create a new table booking.": "Izradite novu rezervaciju stola.",
  "Guest": "Gost",
  "Date": "Datum",
  "Table": "Stol",
  "Review": "Pregled",
  "Guest Name": "Ime gosta",
  "Phone": "Telefon",
  "Email (optional)": "E-mail (neobavezno)",
  "guest@email.com": "gost@email.com",
  "Time": "Vrijeme",
  "Guests": "Gosti",
  "Duration (minutes)": "Trajanje (minute)",
  "No tables set up": "Nema postavljenih stolova",
  "Ask the owner to add tables under More → Settings before booking.": "Zatražite od vlasnika da doda stolove u Više → Postavke prije rezerviranja.",
  "Save changes": "Spremi promjene",
  "Confirm booking": "Potvrdi rezervaciju",
  "Delete reservation": "Obriši rezervaciju",
  "Delete this reservation?": "Obrisati ovu rezervaciju?",
  "Delete": "Obriši",
  "Cancel": "Odustani",
  "at": "u",
  "Booked at": "Zauzeto u",

  // — Shifts —
  "Shifts": "Smjene",
  "Weekly schedule and staff assignments.": "Tjedni raspored i raspored osoblja.",
  "No team members yet": "Još nema članova tima",
  "Add staff under More → Team before scheduling shifts.": "Dodajte osoblje u Više → Tim prije rasporeda smjena.",
  "Once staff are added, shifts will show up here.": "Kad se doda osoblje, smjene će se prikazati ovdje.",
  "No shifts": "Nema smjena",
  "Add shift": "Dodaj smjenu",
  "Staff member": "Član osoblja",
  "Start": "Početak",
  "End": "Kraj",

  // — Chat —
  "General": "Općenito",
  "Floor": "Sala",
  "Kitchen": "Kuhinja",
  "No messages yet": "Još nema poruka",
  "Start the conversation with your team.": "Započnite razgovor sa svojim timom.",
  "Nothing posted here yet.": "Ovdje još nema poruka.",
  "Only the owner can send messages here": "Ovdje samo vlasnik može slati poruke",
  "You": "Vi",
  "Unknown": "Nepoznato",
  "posted in": "objavio/la u",

  // — Analytics —
  "My Analytics": "Moja analitika",
  "MY SHIFTS": "MOJE SMJENE",
  "HOURS SCHEDULED": "ZAKAZANI SATI",
  "This week": "Ovaj tjedan",
  "No shifts scheduled": "Nema zakazanih smjena",
  "Check back once the owner publishes the schedule.": "Provjerite kad vlasnik objavi raspored.",
  "No data yet": "Još nema podataka",
  "Once reservations start coming in, trends and charts will appear here.": "Kad počnu stizati rezervacije, trendovi i grafovi prikazat će se ovdje.",
  "TOTAL RESERVATIONS": "UKUPNO REZERVACIJA",
  "TOTAL GUESTS": "UKUPNO GOSTIJU",
  "OCCUPANCY RATE": "POPUNJENOST",
  "NO-SHOWS": "NEDOLASCI",
  "Reservations Over Time": "Rezervacije kroz vrijeme",
  "Peak Hours": "Najprometniji sati",
  "Booking Status Breakdown": "Pregled statusa rezervacija",
  "Confirmed": "Potvrđeno",
  "Completed": "Završeno",
  "Cancelled": "Otkazano",
  "No-shows": "Nedolasci",

  // — Team —
  "Team": "Tim",
  "Build your team": "Izgradite svoj tim",
  "Add waiters and chefs — we'll generate their login for you.": "Dodajte konobare i kuhare — generirat ćemo im podatke za prijavu.",
  "The owner hasn't added any staff yet.": "Vlasnik još nije dodao osoblje.",
  "Add team member": "Dodaj člana tima",
  "We'll generate their email and password automatically.": "Automatski ćemo generirati e-mail i lozinku.",
  "e.g. Jane Waiter": "npr. Ana Konobar",
  "Phone (optional)": "Telefon (neobavezno)",
  "Role": "Uloga",
  "Create account": "Izradi račun",
  "added": "je dodan/a",
  "ORDIORA login for": "ORDIORA prijava za",
  "Share these login details with them — they sign in with the restaurant name and this password. You can view the password again anytime from the Team list.": "Podijelite ove podatke za prijavu s njima — prijavljuju se nazivom restorana i ovom lozinkom. Lozinku možete ponovno vidjeti u popisu Tim.",
  "RESTAURANT": "RESTORAN",
  "PASSWORD": "LOZINKA",
  "Copy details": "Kopiraj podatke",
  "Done": "Gotovo",
  "Change": "Promijeni",
  "Change password · ": "Promjena lozinke · ",
  "Set a new password and share it with them. It replaces their old one immediately.": "Postavite novu lozinku i podijelite je s njima. Odmah zamjenjuje staru.",
  "They sign in with the restaurant name and this password.": "Prijavljuju se nazivom restorana i ovom lozinkom.",
  "Generate a new one": "Generiraj novu",
  "Save password": "Spremi lozinku",
  "That password is already in use by another account.": "Ta lozinka se već koristi za drugi račun.",
  "At least 6 characters.": "Najmanje 6 znakova.",
  "Remove": "Ukloni",
  "They'll lose access immediately. This can't be undone.": "Odmah gube pristup. Ovo se ne može poništiti.",
  "(you)": "(vi)",

  // — More —
  "Order supplies": "Naruči robu",
  "Follow-ups": "Zamolbe",
  "Settings": "Postavke",
  "Dark mode": "Tamni način",
  "Light mode": "Svijetli način",
  "Switch restaurant": "Promijeni restoran",

  // — Settings —
  "Appearance": "Izgled",
  "Light": "Svijetlo",
  "Dark": "Tamno",
  "Language": "Jezik",
  "Update your restaurant's name.": "Ažurirajte naziv restorana.",
  "Save": "Spremi",
  "Google reviews": "Google recenzije",
  "Set the link guests use to leave a review — used by Follow-ups.": "Postavite poveznicu putem koje gosti ostavljaju recenziju — koristi je modul Zamolbe.",
  "Paste the review link from your Google Business Profile.": "Zalijepite poveznicu za recenziju s vašeg Google Business profila.",
  "Enter a full link starting with https://": "Unesite potpunu poveznicu koja počinje s https://",
  "Manage the tables staff can assign reservations to, grouped by section.": "Upravljajte stolovima na koje osoblje raspoređuje rezervacije, grupirano po sekcijama.",
  "If you ever forget your password, use this code on the sign-in screen (\"Forgot password?\") to set a new one. Keep it somewhere safe — anyone with it can reset the owner password.": "Ako ikad zaboravite lozinku, ovim kodom na ekranu za prijavu (\"Zaboravljena lozinka?\") postavljate novu. Čuvajte ga na sigurnom — tko god ga ima može ponovno postaviti lozinku vlasnika.",
  "Copy": "Kopiraj",
  "Regenerate": "Generiraj ponovno",
  "Generate recovery code": "Generiraj kod za oporavak",
  "Change password": "Promjena lozinke",
  "Update the password you use to sign in.": "Ažurirajte lozinku kojom se prijavljujete.",
  "Current password": "Trenutna lozinka",
  "Current password is incorrect.": "Trenutna lozinka je netočna.",
  "That password is already in use by another account. Choose a different one.": "Ta lozinka se već koristi za drugi račun. Odaberite drugu.",
  "Password updated.": "Lozinka je ažurirana.",
  "Update password": "Ažuriraj lozinku",
  "Account": "Račun",
  "Signed in as": "Prijavljeni kao",

  // — Tables manager —
  "No tables added yet.": "Još nema dodanih stolova.",
  "Seats": "Mjesta",
  "Fewer seats": "Manje mjesta",
  "More seats": "Više mjesta",
  "Add tables in bulk": "Dodaj stolove skupno",
  "Zone (optional, e.g. Patio)": "Zona (neobavezno, npr. Terasa)",
  "How many": "Koliko",
  "Seats each": "Mjesta po stolu",
  "No zone": "Bez zone",
  "Add": "Dodaj",

  // — Ordering —
  "Build a supplier order and export it as a table.": "Sastavite narudžbu za dobavljača i izvezite je kao tablicu.",
  "Import": "Uvezi",
  "Export CSV": "Izvezi CSV",
  "Select items to delete": "Odaberi stavke za brisanje",
  "selected": "odabrano",
  "All": "Sve",
  "None": "Ništa",
  "Add an item (e.g. Coca-Cola)": "Dodaj stavku (npr. Coca-Cola)",
  "No items yet": "Još nema stavki",
  "Import your goods from a menu photo or PDF, or add them one by one above.": "Uvezite robu iz fotografije menija ili PDF-a, ili je dodajte jednu po jednu iznad.",
  "Import from photo / PDF": "Uvezi iz fotografije / PDF-a",
  "in order": "u narudžbi",
  "Clear": "Očisti",
  "Remove all items?": "Ukloniti sve stavke?",
  "The selected items will be removed from your catalog and any current order.": "Odabrane stavke uklonit će se iz kataloga i trenutne narudžbe.",
  "This item will be removed from your catalog and any current order.": "Ova stavka uklonit će se iz kataloga i trenutne narudžbe.",

  // — Import modal —
  "Import items": "Uvoz stavki",
  "Snap a photo of the menu or pick a PDF — we'll read the text. Then review the list before adding.": "Uslikajte meni ili odaberite PDF — pročitat ćemo tekst. Zatim pregledajte popis prije dodavanja.",
  "Photo": "Fotografija",
  "PDF": "PDF",
  "Reading…": "Čitanje…",
  "Reading PDF…": "Čitam PDF…",
  "Reading image…": "Čitam sliku…",
  "No text found — type items manually below.": "Nije pronađen tekst — upiši artikle ručno ispod.",
  "Automatic reading failed — paste or type items manually below.": "Automatsko čitanje nije uspjelo — zalijepi ili upiši artikle ručno ispod.",
  "Items — one per line": "Stavke — jedna po retku",
  "Clean up": "Očisti",
  "Tip: paste a menu and tap \"Clean up\" to drop prices, headers and descriptions, and shorten dish names (e.g. \"Hobotnica na žaru\" → \"Hobotnica\").": "Savjet: zalijepite meni i dodirnite \"Očisti\" da uklonite cijene, naslove i opise te skratite nazive jela (npr. \"Hobotnica na žaru\" → \"Hobotnica\").",
  "Default unit": "Zadana jedinica",

  // — Follow-ups —
  "Invite guests to leave a Google review after their visit.": "Pozovite goste da nakon posjeta ostave Google recenziju.",
  "Add your Google review link so guests can leave a review.": "Dodajte poveznicu za Google recenziju kako bi gosti mogli ostaviti recenziju.",
  "No follow-ups yet": "Još nema zamolbi",
  "Guests appear here once their reservation is marked completed, so you can invite them to leave a review.": "Gosti se prikazuju ovdje kad im se rezervacija označi kao završena, pa ih možete pozvati da ostave recenziju.",
  "Review request · ": "Zamolba za recenziju · ",
  "Subject": "Predmet",
  "Message": "Poruka",
  "Open in mail": "Otvori u mailu",
  "Mark as sent": "Označi kao poslano",

  // — Statuses —
  "all": "sve",
  "past": "prošle",
  "pending": "na čekanju",
  "confirmed": "potvrđeno",
  "seated": "sjedi",
  "completed": "završeno",
  "cancelled": "otkazano",
  "no-show": "nije došao",

  // — Roles —
  "Owner": "Vlasnik",
  "Waiter": "Konobar",
  "Chef": "Kuhar",
  "Staff": "Osoblje",
};

function tr(s) {
  if (LANG !== "hr") return s;
  return Object.prototype.hasOwnProperty.call(HR, s) ? HR[s] : s;
}

/* Count-aware noun. en=[singular,plural]; hr=[1, 2–4, 5+]. */
function plural(n, en, hr) {
  const a = Math.abs(n) % 100, d = a % 10;
  if (LANG !== "hr") return Math.abs(n) === 1 ? en[0] : en[1];
  if (a > 10 && a < 20) return hr[2];
  if (d === 1) return hr[0];
  if (d >= 2 && d <= 4) return hr[1];
  return hr[2];
}

/* ------------------------------------------------------------------ */
/*  Responsive breakpoints                                             */
/* ------------------------------------------------------------------ */
/* The whole UI is inline-styled, so there are no CSS media queries — layout
   adapts through this hook instead. Returns "mobile" | "tablet" | "desktop"
   and re-renders any component that uses it when the viewport crosses 768px or
   1024px. Any component may call it directly, so no prop drilling is needed. */
function readBreakpoint() {
  if (typeof window === "undefined" || !window.matchMedia) return "mobile";
  if (window.matchMedia("(min-width: 1024px)").matches) return "desktop";
  if (window.matchMedia("(min-width: 768px)").matches) return "tablet";
  return "mobile";
}
function useBreakpoint() {
  const [bp, setBp] = useState(readBreakpoint);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mqls = [
      window.matchMedia("(min-width: 1024px)"),
      window.matchMedia("(min-width: 768px)"),
    ];
    const onChange = () => setBp(readBreakpoint());
    mqls.forEach((m) => m.addEventListener?.("change", onChange));
    onChange();
    return () => mqls.forEach((m) => m.removeEventListener?.("change", onChange));
  }, []);
  return bp;
}

/* ------------------------------------------------------------------ */
/*  Design tokens                                                      */
/* ------------------------------------------------------------------ */

/* Monochrome system tuned to the ORDIORA logo: warm off-white paper,
   graphite ink, and a single graded-grey scale. The accent keys keep their
   names for compatibility but all resolve to greys so the UI reads mono.
   `accent` is the one restrained near-black used sparingly for emphasis. */
const PALETTE = {
  light: {
    bg: "#F4F3F0", surface: "#FFFFFF", surfaceAlt: "#F6F5F2",
    border: "#E6E4DE", borderStrong: "#D6D4CC",
    text: "#2B2B2B", textSub: "#6E6E6B", textFaint: "#A6A5A0",
    accent: "#2B2B2B",
    green: "#3A3A38", blue: "#4A4A48", amber: "#5C5C58", rose: "#7A7A75", violet: "#454543",
    cta: "#2B2B2B", ctaText: "#FBFAF7", inputBg: "#F3F2EE",
    shadow: "0 1px 2px rgba(30,30,28,0.03), 0 10px 30px -16px rgba(30,30,28,0.12)",
  },
  dark: {
    bg: "#111110", surface: "#1A1A19", surfaceAlt: "#212120",
    border: "#2E2E2C", borderStrong: "#3A3A38",
    text: "#EDEBE6", textSub: "#9C9B96", textFaint: "#63625E",
    accent: "#EDEBE6",
    green: "#C9C7C1", blue: "#B4B2AC", amber: "#A09E98", rose: "#88867F", violet: "#D0CEC8",
    cta: "#EDEBE6", ctaText: "#151513", inputBg: "#232322",
    shadow: "0 1px 2px rgba(0,0,0,0.4), 0 14px 34px -16px rgba(0,0,0,0.7)",
  },
};

const ROLE_META = {
  owner: { label: "Owner", accentKey: "accent", icon: CircleUser },
  waiter: { label: "Waiter", accentKey: "textSub", icon: Wine },
  chef: { label: "Chef", accentKey: "textSub", icon: ChefHat },
};

// Safe lookup — a stale/unknown role from cloud data must not crash the UI.
function roleMeta(role) {
  return ROLE_META[role] || { label: role || "Staff", accentKey: "textFaint", icon: CircleUser };
}

const fontStack = () => ({
  display: "'Cormorant Garamond', 'Fraunces', 'Georgia', serif",
  body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
});

/* --- ORDIORA wordmark + ring logo (SVG, matches the uploaded mark) --- */
function OrdioraLogo({ c, size = 120, color, showText = true }) {
  const stroke = color || c.text;
  const id = "orclip" + Math.round(size);
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" style={{ display: "block" }}>
      {/* full ring with a small open gap at lower-left — the ring is the "O",
         so the wordmark inside reads "RDIORA" (= ORDIORA) */}
      <circle
        cx="100" cy="100" r="83" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round"
        strokeDasharray="486 35" strokeDashoffset="-70" transform="rotate(90 100 100)" opacity="0.92"
      />
      {showText && (
        <text x="101" y="111" textAnchor="middle" fontFamily="'Cormorant Garamond', 'Georgia', serif"
          fontSize="32" letterSpacing="3" fill={stroke} style={{ fontWeight: 500 }}>
          RDIORA
        </text>
      )}
      {/* the signature dot */}
      <circle cx="100" cy="147" r="4.6" fill={stroke} />
    </svg>
  );
}

/* Compact ring-only monogram for headers / nav */
function OrdioraMark({ c, size = 34, color }) {
  const stroke = color || c.text;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={{ display: "block" }}>
      {/* full ring (the "O") with a small gap at lower-left + signature dot */}
      <circle cx="20" cy="20" r="16.5" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"
        strokeDasharray="97 7" strokeDashoffset="-14" transform="rotate(90 20 20)" />
      <circle cx="20" cy="29" r="1.5" fill={stroke} />
    </svg>
  );
}

const STATUS_LIST = ["pending", "confirmed", "seated", "completed", "cancelled", "no-show"];

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

const uid = () => Math.random().toString(36).slice(2, 10);

/* Copy to clipboard; resolves only if it actually succeeded (writeText is async
   and is undefined on insecure/unsupported contexts) so the UI never falsely
   claims "Copied". */
function copyToClipboard(text) {
  try {
    const p = navigator.clipboard && navigator.clipboard.writeText(String(text == null ? "" : text));
    return p && typeof p.then === "function" ? p : Promise.reject(new Error("no clipboard"));
  } catch (e) {
    return Promise.reject(e);
  }
}

function initials(name) {
  return (name || "?").split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function slugify(str) {
  return (str || "restaurant").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "").slice(0, 20) || "restaurant";
}

/* Generates a unique workspace slug for a new restaurant, checked against
   every slug already registered in this artifact. */
function generateSlug(name, existingSlugs) {
  const base = slugify(name);
  const taken = new Set(existingSlugs);
  let candidate = base;
  let n = 1;
  while (taken.has(candidate)) {
    n += 1;
    candidate = `${base}-${n}`;
  }
  return candidate;
}

function generateEmail(name, restaurantSlug, existing) {
  const parts = name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/).filter(Boolean);
  const local = (parts.length > 1 ? parts[0] + "." + parts[parts.length - 1] : parts[0] || "team").replace(/[^a-z0-9.]/g, "");
  const domain = (restaurantSlug || "restaurant") + ".com";
  let candidate = `${local}@${domain}`;
  let n = 1;
  const taken = new Set(existing.map((a) => a.email));
  while (taken.has(candidate)) {
    n += 1;
    candidate = `${local}${n}@${domain}`;
  }
  return candidate;
}

function generatePassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/* A restaurant-level recovery code the owner saves to reset their own password
   if it's forgotten (no email server, so this is the fallback). Grouped for
   readability; compared without the dash. */
function generateRecoveryCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out.slice(0, 4) + "-" + out.slice(4);
}

/* Normalise a recovery code for comparison (case-insensitive, ignore dashes/spaces). */
function normalizeCode(s) {
  return (s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function canPost(channel, role) {
  if (channel === "general") return true;
  if (channel === "floor") return role === "owner";
  if (channel === "kitchen") return role === "owner" || role === "chef";
  return false;
}

function statusColor(c, status) {
  switch (status) {
    case "confirmed": return c.green;
    case "pending": return c.amber;
    case "seated": return c.blue;
    case "completed": return c.blue;
    case "cancelled": return c.rose;
    case "no-show": return c.rose;
    default: return c.textFaint;
  }
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return dateStr || "";
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${days[d.getDay()].toUpperCase()}, ${months[d.getMonth()]} ${d.getDate()}`;
}

/* Local calendar date as YYYY-MM-DD — use for date KEYS (shift day, "today"),
   never toISOString(), which shifts to the previous day in UTC+ timezones. */
function localDateIso(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function staffById(list, id) {
  return list.find((s) => s.id === id);
}

function timeToMinutes(t) {
  const [h, m] = (t || "0:0").split(":").map(Number);
  return h * 60 + m;
}

function isOverlapping(aStart, aDur, bStart, bDur) {
  const aS = timeToMinutes(aStart), aE = aS + (Number(aDur) || 0);
  const bS = timeToMinutes(bStart), bE = bS + (Number(bDur) || 0);
  return aS < bE && bS < aE;
}

function relativeTime(ts) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}

/* Absolute end instant of a reservation = date + time + duration minutes.
   Uses a real Date (handles cross-midnight); returns NaN for malformed data. */
function reservationEndTs(r) {
  if (!r || !r.date || !r.time) return NaN;
  const start = new Date(`${r.date}T${r.time}`).getTime();
  if (Number.isNaN(start)) return NaN;
  return start + (Number(r.duration) || 0) * 60000;
}
function isPastReservation(r, now) {
  const end = reservationEndTs(r);
  return !Number.isNaN(end) && end <= now;
}

/* ------------------------------------------------------------------ */
/*  Storage                                                             */
/* ------------------------------------------------------------------ */

/* Persistence is split by the `shared` flag that every call site already
   passes:

     shared === true   → Supabase `kv_store` table (cloud, synced across every
                         device that opens the same restaurant): the registry
                         and all per-restaurant data (accounts, tables,
                         reservations, shifts, chat, notifications).

     shared === false  → this browser's localStorage (intentionally device-
                         local): the selected workspace, the "remember me"
                         session, and the light/dark theme preference.

   Both functions stay async so the rest of the app keeps `await`-ing them
   unchanged. */

function loadLocal(key, fallback) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return fallback;
    const raw = window.localStorage.getItem(key);
    if (raw != null) return JSON.parse(raw);
    return fallback;
  } catch (e) {
    return fallback;
  }
}
function saveLocal(key, value) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    if (value === null || value === undefined) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) { /* ignore quota / private-mode errors */ }
}

async function loadKey(key, fallback, shared) {
  if (!shared) return loadLocal(key, fallback);
  if (!supabase) return fallback;
  try {
    const { data, error } = await supabase
      .from(KV_TABLE)
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error) {
      console.error("Supabase load failed for", key, error.message);
      return fallback;
    }
    // `value` is a jsonb column, already decoded by supabase-js.
    if (data && data.value != null) return data.value;
    return fallback;
  } catch (e) {
    console.error("Supabase load threw for", key, e);
    return fallback;
  }
}

async function saveKey(key, value, shared) {
  if (!shared) { saveLocal(key, value); return; }
  if (!supabase) return;
  try {
    if (value === null || value === undefined) {
      await supabase.from(KV_TABLE).delete().eq("key", key);
    } else {
      const { error } = await supabase
        .from(KV_TABLE)
        .upsert({ key, value }, { onConflict: "key" });
      if (error) console.error("Supabase save failed for", key, error.message);
    }
  } catch (e) {
    console.error("Supabase save threw for", key, e);
  }
}

/* ------------------------------------------------------------------ */
/*  Shared visual primitives                                          */
/* ------------------------------------------------------------------ */

function Avatar({ name, role, size = 36, c }) {
  const ring = role ? c[roleMeta(role).accentKey] : c.textFaint;
  return (
    <div style={{
      width: size, height: size, borderRadius: "9999px", display: "flex", alignItems: "center",
      justifyContent: "center", background: c.surfaceAlt, color: c.text, fontWeight: 600,
      fontSize: size * 0.36, border: `2px solid ${ring}`, flexShrink: 0,
    }}>
      {initials(name)}
    </div>
  );
}

function Badge({ label, color, c }) {
  return (
    <span style={{
      fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 999,
      background: color + "1A", color, whiteSpace: "nowrap", border: `1px solid ${color}33`,
    }}>
      {label}
    </span>
  );
}

function IconBtn({ children, onClick, c, active, badge }) {
  return (
    <button onClick={onClick} style={{
      width: 40, height: 40, borderRadius: "9999px", display: "flex", alignItems: "center",
      justifyContent: "center", border: `1px solid ${c.border}`, background: active ? c.text : c.surface,
      color: active ? c.bg : c.text, cursor: "pointer", transition: "all .15s ease", flexShrink: 0,
      position: "relative",
    }}>
      {children}
      {badge > 0 && (
        <span style={{
          position: "absolute", top: -3, right: -3, minWidth: 17, height: 17, borderRadius: 999,
          background: c.rose, color: "#fff", fontSize: 10, fontWeight: 700, display: "flex",
          alignItems: "center", justifyContent: "center", padding: "0 4px", border: `2px solid ${c.bg}`,
        }}>{badge > 9 ? "9+" : badge}</span>
      )}
    </button>
  );
}

function StatCard({ label, value, icon: Icon, accent, footer, c }) {
  return (
    <div style={{
      borderRadius: 20, padding: "18px 18px 20px", border: `1px solid ${c.border}`,
      background: `radial-gradient(120% 100% at 100% 0%, ${accent}14, transparent 60%), ${c.surface}`,
      boxShadow: c.shadow, position: "relative", overflow: "hidden",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: c.textSub, textTransform: "uppercase" }}>{label}</span>
        <div style={{ width: 30, height: 30, borderRadius: 10, background: accent + "1F", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={15} color={accent} />
        </div>
      </div>
      <div style={{ fontFamily: fontStack().display, fontSize: 34, fontWeight: 600, color: c.text, marginTop: 10, lineHeight: 1 }}>{value}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, minHeight: 16 }}>
        {footer && <span style={{ fontSize: 12.5, color: c.textFaint }}>{footer}</span>}
      </div>
    </div>
  );
}

function SectionCard({ children, c, style }) {
  return <div style={{ borderRadius: 20, border: `1px solid ${c.border}`, background: c.surface, boxShadow: c.shadow, padding: 20, ...style }}>{children}</div>;
}

function PrimaryButton({ children, onClick, c, full, disabled, style }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? c.textFaint : c.cta, color: c.ctaText, border: "none", borderRadius: 14,
      padding: "13px 22px", fontWeight: 600, fontSize: 15, cursor: disabled ? "default" : "pointer",
      width: full ? "100%" : "auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      opacity: disabled ? 0.5 : 1, ...style,
    }}>
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, c, full, style }) {
  return (
    <button onClick={onClick} style={{
      background: "transparent", color: c.text, border: `1px solid ${c.border}`, borderRadius: 14,
      padding: "12px 20px", fontWeight: 600, fontSize: 15, cursor: "pointer", display: "flex",
      alignItems: "center", justifyContent: "center", gap: 8, width: full ? "100%" : "auto", ...style,
    }}>
      {children}
    </button>
  );
}

function TextInput({ label, value, onChange, placeholder, c, type = "text", required, error, hint, rightIcon }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <div style={{ fontSize: 13, color: c.textSub, marginBottom: 6, fontWeight: 500 }}>
          {label}{required && <span style={{ color: c.rose }}> *</span>}
        </div>
      )}
      <div style={{ position: "relative" }}>
        <input
          type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          style={{
            width: "100%", background: c.inputBg, border: `1px solid ${error ? c.rose : c.border}`,
            borderRadius: 12, padding: rightIcon ? "13px 44px 13px 14px" : "13px 14px", fontSize: 16, color: c.text, outline: "none",
            boxSizing: "border-box", fontFamily: fontStack().body,
          }}
        />
        {rightIcon && <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>{rightIcon}</div>}
      </div>
      {error && <div style={{ fontSize: 12, color: c.rose, marginTop: 5 }}>{error}</div>}
      {!error && hint && <div style={{ fontSize: 12, color: c.textFaint, marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

function EmptyState({ icon: Icon, title, message, actionLabel, onAction, c }) {
  return (
    <div style={{ textAlign: "center", padding: "34px 14px" }}>
      <div style={{
        width: 52, height: 52, borderRadius: 16, margin: "0 auto 14px", display: "flex",
        alignItems: "center", justifyContent: "center", background: c.surfaceAlt,
      }}>
        <Icon size={22} color={c.textFaint} />
      </div>
      <div style={{ fontWeight: 700, fontSize: 15.5, color: c.text, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13.5, color: c.textSub, maxWidth: 260, margin: "0 auto" }}>{message}</div>
      {actionLabel && (
        <PrimaryButton c={c} onClick={onAction} style={{ margin: "18px auto 0" }}>
          <Plus size={15} /> {actionLabel}
        </PrimaryButton>
      )}
    </div>
  );
}

function ConfirmDialog({ c, title, message, confirmLabel, danger = true, onConfirm, onCancel }) {
  const confirmText = confirmLabel || tr("Delete");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 80, padding: 20 }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: c.surface, borderRadius: 22, padding: 24, width: "100%", maxWidth: 340, fontFamily: fontStack().body }}>
        <div style={{ fontWeight: 700, fontSize: 16.5, color: c.text, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 13.5, color: c.textSub, marginBottom: 22, lineHeight: 1.5 }}>{message}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <GhostButton c={c} full onClick={onCancel}>{tr("Cancel")}</GhostButton>
          <PrimaryButton c={c} full onClick={onConfirm} style={{ background: danger ? c.rose : c.cta }}>{confirmText}</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Top bar + notifications + bottom nav                              */
/* ------------------------------------------------------------------ */

function NotificationsPanel({ c, notifications, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 65 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        position: "absolute", top: "calc(66px + env(safe-area-inset-top, 0px))", right: 20, width: "min(340px, 88vw)", maxHeight: "60dvh", overflowY: "auto",
        background: c.surface, border: `1px solid ${c.border}`, borderRadius: 18, boxShadow: c.shadow, padding: 8,
      }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, color: c.text, padding: "8px 10px" }}>{tr("Notifications")}</div>
        {notifications.length === 0 ? (
          <div style={{ padding: "20px 14px", textAlign: "center", color: c.textFaint, fontSize: 13 }}>{tr("You're all caught up.")}</div>
        ) : (
          [...notifications].sort((a, b) => b.time - a.time).map((n) => {
            const Icon = n.type === "chat" ? MessageSquare : CalendarDays;
            const accent = n.type === "chat" ? c.violet : c.blue;
            return (
              <div key={n.id} style={{ display: "flex", gap: 10, padding: "10px", borderRadius: 12, alignItems: "flex-start" }}>
                <div style={{ width: 30, height: 30, borderRadius: 10, background: accent + "1A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  <Icon size={14} color={accent} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: c.text, lineHeight: 1.4 }}>{n.text}</div>
                  <div style={{ fontSize: 11, color: c.textFaint, marginTop: 2 }}>{relativeTime(n.time)}</div>
                </div>
                {!n.read && <span style={{ width: 7, height: 7, borderRadius: 99, background: c.rose, marginTop: 6, flexShrink: 0 }} />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function TopBar({ title, c, isDark, setIsDark, notifications, onOpenNotifications, notifOpen, unreadCount }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "calc(16px + env(safe-area-inset-top, 0px)) 20px 10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <OrdioraMark c={c} size={30} />
        <div style={{ fontSize: 21, fontWeight: 600, color: c.text, fontFamily: fontStack().display, letterSpacing: "0.3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <IconBtn c={c} onClick={onOpenNotifications} badge={unreadCount}><Bell size={17} /></IconBtn>
        <IconBtn c={c} onClick={() => setIsDark(!isDark)}>{isDark ? <Sun size={17} /> : <Moon size={17} />}</IconBtn>
      </div>
      {notifOpen && <NotificationsPanel c={c} notifications={notifications} onClose={() => onOpenNotifications()} />}
    </div>
  );
}

const NAV_ITEMS = [
  { key: "dashboard", label: "Home", icon: Home },
  { key: "reservations", label: "Bookings", icon: CalendarDays },
  { key: "chat", label: "Chat", icon: MessageSquare },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "more", label: "More", icon: MoreHorizontal },
];

function BottomNav({ view, setView, c }) {
  return (
    <div style={{
      position: "sticky", bottom: 0, left: 0, right: 0, display: "flex", background: c.surface,
      borderTop: `1px solid ${c.border}`, padding: "10px 6px calc(14px + env(safe-area-inset-bottom, 0px))", justifyContent: "space-around", zIndex: 20,
    }}>
      {NAV_ITEMS.map((item) => {
        const activeSet = item.key === "more" ? ["more", "shifts", "staff", "settings", "orders", "followups"].includes(view) : view === item.key;
        const Icon = item.icon;
        return (
          <button key={item.key} onClick={() => setView(item.key)} style={{
            background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center",
            gap: 4, cursor: "pointer", color: activeSet ? c.text : c.textFaint, padding: "4px 10px",
          }}>
            <Icon size={20} strokeWidth={activeSet ? 2.4 : 2} />
            <span style={{ fontSize: 10.5, fontWeight: activeSet ? 700 : 500 }}>{tr(item.label)}</span>
          </button>
        );
      })}
    </div>
  );
}

/* Desktop-only left navigation. Replaces the bottom bar on wide screens and
   also surfaces the "More" destinations (orders/shifts/team/follow-ups/settings)
   directly, plus theme + account actions — so nothing from the mobile More
   screen is lost. */
function SideNav({ view, setView, c, user, restaurant, isDark, setIsDark, onSignOut, onSwitchWorkspace }) {
  const primary = [
    { key: "dashboard", label: "Home", icon: Home },
    { key: "reservations", label: "Bookings", icon: CalendarDays },
    { key: "chat", label: "Chat", icon: MessageSquare },
    { key: "analytics", label: "Analytics", icon: BarChart3 },
  ];
  const secondary = [
    { key: "orders", label: "Order supplies", icon: ShoppingCart },
    { key: "shifts", label: "Shifts", icon: Clock },
    { key: "staff", label: "Team", icon: Users },
    ...((user.role === "owner" || user.role === "waiter")
      ? [{ key: "followups", label: "Follow-ups", icon: Mail }]
      : []),
    { key: "settings", label: "Settings", icon: SettingsIcon },
  ];
  const NavButton = ({ item }) => {
    const active = view === item.key;
    const Icon = item.icon;
    return (
      <button onClick={() => setView(item.key)} style={{
        display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", cursor: "pointer",
        padding: "10px 12px", borderRadius: 12, border: "none", marginBottom: 2,
        background: active ? c.surfaceAlt : "transparent", color: active ? c.text : c.textSub,
        fontWeight: active ? 700 : 500, fontSize: 14,
      }}>
        <Icon size={18} strokeWidth={active ? 2.4 : 2} color={active ? c.text : c.textSub} />
        {tr(item.label)}
      </button>
    );
  };
  return (
    <div style={{
      width: 250, flexShrink: 0, position: "sticky", top: 0, alignSelf: "flex-start", height: "100dvh",
      background: c.surface, borderRight: `1px solid ${c.border}`, display: "flex", flexDirection: "column",
      padding: "22px 16px", boxSizing: "border-box",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 6px", marginBottom: 22 }}>
        <OrdioraMark c={c} size={30} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: c.text, fontFamily: fontStack().display, letterSpacing: "0.3px" }}>ORDIORA</div>
          <div style={{ fontSize: 11.5, color: c.textFaint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{restaurant?.name}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {primary.map((item) => <NavButton key={item.key} item={item} />)}
        <div style={{ height: 1, background: c.border, margin: "12px 6px" }} />
        {secondary.map((item) => <NavButton key={item.key} item={item} />)}
      </div>

      <div style={{ borderTop: `1px solid ${c.border}`, paddingTop: 12, marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 6px 12px" }}>
          <Avatar c={c} name={user.name} role={user.role} size={34} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
            <div style={{ fontSize: 11.5, color: c.textFaint }}>{tr(roleMeta(user.role).label)}</div>
          </div>
        </div>
        <button onClick={() => setIsDark(!isDark)} style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", cursor: "pointer",
          padding: "9px 12px", borderRadius: 12, border: "none", background: "transparent", color: c.textSub, fontWeight: 600, fontSize: 13,
        }}>
          {isDark ? <Moon size={16} /> : <Sun size={16} />} {isDark ? tr("Dark mode") : tr("Light mode")}
        </button>
        <button onClick={onSwitchWorkspace} style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", cursor: "pointer",
          padding: "9px 12px", borderRadius: 12, border: "none", background: "transparent", color: c.textSub, fontWeight: 600, fontSize: 13,
        }}>
          <Store size={16} /> {tr("Switch restaurant")}
        </button>
        <button onClick={onSignOut} style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", cursor: "pointer",
          padding: "9px 12px", borderRadius: 12, border: "none", background: "transparent", color: c.rose, fontWeight: 600, fontSize: 13,
        }}>
          <LogOut size={16} /> {tr("Sign out")}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Table manager (bulk + zones) — shared by setup & settings          */
/* ------------------------------------------------------------------ */

function TableManager({ c, tables, setTables, compact }) {
  const [zone, setZone] = useState("");
  const [count, setCount] = useState(4);
  const [capacity, setCapacity] = useState(2);

  const grouped = useMemo(() => {
    const g = {};
    tables.forEach((t) => { const key = t.zone || "No zone"; (g[key] = g[key] || []).push(t); });
    return g;
  }, [tables]);

  const bulkAdd = () => {
    const n = Math.max(1, Math.min(200, Number(count) || 1));
    const z = zone.trim();
    const existingInZone = tables.filter((t) => (t.zone || "") === z).length;
    const newTables = Array.from({ length: n }, (_, i) => ({
      id: uid(),
      name: z ? `${z} ${existingInZone + i + 1}` : `Table ${tables.length + i + 1}`,
      capacity: Number(capacity) || 2,
      zone: z || undefined,
    }));
    setTables((prev) => [...prev, ...newTables]);
    setCount(4);
  };
  const removeTable = (id) => setTables((prev) => prev.filter((t) => t.id !== id));
  const setCapacityFor = (id, value) => setTables((prev) => prev.map((t) => t.id === id ? { ...t, capacity: Math.max(1, Math.min(99, Math.round(Number(value) || 1))) } : t));
  const stepCapacity = (t, d) => setCapacityFor(t.id, (Number(t.capacity) || 1) + d);
  const stepBtn = { width: 26, height: 26, borderRadius: 8, border: `1px solid ${c.border}`, background: c.surface, color: c.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };

  return (
    <div>
      {!compact && tables.length === 0 && <div style={{ fontSize: 13, color: c.textFaint, marginBottom: 12 }}>{tr("No tables added yet.")}</div>}
      {Object.entries(grouped).map(([zoneName, list]) => (
        <div key={zoneName} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: c.textFaint, letterSpacing: "0.05em", margin: "8px 0 4px" }}>
            {(zoneName === "No zone" ? tr("No zone") : zoneName).toUpperCase()} · {list.length}
          </div>
          {list.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderTop: `1px solid ${c.border}` }}>
              <div style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: 14, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
              <span style={{ fontSize: 11, color: c.textFaint, flexShrink: 0 }}>{tr("Seats")}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <button onClick={() => stepCapacity(t, -1)} style={stepBtn} aria-label={tr("Fewer seats")}><Minus size={13} /></button>
                <input value={t.capacity} onChange={(e) => setCapacityFor(t.id, e.target.value)} inputMode="numeric"
                  style={{ width: 36, textAlign: "center", padding: "5px 2px", borderRadius: 8, border: `1px solid ${c.border}`, background: c.inputBg, color: c.text, fontSize: 16, boxSizing: "border-box" }} />
                <button onClick={() => stepCapacity(t, 1)} style={stepBtn} aria-label={tr("More seats")}><Plus size={13} /></button>
              </div>
              <button onClick={() => removeTable(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: c.textFaint, flexShrink: 0 }}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      ))}

      <div style={{ background: c.surfaceAlt, borderRadius: 14, padding: 14, marginTop: 10 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: c.textSub, marginBottom: 10 }}>{tr("Add tables in bulk")}</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input value={zone} onChange={(e) => setZone(e.target.value)} placeholder={tr("Zone (optional, e.g. Patio)")}
            style={{ flex: 1, minWidth: 0, padding: "10px 12px", borderRadius: 10, border: `1px solid ${c.border}`, background: c.surface, color: c.text, fontSize: 16, boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: c.textFaint, marginBottom: 4 }}>{tr("How many")}</div>
            <input type="number" min={1} inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${c.border}`, background: c.surface, color: c.text, fontSize: 16, boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: c.textFaint, marginBottom: 4 }}>{tr("Seats each")}</div>
            <input type="number" min={1} inputMode="numeric" value={capacity} onChange={(e) => setCapacity(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${c.border}`, background: c.surface, color: c.text, fontSize: 16, boxSizing: "border-box" }} />
          </div>
          <button onClick={bulkAdd} style={{ alignSelf: "flex-end", padding: "10px 16px", borderRadius: 10, border: "none", background: c.cta, color: c.ctaText, cursor: "pointer", fontWeight: 600, fontSize: 13.5, whiteSpace: "nowrap" }}>
            {tr("Add")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Login (exact restaurant name + password)                           */
/* ------------------------------------------------------------------ */

/* Compact HR / EN switch used on the pre-login screens (next to the theme
   toggle) so the language can be chosen before signing in. */
function LangToggle({ c, lang, setLang }) {
  return (
    <div style={{ display: "flex", border: `1px solid ${c.border}`, borderRadius: 999, overflow: "hidden", background: c.surface }}>
      {["hr", "en"].map((k) => {
        const active = lang === k;
        return (
          <button key={k} onClick={() => setLang(k)} style={{
            border: "none", cursor: "pointer", padding: "7px 12px", fontSize: 12, fontWeight: 700,
            background: active ? c.text : "transparent", color: active ? c.bg : c.textSub,
          }}>{k.toUpperCase()}</button>
        );
      })}
    </div>
  );
}

/* Access requires the EXACT restaurant name plus a valid password — the app
   never lists or reveals which restaurants exist, and the password alone
   identifies which staff account is signing in. */
function LoginScreen({ c, isDark, setIsDark, lang, setLang, onLogin, onRecover, onCreateNew }) {
  const [mode, setMode] = useState("signin"); // "signin" | "recover"
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  // recovery fields
  const [code, setCode] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");

  const goRecover = () => { setError(""); setInfo(""); setMode("recover"); };
  const goSignin = () => { setError(""); setMode("signin"); };

  const submit = async () => {
    setError(""); setInfo("");
    if (!name.trim() || !password) { setError(tr("Enter your restaurant name and password.")); return; }
    setLoading(true);
    const res = await onLogin(name, password, remember);
    setLoading(false);
    if (!res || !res.ok) setError(tr("Incorrect restaurant name or password."));
  };

  const submitRecover = async () => {
    setError("");
    if (!name.trim() || !code.trim()) { setError(tr("Enter your restaurant name and recovery code.")); return; }
    if (newPass.length < 6) { setError(tr("New password must be at least 6 characters.")); return; }
    if (newPass !== confirm) { setError(tr("New passwords don't match.")); return; }
    setLoading(true);
    const res = await onRecover(name, code, newPass);
    setLoading(false);
    if (!res || !res.ok) { setError(res?.error || tr("Couldn't reset the password.")); return; }
    setPassword(newPass); setCode(""); setNewPass(""); setConfirm("");
    setMode("signin"); setInfo(tr("Password updated — you can sign in now."));
  };

  return (
    <div style={{ minHeight: "100dvh", background: c.bg, display: "flex", flexDirection: "column", fontFamily: fontStack().body }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "calc(18px + env(safe-area-inset-top, 0px)) 20px 18px" }}>
        <LangToggle c={c} lang={lang} setLang={setLang} />
        <IconBtn c={c} onClick={() => setIsDark(!isDark)}>{isDark ? <Sun size={17} /> : <Moon size={17} />}</IconBtn>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px 40px" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ textAlign: "center", marginBottom: 26 }}>
            <div style={{ margin: "0 auto 4px", width: 160 }}>
              <OrdioraLogo c={c} size={160} />
            </div>
            <div style={{ color: c.textSub, marginTop: 2, fontSize: 15 }}>
              {mode === "signin" ? tr("Sign in to your restaurant.") : tr("Reset your password.")}
            </div>
          </div>

          {mode === "signin" ? (
            <>
              <TextInput c={c} label={tr("Restaurant name")} value={name} onChange={setName} placeholder={tr("Your exact restaurant name")} />
              <TextInput c={c} label={tr("Password")} value={password} onChange={setPassword} placeholder={tr("Password")} type="password" error={error} />
              {info && <div style={{ fontSize: 12.5, color: c.green, marginTop: -8, marginBottom: 12 }}>{info}</div>}

              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 18 }}>
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ width: 17, height: 17, accentColor: c.text }} />
                <span style={{ fontSize: 13, color: c.textSub }}>{tr("Remember me on this device")}</span>
              </label>

              <PrimaryButton c={c} full onClick={submit} disabled={loading} style={{ marginTop: 4 }}>
                {loading ? <><Loader2 size={16} className="spin" /> {tr("Signing in…")}</> : tr("Sign in")}
              </PrimaryButton>
              <button onClick={goRecover} style={{ display: "block", margin: "14px auto 0", background: "none", border: "none", cursor: "pointer", color: c.textSub, fontSize: 12.5, fontWeight: 600, textDecoration: "underline" }}>
                {tr("Forgot password?")}
              </button>
              <div style={{ textAlign: "center", fontSize: 12.5, color: c.textFaint, marginTop: 14, lineHeight: 1.6 }}>
                {tr("New team member? Ask your restaurant owner for your login — they'll share your password with you.")}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0 18px" }}>
                <div style={{ flex: 1, height: 1, background: c.border }} />
                <span style={{ fontSize: 12, color: c.textFaint }}>{tr("or")}</span>
                <div style={{ flex: 1, height: 1, background: c.border }} />
              </div>
              <GhostButton c={c} full onClick={onCreateNew}>
                <Plus size={15} /> {tr("Set up a new restaurant")}
              </GhostButton>
            </>
          ) : (
            <>
              <div style={{ fontSize: 12.5, color: c.textFaint, marginBottom: 14, lineHeight: 1.6 }}>
                {tr("Enter your restaurant name and the recovery code you saved when you set up the restaurant, then choose a new owner password.")}
              </div>
              <TextInput c={c} label={tr("Restaurant name")} value={name} onChange={setName} placeholder={tr("Your exact restaurant name")} />
              <TextInput c={c} label={tr("Recovery code")} value={code} onChange={setCode} placeholder="e.g. R7K2-9QMX" />
              <TextInput c={c} label={tr("New password")} value={newPass} onChange={setNewPass} placeholder={tr("At least 6 characters")} type="password" />
              <TextInput c={c} label={tr("Confirm new password")} value={confirm} onChange={setConfirm} placeholder={tr("Repeat password")} type="password" error={error} />
              <PrimaryButton c={c} full onClick={submitRecover} disabled={loading} style={{ marginTop: 4 }}>
                {loading ? <><Loader2 size={16} className="spin" /> {tr("Resetting…")}</> : tr("Reset password")}
              </PrimaryButton>
              <button onClick={goSignin} style={{ display: "block", margin: "16px auto 0", background: "none", border: "none", cursor: "pointer", color: c.textSub, fontSize: 12.5, fontWeight: 600, textDecoration: "underline" }}>
                {tr("Back to sign in")}
              </button>
            </>
          )}
        </div>
      </div>
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Setup wizard (first run — create restaurant + owner account)       */
/* ------------------------------------------------------------------ */

function SetupWizard({ c, isDark, setIsDark, lang, setLang, onComplete, onCancel }) {
  const [step, setStep] = useState(0);
  const steps = ["Restaurant", "Your account", "Tables"];
  const [restaurantName, setRestaurantName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [tables, setTables] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [remember, setRemember] = useState(true);

  const emailValid = /^\S+@\S+\.\S+$/.test(email);

  const errors = {
    restaurantName: step > 0 && !restaurantName.trim() ? tr("Enter your restaurant's name") : null,
    ownerName: step > 1 && !ownerName.trim() ? tr("Enter your name") : null,
    email: step > 1 && !emailValid ? tr("Enter a valid email") : null,
    password: step > 1 && password.length < 6 ? tr("At least 6 characters") : null,
    confirm: step > 1 && confirm !== password ? tr("Passwords don't match") : null,
  };

  const canNext = () => {
    if (step === 0) return restaurantName.trim().length > 0;
    if (step === 1) return ownerName.trim() && emailValid && password.length >= 6 && confirm === password;
    return true;
  };

  const finish = () => {
    setSubmitting(true);
    setTimeout(() => {
      onComplete({
        restaurant: { name: restaurantName.trim() },
        owner: { id: uid(), name: ownerName.trim(), email: email.trim().toLowerCase(), password, role: "owner" },
        tables,
        remember,
      });
    }, 500);
  };

  return (
    <div style={{ minHeight: "100dvh", background: c.bg, display: "flex", flexDirection: "column", fontFamily: fontStack().body }}>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "calc(18px + env(safe-area-inset-top, 0px)) 20px 18px" }}>
        {onCancel ? (
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: c.textSub, fontSize: 13.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            <ChevronLeft size={16} /> {tr("All restaurants")}
          </button>
        ) : <span />}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LangToggle c={c} lang={lang} setLang={setLang} />
          <IconBtn c={c} onClick={() => setIsDark(!isDark)}>{isDark ? <Sun size={17} /> : <Moon size={17} />}</IconBtn>
        </div>
      </div>
      <div style={{ flex: 1, padding: "0 20px 40px" }}>
        <div style={{ maxWidth: 440, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 26 }}>
            <div style={{ margin: "0 auto 6px", width: 150 }}>
              <OrdioraLogo c={c} size={150} />
            </div>
            <div style={{ color: c.textSub, marginTop: 2, fontSize: 14.5 }}>{tr("Let's set up your restaurant.")}</div>
          </div>

          <div style={{ display: "flex", marginBottom: 24 }}>
            {steps.map((s, i) => (
              <div key={s} style={{ flex: 1, textAlign: "center" }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 999, margin: "0 auto 6px", display: "flex", alignItems: "center",
                  justifyContent: "center", background: i <= step ? c.text : c.surfaceAlt, color: i <= step ? c.bg : c.textFaint,
                  fontSize: 12.5, fontWeight: 700, border: `1px solid ${i <= step ? c.text : c.border}`,
                }}>{i < step ? <Check size={14} /> : i + 1}</div>
                <div style={{ fontSize: 11, color: i === step ? c.text : c.textFaint, fontWeight: i === step ? 700 : 500 }}>{tr(s)}</div>
              </div>
            ))}
          </div>

          <SectionCard c={c} style={{ marginBottom: 20 }}>
            {step === 0 && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <Store size={18} color={c.textSub} />
                  <span style={{ fontWeight: 700, fontSize: 15, color: c.text }}>{tr("Your restaurant")}</span>
                </div>
                <TextInput c={c} label={tr("Restaurant name")} required value={restaurantName} onChange={setRestaurantName}
                  placeholder={tr("e.g. Rosemary & Rye")} error={errors.restaurantName} />
                <div style={{ fontSize: 12.5, color: c.textFaint }}>{tr("This appears on staff logins and reports.")}</div>
              </>
            )}
            {step === 1 && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <CircleUser size={18} color={c.textSub} />
                  <span style={{ fontWeight: 700, fontSize: 15, color: c.text }}>{tr("Create your owner account")}</span>
                </div>
                <TextInput c={c} label={tr("Full name")} required value={ownerName} onChange={setOwnerName} placeholder={tr("Your name")} error={errors.ownerName} />
                <TextInput c={c} label={tr("Email")} required value={email} onChange={setEmail} placeholder={tr("you@email.com")} error={errors.email} />
                <TextInput c={c} label={tr("Password")} required type="password" value={password} onChange={setPassword} placeholder={tr("At least 6 characters")} error={errors.password} />
                <TextInput c={c} label={tr("Confirm password")} required type="password" value={confirm} onChange={setConfirm} placeholder={tr("Repeat password")} error={errors.confirm} />
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginTop: 4 }}>
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ width: 17, height: 17, accentColor: c.text }} />
                  <span style={{ fontSize: 13, color: c.textSub }}>{tr("Remember me on this device")}</span>
                </label>
              </>
            )}
            {step === 2 && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <LayoutGrid size={18} color={c.textSub} />
                  <span style={{ fontWeight: 700, fontSize: 15, color: c.text }}>{tr("Add your tables")}</span>
                </div>
                <div style={{ fontSize: 12.5, color: c.textFaint, marginBottom: 16 }}>{tr("Optional — add them all at once, group by section, or skip and do this later in Settings.")}</div>
                <TableManager c={c} tables={tables} setTables={setTables} compact />
              </>
            )}
          </SectionCard>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <GhostButton c={c} onClick={() => step === 0 ? null : setStep(step - 1)} style={{ visibility: step === 0 ? "hidden" : "visible" }}>
              <ChevronLeft size={15} /> {tr("Back")}
            </GhostButton>
            {step < 2 ? (
              <PrimaryButton c={c} disabled={!canNext()} onClick={() => setStep(step + 1)}>{tr("Next")} <ChevronRight size={15} /></PrimaryButton>
            ) : (
              <PrimaryButton c={c} disabled={submitting} onClick={finish}>
                {submitting ? <><Loader2 size={16} className="spin" /> {tr("Setting up…")}</> : tr("Finish setup")}
              </PrimaryButton>
            )}
          </div>
        </div>
      </div>
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard                                                           */
/* ------------------------------------------------------------------ */

function DashboardScreen({ c, user, reservations, shifts, setView, openNewReservation, canCreate, now }) {
  const bp = useBreakpoint();
  const todayIso = localDateIso();
  const todays = reservations.filter((r) => r.date === todayIso);
  const covers = todays.reduce((a, r) => a + (Number(r.guests) || 0), 0);
  const pending = reservations.filter((r) => r.status === "pending").length;
  const activeShifts = shifts.filter((s) => s.day === todayIso).length;
  const upcoming = todays
    .filter((r) => r.status !== "cancelled" && !isPastReservation(r, now))
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""))
    .slice(0, 3);

  const quickActions = [
    { label: "New Reservation", sub: "Book a table for a guest", icon: CalendarDays, accent: c.green, action: openNewReservation, show: canCreate },
    { label: "View All Reservations", sub: "Check today's bookings", icon: Check, accent: c.blue, action: () => setView("reservations"), show: true },
    { label: "Staff Shifts", sub: "View weekly schedule", icon: Clock, accent: c.amber, action: () => setView("shifts"), show: true },
    { label: "Team Chat", sub: "Message your team", icon: MessageSquare, accent: c.violet, action: () => setView("chat"), show: true },
  ].filter((q) => q.show);
  const guestWord = (n) => plural(n, ["guest", "guests"], ["gost", "gosta", "gostiju"]);

  return (
    <div style={{ padding: "0 20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ color: c.textSub, fontSize: 14 }}>{tr("Good day,")}</span>
        <span style={{ fontWeight: 700, color: c.text, fontSize: 14 }}>{user.name}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto", color: c.green, fontSize: 12, fontWeight: 600 }}>
          <span style={{ width: 7, height: 7, borderRadius: 99, background: c.green, display: "inline-block" }} /> {tr("Live")}
        </span>
      </div>
      <div style={{ fontFamily: fontStack().display, fontSize: 28, fontWeight: 600, color: c.text, margin: "2px 0 20px" }}>{tr("Dashboard")}</div>

      <div style={{ display: "grid", gridTemplateColumns: bp === "desktop" ? "repeat(4, 1fr)" : "1fr 1fr", gap: 14, marginBottom: 18 }}>
        <StatCard c={c} label={tr("TODAY'S RESERVATIONS")} value={todays.length} icon={CalendarDays} accent={c.blue} footer={tr("bookings today")} />
        <StatCard c={c} label={tr("TODAY'S GUESTS")} value={covers} icon={Users} accent={c.rose} footer={tr("expected covers")} />
        <StatCard c={c} label={tr("ACTIVE SHIFTS")} value={activeShifts} icon={Clock} accent={c.amber} footer={tr("staff on duty")} />
        <StatCard c={c} label={tr("PENDING")} value={pending} icon={Bell} accent={c.rose} footer={tr("awaiting confirmation")} />
      </div>

      <SectionCard c={c} style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: upcoming.length ? 14 : 0 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: c.text }}>{tr("Upcoming Reservations")}</span>
          <button onClick={() => setView("reservations")} style={{ background: "none", border: "none", color: c.textSub, fontSize: 13, display: "flex", alignItems: "center", gap: 2, cursor: "pointer" }}>
            {tr("View all")} <ChevronRight size={14} />
          </button>
        </div>
        {upcoming.length === 0 ? (
          <EmptyState c={c} icon={CalendarDays} title={tr("Nothing booked yet")}
            message={tr("Reservations you take today will show up here.")}
            actionLabel={canCreate ? tr("New reservation") : null} onAction={openNewReservation} />
        ) : upcoming.map((r) => (
          <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: `1px solid ${c.border}` }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: c.surfaceAlt, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: c.text }}>
              {(r.time || "").split(":")[0]}<span style={{ fontSize: 9, color: c.textFaint, fontWeight: 500 }}>:{(r.time || "").split(":")[1]}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14.5, color: c.text }}>{r.name}</div>
              <div style={{ fontSize: 12.5, color: c.textSub }}>{r.guests} {guestWord(r.guests)}</div>
            </div>
            <Badge c={c} label={tr(r.status)} color={statusColor(c, r.status)} />
          </div>
        ))}
      </SectionCard>

      <SectionCard c={c}>
        <div style={{ fontWeight: 700, fontSize: 16, color: c.text, marginBottom: 14 }}>{tr("Quick Actions")}</div>
        {quickActions.map((qa, i) => {
          const Icon = qa.icon;
          return (
            <button key={i} onClick={qa.action} style={{
              display: "flex", alignItems: "center", gap: 14, width: "100%", background: "none", border: "none",
              padding: "10px 0", borderTop: i ? `1px solid ${c.border}` : "none", cursor: "pointer", textAlign: "left",
            }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: qa.accent + "1A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={17} color={qa.accent} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14.5, color: c.text }}>{tr(qa.label)}</div>
                <div style={{ fontSize: 12.5, color: c.textSub }}>{tr(qa.sub)}</div>
              </div>
              <ChevronRight size={16} color={c.textFaint} />
            </button>
          );
        })}
      </SectionCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reservations                                                       */
/* ------------------------------------------------------------------ */

function ReservationsScreen({ c, reservations, setReservations, user, openNewReservation, openEditReservation, canCreate, now }) {
  const [open, setOpen] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    return reservations.filter((r) => {
      const past = isPastReservation(r, now);
      // The "Past" filter shows history; every other view shows only active
      // (not-yet-ended) reservations so finished ones drop off automatically.
      if (statusFilter === "past") { if (!past) return false; }
      else { if (past) return false; if (statusFilter !== "all" && r.status !== statusFilter) return false; }
      if (search.trim() && !((r.name || "").toLowerCase().includes(search.toLowerCase()) || (r.table || "").toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    });
  }, [reservations, search, statusFilter, now]);

  const grouped = useMemo(() => {
    const g = {};
    [...filtered].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).forEach((r) => {
      (g[r.date] = g[r.date] || []).push(r);
    });
    return g;
  }, [filtered]);

  return (
    <div style={{ padding: "0 20px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "4px 0 16px" }}>
        <div>
          <div style={{ fontFamily: fontStack().display, fontSize: 26, fontWeight: 600, color: c.text }}>{tr("Reservations")}</div>
          <div style={{ fontSize: 13.5, color: c.textSub }}>{tr("All upcoming table bookings.")}</div>
        </div>
        {canCreate && reservations.length > 0 && (
          <button onClick={openNewReservation} style={{ width: 42, height: 42, borderRadius: 14, background: c.cta, border: "none", color: c.ctaText, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <Plus size={20} />
          </button>
        )}
      </div>

      {reservations.length > 0 && (
        <>
          <div style={{ position: "relative", marginBottom: 10 }}>
            <Search size={15} color={c.textFaint} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tr("Search by guest or table")}
              style={{ width: "100%", padding: "11px 12px 11px 36px", borderRadius: 12, border: `1px solid ${c.border}`, background: c.inputBg, color: c.text, fontSize: 16, boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 16, paddingBottom: 2 }}>
            {["all", ...STATUS_LIST, "past"].map((st) => (
              <button key={st} onClick={() => setStatusFilter(st)} style={{
                flexShrink: 0, fontSize: 12, fontWeight: 600, padding: "7px 12px", borderRadius: 999, cursor: "pointer",
                border: `1px solid ${statusFilter === st ? c.text : c.border}`,
                background: statusFilter === st ? c.text : c.surface, color: statusFilter === st ? c.bg : c.textSub,
                textTransform: "capitalize",
              }}>{tr(st)}</button>
            ))}
          </div>
        </>
      )}

      {!canCreate && (
        <div style={{ fontSize: 12.5, color: c.textFaint, marginBottom: 14, background: c.surfaceAlt, padding: "10px 14px", borderRadius: 12 }}>
          {tr("Viewing only — ask the front of house to add or edit bookings.")}
        </div>
      )}
      {Object.keys(grouped).length === 0 && (
        reservations.length === 0 ? (
          <EmptyState c={c} icon={CalendarDays} title={tr("No reservations yet")}
            message={canCreate ? tr("Bookings you create will appear here, grouped by date.") : tr("Once the team starts booking tables, they'll show up here.")}
            actionLabel={canCreate ? tr("New reservation") : null} onAction={openNewReservation} />
        ) : statusFilter === "past" ? (
          <EmptyState c={c} icon={Clock} title={tr("No past reservations")} message={tr("Finished bookings will appear here once their time has passed.")} />
        ) : statusFilter === "all" ? (
          <EmptyState c={c} icon={CalendarDays} title={tr("Nothing coming up")}
            message={tr("No active reservations right now. Finished ones move to the Past tab automatically.")} />
        ) : (
          <EmptyState c={c} icon={Search} title={tr("No matches")} message={tr("Try a different name, table, or status filter.")} />
        )
      )}
      {Object.entries(grouped).map(([date, list]) => (
        <div key={date} style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: c.textFaint, letterSpacing: "0.04em", marginBottom: 10 }}>
            <span>{formatDateLabel(date)}</span>
            <span>{list.length} {plural(list.length, ["booking", "bookings"], ["rezervacija", "rezervacije", "rezervacija"])}</span>
          </div>
          {list.map((r) => (
            <div key={r.id} style={{ marginBottom: 10 }}>
              <div onClick={() => setOpen(open === r.id ? null : r.id)} style={{
                display: "flex", alignItems: "center", gap: 14, borderRadius: 18, padding: 14,
                border: `1px solid ${c.border}`, background: c.surface, boxShadow: c.shadow, cursor: "pointer",
              }}>
                <div style={{ textAlign: "center", minWidth: 40 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: c.text }}>{(r.time || "").split(":")[0]}</div>
                  <div style={{ fontSize: 11, color: c.textFaint }}>:{(r.time || "").split(":")[1]}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: c.text }}>{r.name}</span>
                    <Badge c={c} label={tr(r.status)} color={statusColor(c, r.status)} />
                  </div>
                  <div style={{ fontSize: 12.5, color: c.textSub, marginTop: 3, display: "flex", gap: 10 }}>
                    <span>{r.guests} {plural(r.guests, ["guest", "guests"], ["gost", "gosta", "gostiju"])}</span><span>{r.table || "—"}</span><span>{r.duration || 90} min</span>
                  </div>
                </div>
                {user.role === "owner" && (
                  <button onClick={(e) => { e.stopPropagation(); openEditReservation(r); }} style={{ background: "none", border: "none", cursor: "pointer", color: c.textFaint, padding: 4 }}>
                    <Pencil size={15} />
                  </button>
                )}
                <ChevronDown size={16} color={c.textFaint} style={{ transform: open === r.id ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
              </div>
              {open === r.id && (
                <div style={{ padding: "12px 16px", background: c.surfaceAlt, borderRadius: 14, marginTop: 6, fontSize: 13.5, color: c.textSub }}>
                  <div style={{ marginBottom: 8, display: "flex", gap: 8, alignItems: "center" }}><Phone size={13} /> {r.phone}</div>
                  {user.role !== "chef" && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {STATUS_LIST.map((st) => (
                        <button key={st} onClick={() => setReservations((prev) => prev.map((x) => x.id === r.id ? { ...x, status: st } : x))} style={{
                          fontSize: 11.5, padding: "5px 10px", borderRadius: 999, cursor: "pointer",
                          border: `1px solid ${r.status === st ? statusColor(c, st) : c.border}`,
                          background: r.status === st ? statusColor(c, st) + "1A" : "transparent",
                          color: r.status === st ? statusColor(c, st) : c.textSub, fontWeight: 600,
                        }}>{tr(st)}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  New / Edit Reservation Wizard                                       */
/* ------------------------------------------------------------------ */

function ReservationWizard({ c, onClose, onCreate, onUpdate, onDelete, reservations, tables, editing }) {
  const bp = useBreakpoint();
  const [step, setStep] = useState(0);
  const steps = ["Guest", "Date", "Table", "Review"];
  const [form, setForm] = useState(() => editing ? {
    name: editing.name, phone: editing.phone, email: editing.email || "",
    date: editing.date, time: editing.time, guests: editing.guests, duration: editing.duration, table: editing.table,
  } : {
    name: "", phone: "", email: "",
    date: localDateIso(), time: "19:00", guests: 2, duration: 90, table: "",
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const conflictFor = (table) => reservations.find((r) =>
    r.id !== editing?.id && r.table === table.name && r.date === form.date && r.status !== "cancelled" &&
    isOverlapping(form.time, form.duration, r.time, r.duration)
  );

  const canNext = () => {
    if (step === 0) return form.name.trim() && form.phone.trim();
    if (step === 1) return form.date && form.time && form.guests > 0;
    if (step === 2) return !!form.table && !conflictFor({ name: form.table });
    return true;
  };

  const submit = () => {
    // A blank/0/negative duration would make the booking "already ended", so it
    // would instantly vanish and get auto-marked no-show — clamp to a sane value.
    const dur = Number(form.duration);
    const payload = { ...form, guests: Math.max(1, Number(form.guests) || 1), duration: dur > 0 ? dur : 90 };
    if (editing) onUpdate(editing.id, payload);
    else onCreate({ id: uid(), ...payload, status: "pending" });
    onClose();
  };

  const grouped = useMemo(() => {
    const g = {};
    tables.forEach((t) => { const key = t.zone || "No zone"; (g[key] = g[key] || []).push(t); });
    return g;
  }, [tables]);

  return (
    <div style={{ position: "fixed", inset: 0, background: c.bg, zIndex: 50, overflowY: "auto", fontFamily: fontStack().body }}>
      <div style={{ padding: "calc(18px + env(safe-area-inset-top, 0px)) 20px calc(40px + env(safe-area-inset-bottom, 0px))", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: c.text }}><ChevronLeft size={22} /></button>
          <div style={{ fontFamily: fontStack().display, fontSize: 22, fontWeight: 600, color: c.text }}>{editing ? tr("Edit Reservation") : tr("New Reservation")}</div>
        </div>
        <div style={{ color: c.textSub, fontSize: 13.5, marginBottom: 20, marginLeft: 36 }}>{editing ? tr("Update this table booking.") : tr("Create a new table booking.")}</div>

        <div style={{ display: "flex", marginBottom: 24 }}>
          {steps.map((s, i) => (
            <div key={s} style={{ flex: 1, textAlign: "center" }}>
              <div style={{
                width: 34, height: 34, borderRadius: 999, margin: "0 auto 6px", display: "flex", alignItems: "center",
                justifyContent: "center", background: i <= step ? c.text : c.surfaceAlt, color: i <= step ? c.bg : c.textFaint,
                fontSize: 13, fontWeight: 700, border: `1px solid ${i <= step ? c.text : c.border}`,
              }}>{i < step ? <Check size={15} /> : i + 1}</div>
              <div style={{ fontSize: 11.5, color: i === step ? c.text : c.textFaint, fontWeight: i === step ? 700 : 500 }}>{tr(s)}</div>
            </div>
          ))}
        </div>

        <SectionCard c={c} style={{ marginBottom: 20 }}>
          {step === 0 && (
            <>
              <TextInput c={c} label={tr("Guest Name")} required value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder={tr("Full name")} />
              <TextInput c={c} label={tr("Phone")} required value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+385-91-000-0000" />
              <TextInput c={c} label={tr("Email (optional)")} value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder={tr("guest@email.com")} />
            </>
          )}
          {step === 1 && (
            <>
              <TextInput c={c} label={tr("Date")} required type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
              <TextInput c={c} label={tr("Time")} required type="time" value={form.time} onChange={(v) => setForm({ ...form, time: v })} />
              <TextInput c={c} label={tr("Guests")} required type="number" value={form.guests} onChange={(v) => setForm({ ...form, guests: v })} />
              <TextInput c={c} label={tr("Duration (minutes)")} type="number" value={form.duration} onChange={(v) => setForm({ ...form, duration: v })} />
            </>
          )}
          {step === 2 && (
            tables.length === 0 ? (
              <EmptyState c={c} icon={LayoutGrid} title={tr("No tables set up")}
                message={tr("Ask the owner to add tables under More → Settings before booking.")} />
            ) : (
              Object.entries(grouped).map(([zoneName, list]) => (
                <div key={zoneName} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: c.textFaint, letterSpacing: "0.05em", marginBottom: 8 }}>{(zoneName === "No zone" ? tr("No zone") : zoneName).toUpperCase()}</div>
                  <div style={{ display: "grid", gridTemplateColumns: bp === "desktop" ? "repeat(3, 1fr)" : "1fr 1fr", gap: 10 }}>
                    {list.map((t) => {
                      const conflict = conflictFor(t);
                      const active = form.table === t.name;
                      return (
                        <button key={t.id} disabled={!!conflict} onClick={() => setForm({ ...form, table: t.name })} style={{
                          padding: "14px 10px", borderRadius: 14, cursor: conflict ? "not-allowed" : "pointer",
                          border: `1.5px solid ${active ? c.text : c.border}`, background: active ? c.surfaceAlt : c.surface,
                          opacity: conflict ? 0.45 : 1, textAlign: "left",
                        }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: c.text }}>{t.name}</div>
                          <div style={{ fontSize: 11.5, color: c.textSub }}>
                            {conflict ? `${tr("Booked at")} ${conflict.time} · ${conflict.name}` : `${tr("Seats")} ${t.capacity}`}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )
          )}
          {step === 3 && (
            <div style={{ fontSize: 14.5, color: c.text, lineHeight: 2 }}>
              <div><b>{form.name}</b> · {form.phone}</div>
              <div>{form.date} {tr("at")} {form.time} · {form.guests} {plural(form.guests, ["guest", "guests"], ["gost", "gosta", "gostiju"])}</div>
              <div>{form.table} · {form.duration} min</div>
            </div>
          )}
        </SectionCard>

        {editing && step === 3 && (
          <button onClick={() => setConfirmDelete(true)} style={{
            display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: c.rose,
            fontSize: 13.5, fontWeight: 600, cursor: "pointer", marginBottom: 16,
          }}>
            <Trash2 size={14} /> {tr("Delete reservation")}
          </button>
        )}

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <GhostButton c={c} onClick={() => step === 0 ? onClose() : setStep(step - 1)}><ChevronLeft size={15} /> {tr("Back")}</GhostButton>
          {step < 3 ? (
            <PrimaryButton c={c} disabled={!canNext()} onClick={() => setStep(step + 1)}>{tr("Next")} <ChevronRight size={15} /></PrimaryButton>
          ) : (
            <PrimaryButton c={c} onClick={submit}>{editing ? tr("Save changes") : tr("Confirm booking")}</PrimaryButton>
          )}
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog c={c} title={tr("Delete this reservation?")} message={LANG === "hr" ? `Rezervacija gosta ${editing.name} bit će trajno uklonjena.` : `${editing.name}'s booking will be permanently removed.`}
          confirmLabel={tr("Delete")} onCancel={() => setConfirmDelete(false)}
          onConfirm={() => { onDelete(editing.id); setConfirmDelete(false); onClose(); }} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shifts                                                              */
/* ------------------------------------------------------------------ */

function ShiftsScreen({ c, shifts, setShifts, staff, user }) {
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const dow = d.getDay();
    d.setDate(d.getDate() + ((dow === 0 ? -6 : 1) - dow));
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [addFor, setAddFor] = useState(null);
  const [newShift, setNewShift] = useState({ staffId: staff[0]?.id, start: "16:00", end: "23:00" });

  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });
  const locale = LANG === "hr" ? "hr-HR" : undefined;
  const iso = (d) => localDateIso(d);
  const canManage = user.role === "owner";
  const totalShifts = shifts.filter((s) => days.some((d) => iso(d) === s.day)).length;
  const staffOnDuty = new Set(shifts.filter((s) => days.some((d) => iso(d) === s.day)).map((s) => s.staffId)).size;

  const addShift = () => {
    if (!newShift.staffId) return;
    setShifts((prev) => [...prev, { id: uid(), day: addFor, staffId: newShift.staffId, start: newShift.start, end: newShift.end }]);
    setAddFor(null);
  };
  const removeShift = (id) => setShifts((prev) => prev.filter((s) => s.id !== id));

  return (
    <div style={{ padding: "0 20px 24px" }}>
      <div style={{ fontFamily: fontStack().display, fontSize: 26, fontWeight: 600, color: c.text, margin: "4px 0 2px" }}>{tr("Shifts")}</div>
      <div style={{ fontSize: 13.5, color: c.textSub, marginBottom: 18 }}>{tr("Weekly schedule and staff assignments.")}</div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); }} style={{ background: "none", border: "none", cursor: "pointer", color: c.text }}><ChevronLeft size={20} /></button>
        <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>
          {days[0].toLocaleDateString(locale, { month: "short", day: "numeric" })} – {days[6].toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })}
        </div>
        <button onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); }} style={{ background: "none", border: "none", cursor: "pointer", color: c.text }}><ChevronRight size={20} /></button>
      </div>
      <div style={{ display: "flex", gap: 16, fontSize: 12.5, color: c.textSub, marginBottom: 16 }}>
        <span><CalendarDays size={13} style={{ verticalAlign: -2 }} /> {totalShifts} {plural(totalShifts, ["shift", "shifts"], ["smjena", "smjene", "smjena"])}</span>
        <span><Users size={13} style={{ verticalAlign: -2 }} /> {staffOnDuty} {plural(staffOnDuty, ["staff", "staff"], ["djelatnik", "djelatnika", "djelatnika"])}</span>
      </div>

      {staff.length === 0 && (
        <EmptyState c={c} icon={Users} title={tr("No team members yet")}
          message={canManage ? tr("Add staff under More → Team before scheduling shifts.") : tr("Once staff are added, shifts will show up here.")} />
      )}

      {staff.length > 0 && days.map((d) => {
        const key = iso(d);
        const dayShifts = shifts.filter((s) => s.day === key);
        return (
          <SectionCard key={key} c={c} style={{ marginBottom: 12, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: dayShifts.length ? 10 : 0 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14.5, color: c.text }}>{d.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" })}</div>
                <div style={{ fontSize: 12, color: c.textFaint }}>{dayShifts.length === 0 ? tr("No shifts") : `${dayShifts.length} ${plural(dayShifts.length, ["shift", "shifts"], ["smjena", "smjene", "smjena"])}`}</div>
              </div>
              {canManage && (
                <button onClick={() => { setNewShift({ staffId: staff[0]?.id, start: "16:00", end: "23:00" }); setAddFor(key); }} style={{ width: 30, height: 30, borderRadius: 10, border: `1px solid ${c.border}`, background: c.surfaceAlt, color: c.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Plus size={15} />
                </button>
              )}
            </div>
            {dayShifts.map((s) => {
              const person = staffById(staff, s.staffId);
              if (!person) return null;
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: `1px solid ${c.border}` }}>
                  <Avatar c={c} name={person.name} role={person.role} size={30} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: c.text }}>{person.name}</div>
                    <div style={{ fontSize: 11.5, color: c.textSub }}>{s.start} – {s.end} · {tr(roleMeta(person.role).label)}</div>
                  </div>
                  {canManage && <button onClick={() => removeShift(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: c.textFaint }}><Trash2 size={15} /></button>}
                </div>
              );
            })}
          </SectionCard>
        );
      })}

      {addFor && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", zIndex: 60 }} onClick={() => setAddFor(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: c.surface, width: "100%", maxWidth: 520, margin: "0 auto", borderRadius: "24px 24px 0 0", padding: "22px 22px calc(22px + env(safe-area-inset-bottom, 0px))", fontFamily: fontStack().body, maxHeight: "88dvh", overflowY: "auto" }}>
            <div style={{ fontWeight: 700, fontSize: 17, color: c.text, marginBottom: 14 }}>{tr("Add shift")} · {formatDateLabel(addFor)}</div>
            <div style={{ fontSize: 13, color: c.textSub, marginBottom: 6 }}>{tr("Staff member")}</div>
            <select value={newShift.staffId} onChange={(e) => setNewShift({ ...newShift, staffId: e.target.value })}
              style={{ width: "100%", padding: 12, borderRadius: 12, border: `1px solid ${c.border}`, background: c.inputBg, color: c.text, marginBottom: 14, fontSize: 16, boxSizing: "border-box" }}>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.name} ({tr(roleMeta(s.role).label)})</option>)}
            </select>
            <div style={{ display: "flex", gap: 10 }}>
              <TextInput c={c} label={tr("Start")} type="time" value={newShift.start} onChange={(v) => setNewShift({ ...newShift, start: v })} />
              <TextInput c={c} label={tr("End")} type="time" value={newShift.end} onChange={(v) => setNewShift({ ...newShift, end: v })} />
            </div>
            <PrimaryButton c={c} full onClick={addShift}>{tr("Add shift")}</PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chat                                                                */
/* ------------------------------------------------------------------ */

function ChatScreen({ c, chat, setChat, staff, user, notify }) {
  const bp = useBreakpoint();
  const [channel, setChannel] = useState("general");
  const [text, setText] = useState("");
  const channels = [
    { key: "general", label: "General", icon: MessageSquare },
    { key: "floor", label: "Floor", icon: UtensilsCrossed },
    { key: "kitchen", label: "Kitchen", icon: ChefHat },
  ];
  const me = staff.find((s) => s.id === user.id);
  const allowed = canPost(channel, user.role);
  const messages = chat[channel] || [];

  const send = () => {
    if (!text.trim() || !allowed || !me) return;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setChat((prev) => ({ ...prev, [channel]: [...(prev[channel] || []), { id: uid(), staffId: me.id, text, time }] }));
    notify("chat", `${me.name} ${tr("posted in")} #${channel}: "${text.length > 40 ? text.slice(0, 40) + "…" : text}"`);
    setText("");
  };

  return (
    <div style={{ padding: "0 20px 0", display: "flex", flexDirection: "column", minHeight: 0, height: bp === "desktop" ? "calc(100dvh - 80px)" : "calc(100dvh - 210px)" }}>
      <div style={{ fontFamily: fontStack().display, fontSize: 26, fontWeight: 600, color: c.text, margin: "4px 0 14px" }}>{tr("Chat")}</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {channels.map((ch) => {
          const Icon = ch.icon;
          const active = channel === ch.key;
          return (
            <button key={ch.key} onClick={() => setChannel(ch.key)} style={{
              flex: 1, padding: "12px 6px", borderRadius: 16, cursor: "pointer",
              border: `1px solid ${active ? c.text : c.border}`, background: active ? c.surfaceAlt : c.surface,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            }}>
              <Icon size={16} color={active ? c.text : c.textFaint} />
              <span style={{ fontSize: 12.5, fontWeight: active ? 700 : 500, color: active ? c.text : c.textFaint }}>{tr(ch.label)}</span>
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 10 }}>
        {messages.length === 0 ? (
          <EmptyState c={c} icon={MessageSquare} title={tr("No messages yet")}
            message={allowed ? tr("Start the conversation with your team.") : tr("Nothing posted here yet.")} />
        ) : messages.map((m) => {
          const author = staffById(staff, m.staffId);
          const mine = author?.id === me?.id;
          const accent = author ? c[roleMeta(author.role).accentKey] : c.textFaint;
          return (
            <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4, flexDirection: mine ? "row-reverse" : "row" }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: accent }}>{mine ? tr("You") : author?.name || tr("Unknown")}</span>
                <span style={{ fontSize: 11, color: c.textFaint }}>{m.time}</span>
              </div>
              <div style={{
                maxWidth: "78%", padding: "10px 14px", borderRadius: 16, background: mine ? c.cta : c.surfaceAlt,
                color: mine ? c.ctaText : c.text, fontSize: 14, lineHeight: 1.4,
                borderTopRightRadius: mine ? 4 : 16, borderTopLeftRadius: mine ? 16 : 4,
              }}>
                {m.text}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: "10px 0 18px" }}>
        {allowed ? (
          <div style={{ display: "flex", gap: 8 }}>
            <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={`${tr("Message")} #${channel}`}
              style={{ flex: 1, minWidth: 0, padding: "12px 14px", borderRadius: 14, border: `1px solid ${c.border}`, background: c.inputBg, color: c.text, fontSize: 16, outline: "none", boxSizing: "border-box" }} />
            <button onClick={send} style={{ width: 46, borderRadius: 14, border: "none", background: c.cta, color: c.ctaText, cursor: "pointer" }}>
              <ChevronRight size={18} style={{ margin: "0 auto" }} />
            </button>
          </div>
        ) : (
          <div style={{ textAlign: "center", fontSize: 12.5, color: c.textFaint, padding: "10px 0" }}>{tr("Only the owner can send messages here")}</div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Analytics                                                          */
/* ------------------------------------------------------------------ */

function AnalyticsScreen({ c, reservations, shifts, staff, user }) {
  const bp = useBreakpoint();
  const isOwner = user.role === "owner";
  const totalRes = reservations.length;
  const totalGuests = reservations.reduce((a, r) => a + (Number(r.guests) || 0), 0);
  const confirmed = reservations.filter((r) => r.status === "confirmed").length;
  const completed = reservations.filter((r) => r.status === "completed").length;
  const cancelled = reservations.filter((r) => r.status === "cancelled").length;
  const noshow = reservations.filter((r) => r.status === "no-show").length;
  const occ = totalRes ? Math.round(((confirmed + completed) / totalRes) * 100) : 0;

  const byDate = useMemo(() => {
    const map = {};
    reservations.forEach((r) => { map[r.date] = map[r.date] || { date: r.date, reservations: 0 }; map[r.date].reservations += 1; });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [reservations]);

  const peakHours = useMemo(() => {
    const map = {};
    reservations.forEach((r) => { const h = (r.time || "").split(":")[0] + "h"; map[h] = (map[h] || 0) + 1; });
    return Object.entries(map).map(([hour, count]) => ({ hour, count })).sort((a, b) => a.hour.localeCompare(b.hour));
  }, [reservations]);

  const barColors = [c.green, c.amber, c.rose, c.blue, c.violet, c.blue, c.green];

  const myShifts = shifts.filter((s) => s.staffId === user.id);
  const myHours = myShifts.reduce((acc, s) => {
    const [sh, sm] = s.start.split(":").map(Number);
    let [eh, em] = s.end.split(":").map(Number);
    if (eh < sh) eh += 24;
    return acc + (eh + em / 60 - (sh + sm / 60));
  }, 0);

  if (!isOwner) {
    return (
      <div style={{ padding: "0 20px 24px" }}>
        <div style={{ fontFamily: fontStack().display, fontSize: 26, fontWeight: 600, color: c.text, margin: "4px 0 18px" }}>{tr("My Analytics")}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
          <StatCard c={c} label={tr("MY SHIFTS")} value={myShifts.length} icon={Clock} accent={c.amber} />
          <StatCard c={c} label={tr("HOURS SCHEDULED")} value={myHours.toFixed(0)} icon={BarChart3} accent={c.blue} />
        </div>
        <SectionCard c={c}>
          <div style={{ fontWeight: 700, color: c.text, marginBottom: 10 }}>{tr("This week")}</div>
          {myShifts.length === 0 ? (
            <EmptyState c={c} icon={Clock} title={tr("No shifts scheduled")} message={tr("Check back once the owner publishes the schedule.")} />
          ) : (
            <div style={{ fontSize: 13.5, color: c.textSub, lineHeight: 1.8 }}>
              {myShifts.map((s) => <div key={s.id}>{formatDateLabel(s.day)} · {s.start} – {s.end}</div>)}
            </div>
          )}
        </SectionCard>
      </div>
    );
  }

  if (totalRes === 0) {
    return (
      <div style={{ padding: "0 20px 24px" }}>
        <div style={{ fontFamily: fontStack().display, fontSize: 26, fontWeight: 600, color: c.text, margin: "4px 0 18px" }}>{tr("Analytics")}</div>
        <SectionCard c={c}>
          <EmptyState c={c} icon={BarChart3} title={tr("No data yet")} message={tr("Once reservations start coming in, trends and charts will appear here.")} />
        </SectionCard>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 20px 24px" }}>
      <div style={{ fontFamily: fontStack().display, fontSize: 26, fontWeight: 600, color: c.text, margin: "4px 0 18px" }}>{tr("Analytics")}</div>
      <div style={{ display: "grid", gridTemplateColumns: bp === "desktop" ? "repeat(4, 1fr)" : "1fr 1fr", gap: 14, marginBottom: 18 }}>
        <StatCard c={c} label={tr("TOTAL RESERVATIONS")} value={totalRes} icon={Check} accent={c.blue} />
        <StatCard c={c} label={tr("TOTAL GUESTS")} value={totalGuests} icon={Users} accent={c.rose} />
        <StatCard c={c} label={tr("OCCUPANCY RATE")} value={occ + "%"} icon={BarChart3} accent={c.blue} />
        <StatCard c={c} label={tr("NO-SHOWS")} value={noshow} icon={ArrowDownRight} accent={c.rose} />
      </div>

      <SectionCard c={c} style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: c.text, marginBottom: 12 }}>{tr("Reservations Over Time")}</div>
        <div style={{ width: "100%", height: 180 }}>
          <ResponsiveContainer>
            <LineChart data={byDate}>
              <CartesianGrid strokeDasharray="3 3" stroke={c.border} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: c.textFaint }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: c.textFaint }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, fontSize: 12 }} />
              <Line type="monotone" dataKey="reservations" stroke={c.blue} strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard c={c} style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: c.text, marginBottom: 12 }}>{tr("Peak Hours")}</div>
        <div style={{ width: "100%", height: 200 }}>
          <ResponsiveContainer>
            <BarChart data={peakHours}>
              <XAxis dataKey="hour" tick={{ fontSize: 11, fill: c.textFaint }} />
              <YAxis tick={{ fontSize: 10, fill: c.textFaint }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {peakHours.map((_, i) => <Cell key={i} fill={barColors[i % barColors.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard c={c}>
        <div style={{ fontWeight: 700, color: c.text, marginBottom: 14 }}>{tr("Booking Status Breakdown")}</div>
        <div style={{ display: "grid", gridTemplateColumns: bp === "desktop" ? "repeat(4, 1fr)" : "1fr 1fr", gap: 12 }}>
          {[["Confirmed", confirmed, c.green], ["Completed", completed, c.blue], ["Cancelled", cancelled, c.rose], ["No-shows", noshow, c.amber]].map(([label, val, color]) => (
            <div key={label} style={{ background: c.surfaceAlt, borderRadius: 14, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: c.textSub, marginBottom: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: color, display: "inline-block" }} /> {tr(label)}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: c.text }}>{val}</div>
              <div style={{ fontSize: 11.5, color: c.textFaint }}>{totalRes ? Math.round((val / totalRes) * 100) : 0}%</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Team / Staff                                                        */
/* ------------------------------------------------------------------ */

function CredentialsModal({ c, account, restaurant, onClose }) {
  const [copied, setCopied] = useState(false);
  const text = `${tr("ORDIORA login for")} ${restaurant.name}\n${tr("Restaurant")}: ${restaurant.name}\n${tr("Password")}: ${account.password}`;
  const copy = () => {
    copyToClipboard(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70, padding: 20 }}>
      <div style={{ background: c.surface, borderRadius: 24, padding: 26, width: "100%", maxWidth: 380, fontFamily: fontStack().body }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: c.green + "1A", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <CheckCircle2 size={22} color={c.green} />
        </div>
        <div style={{ fontWeight: 700, fontSize: 18, color: c.text, marginBottom: 4 }}>{account.name} {tr("added")}</div>
        <div style={{ fontSize: 13.5, color: c.textSub, marginBottom: 18 }}>{tr("Share these login details with them — they sign in with the restaurant name and this password. You can view the password again anytime from the Team list.")}</div>
        <div style={{ background: c.surfaceAlt, borderRadius: 14, padding: 16, marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: c.textFaint, fontWeight: 700, letterSpacing: "0.05em", marginBottom: 3 }}>{tr("RESTAURANT")}</div>
          <div style={{ fontSize: 14.5, color: c.text, fontWeight: 600, marginBottom: 12 }}>{restaurant.name}</div>
          <div style={{ fontSize: 11, color: c.textFaint, fontWeight: 700, letterSpacing: "0.05em", marginBottom: 3 }}>{tr("PASSWORD")}</div>
          <div style={{ fontSize: 14.5, color: c.text, fontWeight: 600, fontFamily: "monospace" }}>{account.password}</div>
        </div>
        <PrimaryButton c={c} full onClick={copy} style={{ marginBottom: 10 }}>
          {copied ? <><Check size={16} /> {tr("Copied")}</> : <><Copy size={16} /> {tr("Copy details")}</>}
        </PrimaryButton>
        <GhostButton c={c} full onClick={onClose}>{tr("Done")}</GhostButton>
      </div>
    </div>
  );
}

function RecoveryCodeModal({ c, code, restaurant, onClose }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    copyToClipboard(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 75, padding: 20 }}>
      <div style={{ background: c.surface, borderRadius: 24, padding: 26, width: "100%", maxWidth: 380, fontFamily: fontStack().body }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: c.amber + "1A", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <KeyRound size={22} color={c.amber} />
        </div>
        <div style={{ fontWeight: 700, fontSize: 18, color: c.text, marginBottom: 4 }}>{tr("Save your recovery code")}</div>
        <div style={{ fontSize: 13.5, color: c.textSub, marginBottom: 18 }}>
          {tr("If you ever forget your password, this code lets you reset it on the sign-in screen. Store it somewhere safe — you can view it again anytime in Settings.")}
        </div>
        <div style={{ background: c.surfaceAlt, borderRadius: 14, padding: 16, marginBottom: 18, textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: c.text, letterSpacing: "0.14em", fontFamily: "monospace" }}>{code}</div>
        </div>
        <PrimaryButton c={c} full onClick={copy} style={{ marginBottom: 10 }}>
          {copied ? <><Check size={16} /> {tr("Copied")}</> : <><Copy size={16} /> {tr("Copy code")}</>}
        </PrimaryButton>
        <GhostButton c={c} full onClick={onClose}>{tr("I've saved it")}</GhostButton>
      </div>
    </div>
  );
}

function StaffScreen({ c, staff, setStaff, user, restaurant, onPasswordChanged }) {
  const canManage = user.role === "owner";
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", role: "waiter", phone: "" });
  const [justAdded, setJustAdded] = useState(null);
  const [revealed, setRevealed] = useState({});
  const [removeTarget, setRemoveTarget] = useState(null);
  const [pwTarget, setPwTarget] = useState(null); // staff member whose password is being changed
  const [pwValue, setPwValue] = useState("");
  const [pwErr, setPwErr] = useState("");

  const openReset = (s) => { setPwErr(""); setPwValue(generatePassword()); setPwTarget(s); };
  const saveReset = () => {
    const next = pwValue.trim();
    if (next.length < 6) { setPwErr(tr("At least 6 characters.")); return; }
    if (staff.some((a) => a.id !== pwTarget.id && a.password === next)) { setPwErr(tr("That password is already in use by another account.")); return; }
    setStaff((prev) => prev.map((a) => a.id === pwTarget.id ? { ...a, password: next } : a));
    if (onPasswordChanged) onPasswordChanged(pwTarget.id, next);
    setRevealed((r) => ({ ...r, [pwTarget.id]: true }));
    setPwTarget(null);
  };

  const add = () => {
    if (!form.name.trim()) return;
    const account = {
      id: uid(), name: form.name.trim(), role: form.role, phone: form.phone.trim(),
      email: generateEmail(form.name, restaurant.slug, staff),
      password: generatePassword(),
    };
    setStaff((prev) => [...prev, account]);
    setForm({ name: "", role: "waiter", phone: "" });
    setAdding(false);
    setJustAdded(account);
  };
  const confirmRemove = () => {
    setStaff((prev) => prev.filter((s) => s.id !== removeTarget.id));
    setRemoveTarget(null);
  };

  const nonOwnerCount = staff.filter((s) => s.role !== "owner").length;

  return (
    <div style={{ padding: "0 20px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "4px 0 18px" }}>
        <div style={{ fontFamily: fontStack().display, fontSize: 26, fontWeight: 600, color: c.text }}>{tr("Team")}</div>
        {canManage && (
          <button onClick={() => setAdding(true)} style={{ width: 40, height: 40, borderRadius: 13, background: c.cta, border: "none", color: c.ctaText, cursor: "pointer" }}><Plus size={18} style={{ margin: "0 auto" }} /></button>
        )}
      </div>

      {nonOwnerCount === 0 ? (
        <EmptyState c={c} icon={Users} title={tr("Build your team")}
          message={canManage ? tr("Add waiters and chefs — we'll generate their login for you.") : tr("The owner hasn't added any staff yet.")}
          actionLabel={canManage ? tr("Add team member") : null} onAction={() => setAdding(true)} />
      ) : (
        staff.map((s) => (
          <div key={s.id} style={{ padding: "12px 16px", borderRadius: 16, border: `1px solid ${c.border}`, background: c.surface, marginBottom: 10, boxShadow: c.shadow }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar c={c} name={s.name} role={s.role} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, color: c.text }}>{s.name}{s.id === user.id ? " " + tr("(you)") : ""}</div>
                <div style={{ fontSize: 12.5, color: c.textSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.email}</div>
              </div>
              <Badge c={c} label={tr(roleMeta(s.role).label)} color={c[roleMeta(s.role).accentKey]} />
              {canManage && s.role !== "owner" && (
                <button onClick={() => setRemoveTarget(s)} style={{ background: "none", border: "none", cursor: "pointer", color: c.textFaint }}><Trash2 size={16} /></button>
              )}
            </div>
            {canManage && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${c.border}`, display: "flex", alignItems: "center", gap: 8 }}>
                <KeyRound size={13} color={c.textFaint} />
                <span style={{ fontSize: 12.5, color: c.textSub, fontFamily: revealed[s.id] ? "monospace" : "inherit", flex: 1 }}>
                  {revealed[s.id] ? s.password : "••••••••••"}
                </span>
                <button onClick={() => setRevealed((r) => ({ ...r, [s.id]: !r[s.id] }))} style={{ background: "none", border: "none", cursor: "pointer", color: c.textFaint, display: "flex" }}>
                  {revealed[s.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={() => openReset(s)} style={{ background: "none", border: `1px solid ${c.border}`, borderRadius: 8, padding: "4px 10px", cursor: "pointer", color: c.textSub, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                  {tr("Change")}
                </button>
              </div>
            )}
          </div>
        ))
      )}

      {adding && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", zIndex: 60 }} onClick={() => setAdding(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: c.surface, width: "100%", maxWidth: 520, margin: "0 auto", borderRadius: "24px 24px 0 0", padding: "22px 22px calc(22px + env(safe-area-inset-bottom, 0px))", maxHeight: "88dvh", overflowY: "auto" }}>
            <div style={{ fontWeight: 700, fontSize: 17, color: c.text, marginBottom: 4 }}>{tr("Add team member")}</div>
            <div style={{ fontSize: 12.5, color: c.textFaint, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <KeyRound size={13} /> {tr("We'll generate their email and password automatically.")}
            </div>
            <TextInput c={c} label={tr("Full name")} value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder={tr("e.g. Jane Waiter")} />
            <TextInput c={c} label={tr("Phone (optional)")} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+385-91-000-0000" />
            <div style={{ fontSize: 13, color: c.textSub, marginBottom: 8 }}>{tr("Role")}</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              {["waiter", "chef"].map((r) => (
                <button key={r} onClick={() => setForm({ ...form, role: r })} style={{
                  flex: 1, padding: "10px", borderRadius: 12, cursor: "pointer",
                  border: `1.5px solid ${form.role === r ? c.text : c.border}`, background: form.role === r ? c.surfaceAlt : c.surface, color: c.text, fontWeight: 600, fontSize: 13.5,
                }}>{tr(ROLE_META[r].label)}</button>
              ))}
            </div>
            <PrimaryButton c={c} full disabled={!form.name.trim()} onClick={add}>{tr("Create account")}</PrimaryButton>
          </div>
        </div>
      )}

      {pwTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", zIndex: 60 }} onClick={() => setPwTarget(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: c.surface, width: "100%", maxWidth: 520, margin: "0 auto", borderRadius: "24px 24px 0 0", padding: "22px 22px calc(22px + env(safe-area-inset-bottom, 0px))", maxHeight: "88dvh", overflowY: "auto" }}>
            <div style={{ fontWeight: 700, fontSize: 17, color: c.text, marginBottom: 4 }}>{tr("Change password · ")}{pwTarget.name}</div>
            <div style={{ fontSize: 12.5, color: c.textFaint, marginBottom: 14 }}>{tr("Set a new password and share it with them. It replaces their old one immediately.")}</div>
            <TextInput c={c} label={tr("New password")} value={pwValue} onChange={(v) => { setPwValue(v); setPwErr(""); }} error={pwErr} hint={tr("They sign in with the restaurant name and this password.")} />
            <GhostButton c={c} full onClick={() => setPwValue(generatePassword())} style={{ marginBottom: 12 }}>
              <KeyRound size={15} /> {tr("Generate a new one")}
            </GhostButton>
            <PrimaryButton c={c} full disabled={pwValue.trim().length < 6} onClick={saveReset}>{tr("Save password")}</PrimaryButton>
          </div>
        </div>
      )}
      {justAdded && <CredentialsModal c={c} account={justAdded} restaurant={restaurant} onClose={() => setJustAdded(null)} />}
      {removeTarget && (
        <ConfirmDialog c={c} title={LANG === "hr" ? `Ukloniti ${removeTarget.name}?` : `Remove ${removeTarget.name}?`} message={tr("They'll lose access immediately. This can't be undone.")}
          confirmLabel={tr("Remove")} onCancel={() => setRemoveTarget(null)} onConfirm={confirmRemove} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  More / Settings                                                     */
/* ------------------------------------------------------------------ */

function MoreScreen({ c, user, restaurant, setView, isDark, setIsDark, onSignOut, onSwitchWorkspace }) {
  const rows = [
    { label: "Order supplies", icon: ShoppingCart, accent: c.green, action: () => setView("orders") },
    { label: "Shifts", icon: Clock, accent: c.amber, action: () => setView("shifts") },
    { label: "Team", icon: Users, accent: c.blue, action: () => setView("staff") },
    ...(user.role === "owner" || user.role === "waiter"
      ? [{ label: "Follow-ups", icon: Mail, accent: c.blue, action: () => setView("followups") }]
      : []),
    { label: "Settings", icon: SettingsIcon, accent: c.violet, action: () => setView("settings") },
  ];
  return (
    <div style={{ padding: "0 20px 24px" }}>
      <div style={{ fontFamily: fontStack().display, fontSize: 26, fontWeight: 600, color: c.text, margin: "4px 0 18px" }}>{tr("More")}</div>
      <SectionCard c={c} style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
        <Avatar c={c} name={user.name} role={user.role} size={46} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 15.5, color: c.text }}>{user.name}</div>
          <div style={{ fontSize: 13, color: c.textSub }}>{tr(roleMeta(user.role).label)} · {restaurant?.name}</div>
        </div>
      </SectionCard>
      <SectionCard c={c} style={{ padding: 6, marginBottom: 16 }}>
        {rows.map((r, i) => {
          const Icon = r.icon;
          return (
            <button key={r.label} onClick={r.action} style={{
              display: "flex", alignItems: "center", gap: 14, width: "100%", background: "none", border: "none",
              padding: "12px 12px", borderTop: i ? `1px solid ${c.border}` : "none", cursor: "pointer", textAlign: "left",
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 11, background: r.accent + "1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={16} color={r.accent} />
              </div>
              <span style={{ flex: 1, fontWeight: 600, fontSize: 14.5, color: c.text }}>{tr(r.label)}</span>
              <ChevronRight size={16} color={c.textFaint} />
            </button>
          );
        })}
      </SectionCard>
      <SectionCard c={c} style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isDark ? <Moon size={18} color={c.text} /> : <Sun size={18} color={c.text} />}
          <span style={{ fontWeight: 600, fontSize: 14.5, color: c.text }}>{isDark ? tr("Dark mode") : tr("Light mode")}</span>
        </div>
        <button onClick={() => setIsDark(!isDark)} style={{ width: 50, height: 30, borderRadius: 999, background: isDark ? c.green : c.border, border: "none", cursor: "pointer", position: "relative" }}>
          <span style={{ position: "absolute", top: 3, left: isDark ? 23 : 3, width: 24, height: 24, borderRadius: 999, background: "#fff", transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
        </button>
      </SectionCard>
      <GhostButton c={c} full onClick={onSwitchWorkspace} style={{ marginBottom: 10 }}>
        <Store size={16} /> {tr("Switch restaurant")}
      </GhostButton>
      <GhostButton c={c} full onClick={onSignOut} style={{ color: c.rose, borderColor: c.rose + "44" }}>
        <LogOut size={16} /> {tr("Sign out")}
      </GhostButton>
    </div>
  );
}

function SettingsScreen({ c, user, isDark, setIsDark, lang, setLang, restaurant, setRestaurant, tables, setTables, accounts, setAccounts, onPasswordChanged }) {
  const canManage = user.role === "owner";
  const [restName, setRestName] = useState(restaurant.name);
  const [savedRest, setSavedRest] = useState(false);

  const [reviewUrl, setReviewUrl] = useState(restaurant.googleReviewUrl || "");
  const [savedReview, setSavedReview] = useState(false);
  const [reviewErr, setReviewErr] = useState("");
  const saveReviewUrl = () => {
    const v = reviewUrl.trim();
    if (v && !/^https?:\/\/\S+/i.test(v)) { setReviewErr(tr("Enter a full link starting with https://")); return; }
    setReviewErr("");
    setRestaurant({ ...restaurant, googleReviewUrl: v });
    setSavedReview(true);
    setTimeout(() => setSavedReview(false), 1500);
  };

  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passMsg, setPassMsg] = useState("");
  const [passErr, setPassErr] = useState("");

  const [revealCode, setRevealCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const setRecoveryCode = (code) => setRestaurant({ ...restaurant, recoveryCode: code });
  const copyCode = () => {
    copyToClipboard(restaurant.recoveryCode || "").then(() => { setCopiedCode(true); setTimeout(() => setCopiedCode(false), 1500); }).catch(() => {});
  };

  const saveRestaurant = () => {
    if (!restName.trim()) return;
    setRestaurant({ ...restaurant, name: restName.trim() });
    setSavedRest(true);
    setTimeout(() => setSavedRest(false), 1500);
  };

  const changePassword = () => {
    setPassErr(""); setPassMsg("");
    const me = accounts.find((a) => a.id === user.id);
    if (!me || me.password !== curPass) { setPassErr(tr("Current password is incorrect.")); return; }
    if (newPass.length < 6) { setPassErr(tr("New password must be at least 6 characters.")); return; }
    if (newPass !== confirmPass) { setPassErr(tr("New passwords don't match.")); return; }
    // Passwords are the login discriminator within a restaurant — keep them unique.
    if (accounts.some((a) => a.id !== user.id && a.password === newPass)) { setPassErr(tr("That password is already in use by another account. Choose a different one.")); return; }
    setAccounts((prev) => prev.map((a) => a.id === user.id ? { ...a, password: newPass } : a));
    if (onPasswordChanged) onPasswordChanged(user.id, newPass);
    setCurPass(""); setNewPass(""); setConfirmPass("");
    setPassMsg(tr("Password updated."));
    setTimeout(() => setPassMsg(""), 2000);
  };

  return (
    <div style={{ padding: "0 20px 24px" }}>
      <div style={{ fontFamily: fontStack().display, fontSize: 26, fontWeight: 600, color: c.text, margin: "4px 0 18px" }}>{tr("Settings")}</div>

      <SectionCard c={c} style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: c.text, marginBottom: 14 }}>{tr("Language")}</div>
        <div style={{ display: "flex", gap: 10 }}>
          {[{ k: "hr", label: "Hrvatski" }, { k: "en", label: "English" }].map((opt) => {
            const active = lang === opt.k;
            return (
              <button key={opt.k} onClick={() => setLang(opt.k)} style={{
                flex: 1, padding: "14px", borderRadius: 16, cursor: "pointer",
                border: `1.5px solid ${active ? c.text : c.border}`, background: active ? c.surfaceAlt : c.surface,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                fontSize: 14, fontWeight: 600, color: c.text,
              }}>
                {active && <Check size={15} />} {opt.label}
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard c={c} style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: c.text, marginBottom: 14 }}>{tr("Appearance")}</div>
        <div style={{ display: "flex", gap: 10 }}>
          {[{ k: false, label: "Light", icon: Sun }, { k: true, label: "Dark", icon: Moon }].map((opt) => {
            const Icon = opt.icon; const active = isDark === opt.k;
            return (
              <button key={opt.label} onClick={() => setIsDark(opt.k)} style={{
                flex: 1, padding: "16px", borderRadius: 16, cursor: "pointer",
                border: `1.5px solid ${active ? c.text : c.border}`, background: active ? c.surfaceAlt : c.surface,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              }}>
                <Icon size={20} color={c.text} />
                <span style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{tr(opt.label)}</span>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {canManage && (
        <SectionCard c={c} style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: c.text, marginBottom: 4 }}>{tr("Restaurant")}</div>
          <div style={{ fontSize: 12.5, color: c.textFaint, marginBottom: 14 }}>{tr("Update your restaurant's name.")}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <input value={restName} onChange={(e) => setRestName(e.target.value)}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${c.border}`, background: c.inputBg, color: c.text, fontSize: 16, boxSizing: "border-box" }} />
            </div>
            <PrimaryButton c={c} onClick={saveRestaurant} style={{ padding: "12px 18px" }}>{savedRest ? <Check size={16} /> : tr("Save")}</PrimaryButton>
          </div>
        </SectionCard>
      )}

      {canManage && (
        <SectionCard c={c} style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: c.text, marginBottom: 4 }}>{tr("Google reviews")}</div>
          <div style={{ fontSize: 12.5, color: c.textFaint, marginBottom: 14 }}>{tr("Set the link guests use to leave a review — used by Follow-ups.")}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <input value={reviewUrl} onChange={(e) => { setReviewUrl(e.target.value); setReviewErr(""); }} placeholder="https://g.page/r/..." inputMode="url"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${reviewErr ? c.rose : c.border}`, background: c.inputBg, color: c.text, fontSize: 16, boxSizing: "border-box" }} />
            </div>
            <PrimaryButton c={c} onClick={saveReviewUrl} style={{ padding: "12px 18px" }}>{savedReview ? <Check size={16} /> : tr("Save")}</PrimaryButton>
          </div>
          {reviewErr
            ? <div style={{ fontSize: 12, color: c.rose, marginTop: 8 }}>{reviewErr}</div>
            : <div style={{ fontSize: 12, color: c.textFaint, marginTop: 8 }}>{tr("Paste the review link from your Google Business Profile.")}</div>}
        </SectionCard>
      )}

      {canManage && (
        <SectionCard c={c} style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: c.text, marginBottom: 4 }}>{tr("Tables")}</div>
          <div style={{ fontSize: 12.5, color: c.textFaint, marginBottom: 14 }}>{tr("Manage the tables staff can assign reservations to, grouped by section.")}</div>
          <TableManager c={c} tables={tables} setTables={setTables} />
        </SectionCard>
      )}

      {canManage && (
        <SectionCard c={c} style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: c.text, marginBottom: 4 }}>{tr("Recovery code")}</div>
          <div style={{ fontSize: 12.5, color: c.textFaint, marginBottom: 14 }}>
            {tr("If you ever forget your password, use this code on the sign-in screen (\"Forgot password?\") to set a new one. Keep it somewhere safe — anyone with it can reset the owner password.")}
          </div>
          {restaurant.recoveryCode ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: c.surfaceAlt, borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
                <KeyRound size={15} color={c.textFaint} />
                <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: c.text, letterSpacing: "0.08em", fontFamily: revealCode ? "monospace" : "inherit" }}>
                  {revealCode ? restaurant.recoveryCode : "••••••••"}
                </span>
                <button onClick={() => setRevealCode((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: c.textFaint, display: "flex" }}>
                  {revealCode ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <GhostButton c={c} full onClick={copyCode}>{copiedCode ? <><Check size={15} /> {tr("Copied")}</> : <><Copy size={15} /> {tr("Copy")}</>}</GhostButton>
                <GhostButton c={c} full onClick={() => { setRecoveryCode(generateRecoveryCode()); setRevealCode(true); }}>{tr("Regenerate")}</GhostButton>
              </div>
            </>
          ) : (
            <PrimaryButton c={c} full onClick={() => { setRecoveryCode(generateRecoveryCode()); setRevealCode(true); }}>
              <KeyRound size={15} /> {tr("Generate recovery code")}
            </PrimaryButton>
          )}
        </SectionCard>
      )}

      <SectionCard c={c} style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: c.text, marginBottom: 4 }}>{tr("Change password")}</div>
        <div style={{ fontSize: 12.5, color: c.textFaint, marginBottom: 14 }}>{tr("Update the password you use to sign in.")}</div>
        <TextInput c={c} label={tr("Current password")} type="password" value={curPass} onChange={setCurPass} />
        <TextInput c={c} label={tr("New password")} type="password" value={newPass} onChange={setNewPass} />
        <TextInput c={c} label={tr("Confirm new password")} type="password" value={confirmPass} onChange={setConfirmPass} error={passErr} />
        {passMsg && <div style={{ fontSize: 12.5, color: c.green, marginBottom: 12 }}>{passMsg}</div>}
        <PrimaryButton c={c} full disabled={!curPass || !newPass || !confirmPass} onClick={changePassword}>{tr("Update password")}</PrimaryButton>
      </SectionCard>

      <SectionCard c={c}>
        <div style={{ fontWeight: 700, color: c.text, marginBottom: 10 }}>{tr("Account")}</div>
        <div style={{ fontSize: 13.5, color: c.textSub, lineHeight: 1.9 }}>
          <div>{tr("Restaurant")}: <b style={{ color: c.text }}>{restaurant.name}</b></div>
          <div>{tr("Signed in as")} <b style={{ color: c.text }}>{user.name}</b></div>
          <div>{tr("Role")}: {tr(roleMeta(user.role).label)}</div>
        </div>
      </SectionCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Follow-ups — invite completed guests to leave a Google review      */
/* ------------------------------------------------------------------ */

function FollowUpsScreen({ c, reservations, setReservations, restaurant, setView }) {
  const [active, setActive] = useState(null);   // reservation whose sheet is open
  const [bodyText, setBodyText] = useState("");
  const [copied, setCopied] = useState(false);

  const reviewUrl = (restaurant && restaurant.googleReviewUrl) || "";

  const list = useMemo(() => reservations
    .filter((r) => r.status === "completed" && r.email && r.email.trim() && !r.followUpSent)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)),
  [reservations]);

  const firstName = (name) => (name || "").trim().split(/\s+/)[0] || (name || "");
  const shortDate = (d) => { const p = (d || "").split("-"); return p.length === 3 ? `${p[2]}.${p[1]}.` : (d || ""); };
  const restName = (restaurant && restaurant.name) || "";
  const subjectFor = (r) => LANG === "hr"
    ? `Hvala na posjeti, ${firstName(r.name)}`
    : `Thanks for visiting, ${firstName(r.name)}`;
  const bodyFor = (r) => LANG === "hr"
    ? `Pozdrav ${firstName(r.name)},\n\n` +
      `hvala što ste nas posjetili ${shortDate(r.date)}. Nadamo se da je bilo lijepo.\n\n` +
      `Ako imate minutu, vaša recenzija nam puno znači:\n${reviewUrl}\n\n` +
      `Srdačan pozdrav,\n${restName}`
    : `Hello ${firstName(r.name)},\n\n` +
      `thank you for visiting us on ${shortDate(r.date)}. We hope you had a great time.\n\n` +
      `If you have a minute, your review means a lot to us:\n${reviewUrl}\n\n` +
      `Warm regards,\n${restName}`;

  const openGuest = (r) => { setBodyText(bodyFor(r)); setCopied(false); setActive(r); };
  const copy = () => { copyToClipboard(bodyText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {}); };
  const openMail = () => {
    if (!active) return;
    window.location.href = `mailto:${encodeURIComponent(active.email)}?subject=${encodeURIComponent(subjectFor(active))}&body=${encodeURIComponent(bodyText)}`;
  };
  const markSent = () => {
    if (!active) return;
    const id = active.id;
    setReservations((prev) => prev.map((x) => x.id === id ? { ...x, followUpSent: true } : x));
    setActive(null);
  };

  return (
    <div style={{ padding: "0 20px 24px" }}>
      <div style={{ fontFamily: fontStack().display, fontSize: 26, fontWeight: 600, color: c.text, margin: "4px 0 2px" }}>{tr("Follow-ups")}</div>
      <div style={{ fontSize: 13.5, color: c.textSub, marginBottom: 16 }}>{tr("Invite guests to leave a Google review after their visit.")}</div>

      {!reviewUrl && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: c.surfaceAlt, borderRadius: 14, padding: "12px 14px", marginBottom: 16 }}>
          <div style={{ flex: 1, fontSize: 13, color: c.textSub }}>{tr("Add your Google review link so guests can leave a review.")}</div>
          <GhostButton c={c} onClick={() => setView("settings")} style={{ padding: "8px 14px", flexShrink: 0 }}>{tr("Settings")}</GhostButton>
        </div>
      )}

      {list.length === 0 ? (
        <EmptyState c={c} icon={Mail} title={tr("No follow-ups yet")}
          message={tr("Guests appear here once their reservation is marked completed, so you can invite them to leave a review.")} />
      ) : (
        list.map((r) => (
          <button key={r.id} onClick={() => openGuest(r)} style={{
            width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, marginBottom: 8,
            border: `1px solid ${c.border}`, background: c.surface, boxShadow: c.shadow, cursor: "pointer",
          }}>
            <Avatar c={c} name={r.name} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: c.text }}>{r.name}</div>
              <div style={{ fontSize: 12.5, color: c.textSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.email}</div>
              <div style={{ fontSize: 12, color: c.textFaint, marginTop: 2 }}>{formatDateLabel(r.date)} · {r.table}</div>
            </div>
            <ChevronRight size={16} color={c.textFaint} />
          </button>
        ))
      )}

      {active && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", zIndex: 60 }} onClick={() => setActive(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: c.surface, width: "100%", maxWidth: 520, margin: "0 auto", borderRadius: "24px 24px 0 0", padding: "22px 22px calc(22px + env(safe-area-inset-bottom, 0px))", maxHeight: "90dvh", overflowY: "auto", fontFamily: fontStack().body }}>
            <div style={{ fontWeight: 700, fontSize: 17, color: c.text, marginBottom: 4 }}>{tr("Review request · ")}{firstName(active.name)}</div>
            <div style={{ fontSize: 12.5, color: c.textFaint, marginBottom: 14 }}>{active.email}</div>
            <div style={{ fontSize: 13, color: c.textSub, marginBottom: 6, fontWeight: 500 }}>{tr("Subject")}</div>
            <div style={{ background: c.surfaceAlt, borderRadius: 10, padding: "10px 12px", fontSize: 14, color: c.text, marginBottom: 14 }}>{subjectFor(active)}</div>
            <div style={{ fontSize: 13, color: c.textSub, marginBottom: 6, fontWeight: 500 }}>{tr("Message")}</div>
            <textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} rows={9}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${c.border}`, background: c.inputBg, color: c.text, fontSize: 16, boxSizing: "border-box", resize: "vertical", fontFamily: fontStack().body, outline: "none", lineHeight: 1.5 }} />
            <div style={{ display: "flex", gap: 8, margin: "14px 0 10px" }}>
              <PrimaryButton c={c} full onClick={copy}>{copied ? <><Check size={16} /> {tr("Copied")}</> : <><Copy size={16} /> {tr("Copy")}</>}</PrimaryButton>
              <GhostButton c={c} full onClick={openMail}><Mail size={16} /> {tr("Open in mail")}</GhostButton>
            </div>
            <PrimaryButton c={c} full onClick={markSent}><Check size={16} /> {tr("Mark as sent")}</PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Supplies ordering — catalog + import (OCR / PDF) + CSV export       */
/* ------------------------------------------------------------------ */

const ORDER_UNITS = ["kom", "kg", "L"];

/* ---- Menu parsing (heuristic, no AI) --------------------------------
   Two entry points:
     extractMenuItems(text) — aggressive: used to turn raw OCR / PDF text into a
        clean starting list (drops prices, section headers and descriptions, and
        shortens dish preparations like "Hobotnica na žaru" → "Hobotnica").
     parseItemLines(text)   — lenient: used for the live item count and the final
        "Add" once the person has curated the textarea (trusts their lines, only
        strips prices/bullets and shortens preparation).
   Neither is perfect — the review textarea is always the final say. */

// Common Croatian menu section headers to drop (normalised, no diacritics).
const MENU_HEADERS = new Set([
  "predjela", "hladna predjela", "topla predjela", "juhe", "juha", "salate", "salata",
  "glavna jela", "glavno jelo", "jela", "specijaliteti", "riba", "ribe", "riblja jela",
  "morski plodovi", "meso", "mesna jela", "rostilj", "sa zara", "tjestenina", "tjestenine",
  "paste", "njoki", "rizoto", "rizota", "pizza", "pizze", "deserti", "desert", "slastice",
  "sladoled", "pica", "napitci", "napici", "topli napitci", "hladni napitci",
  "bezalkoholna pica", "alkoholna pica", "vina", "vino", "bijela vina", "crna vina",
  "pjenusci", "pivo", "piva", "toceno pivo", "rakije", "rakija", "zestoka pica", "zestica",
  "kava", "kave", "caj", "cajevi", "prilozi", "prilog", "umaci", "dorucak", "rucak",
  "vecera", "jelovnik", "cjenik", "cijene", "ponuda", "dnevni meni", "meni", "menu",
  "a la carte", "dodaci", "sirevi", "sir",
]);

// Prepositions that introduce a dish's preparation — cut the name here.
const PREP_CUT = /\s+(?:na|sa|s|u|uz)\s+/i;

function normName(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

// A real supply/product name is short; anything longer is a run-on blob.
const MAX_NAME_LEN = 48;

// Collapse letter-spaced titles ("B I S T R O" \u2192 "BISTRO") so they don't turn
// into a swarm of one-letter items. No-op on normal lines.
function collapseLetterSpacing(line) {
  const tokens = (line || "").split(/\s+/).filter(Boolean);
  if (tokens.length < 4) return line;
  const singles = tokens.filter((t) => t.length === 1 && /\p{L}/u.test(t)).length;
  if (singles / tokens.length <= 0.6) return line;
  return line.replace(/(?<=\p{L})\s+(?=\p{L}(?:\s|$))/gu, "");
}

// Strip a leading menu-category header from a line ("GLAVNA JELA Filet\u2026" \u2192 "Filet\u2026").
function stripLeadingHeader(seg) {
  let s = (seg || "").trim();
  for (let guard = 0; guard < 4; guard++) {
    let stripped = false;
    for (const h of MENU_HEADERS) {
      const n = h.split(" ").length;
      const prefix = s.split(/\s+/).slice(0, n).join(" ");
      if (prefix && normName(prefix) === h) { s = s.split(/\s+/).slice(n).join(" ").trim(); stripped = true; break; }
    }
    if (!stripped) break;
  }
  return s;
}

// Split a run-on line into candidate segments (sentence ends / big gaps / bullets).
function splitRunOn(line) {
  return (line || "").split(/(?:\.\s+|!\s+|\s{2,}|[\u00b7\u2022\u2022])/).map((s) => s.trim()).filter(Boolean);
}

function firstWords(s, n) {
  return (s || "").split(/\s+/).filter(Boolean).slice(0, n).join(" ");
}

function basicClean(raw) {
  let s = collapseLetterSpacing((raw || "").replace(/\t/g, " "));
  // leading list numbering / bullets: "1. ", "12) ", "- ", "•"
  s = s.replace(/^\s*(?:\d{1,3}\s*[.)\-–]\s+|[\-•*·—>]+\s*)/, "");
  // leading measure/volume: "0,5 l ", "0,33 ", "2 kg " (but not "7 UP")
  s = s.replace(/^\s*(?:\d{1,2}[.,]\d{1,2}\s*(?:l|dl|cl|ml|g|kg|kom)?|\d{1,2}\s*(?:l|dl|cl|ml|g|kg|kom))\s+/i, "");
  // trailing allergen markers "(1,3,7)" / "[..]" / "*"
  s = s.replace(/\s*[([][\d,\s.]+[)\]]\s*$/, "").replace(/\*+\s*$/, "");
  // trailing dot-leaders + price / volume, applied repeatedly so both a volume
  // and a price get removed: "Coca Cola 0,33 ... 25 kn" → "Coca Cola"
  const trailing = /[\s.·•–—]*\b\d{1,4}(?:[.,]\d{1,2})?\s*(?:kn|km|hrk|eur|€|\$|l|dl|cl|ml|g|kg)?\.?\s*$/i;
  let prev;
  do { prev = s; s = s.replace(trailing, ""); } while (s !== prev && s.length);
  return s.replace(/\s{2,}/g, " ").trim();
}

function simplifyPrep(s) {
  const m = s.match(PREP_CUT);
  if (m && m.index >= 2) {
    const head = s.slice(0, m.index).trim();
    if (head.length >= 3 && /\p{L}/u.test(head)) return head;
  }
  return s;
}

function isPriceOnly(s) {
  return /^[\d.,\-€$\s]+(?:kn|km|hrk|eur|€|\$)?\.?$/i.test(s);
}
function isHeaderLine(s) {
  return MENU_HEADERS.has(normName(s.replace(/[·:().]/g, " ").replace(/\s{2,}/g, " ")));
}
function looksLikeDescription(s) {
  const words = s.split(/\s+/).filter(Boolean);
  const first = (s.match(/\p{L}/u) || [])[0];
  const startsLower = first && first.toLowerCase() === first && first.toUpperCase() !== first;
  if (words.length >= 8) return true;                 // very long line → description
  if (startsLower && words.length >= 3) return true;  // lowercase sentence → description
  return false;
}

function finalizeName(s) {
  return s.replace(/[\s,;:.\-–]+$/, "").trim();
}

// Validate + normalise one candidate and push it if it looks like a real item.
function pushCandidate(cleanedRaw, out, seen) {
  const cleaned = stripLeadingHeader(cleanedRaw);
  if (cleaned.length < 2 || !/\p{L}/u.test(cleaned)) return;
  if (isPriceOnly(cleaned) || isHeaderLine(cleaned)) return;
  const simplified = simplifyPrep(cleaned);
  if (looksLikeDescription(simplified)) return;
  const name = finalizeName(simplified);
  const key = normName(name);
  if (name.length < 2 || name.length > MAX_NAME_LEN || !key || isHeaderLine(name) || seen.has(key)) return;
  seen.add(key);
  out.push(name);
}

// Aggressive: raw OCR/PDF → curated item names. Handles both proper lines and
// run-on paragraphs (a whole menu on one line) by splitting and taking the
// leading words of each segment.
function extractMenuItems(text) {
  const out = [], seen = new Set();
  (text || "").split(/\r?\n/).forEach((raw) => {
    const cleaned = basicClean(raw);
    if (cleaned.length < 2) return;
    const words = cleaned.split(/\s+/).filter(Boolean).length;
    if (cleaned.length <= MAX_NAME_LEN && words <= 6) {
      pushCandidate(cleaned, out, seen);
    } else {
      // run-on line → split into segments; each item's name leads its segment
      splitRunOn(cleaned).forEach((seg) => pushCandidate(basicClean(firstWords(stripLeadingHeader(seg), 4)), out, seen));
    }
  });
  return out;
}

// Lenient: curated textarea → final list (trusts the person's lines, but still
// strips prices/bullets, shortens preparation and caps run-on blobs).
function parseItemLines(text) {
  const out = [], seen = new Set();
  (text || "").split(/\r?\n/).forEach((raw) => {
    const cleaned = basicClean(raw);
    if (cleaned.length < 2 || !/\p{L}/u.test(cleaned) || isPriceOnly(cleaned)) return;
    const name = finalizeName(simplifyPrep(cleaned));
    const key = normName(name);
    if (name.length < 2 || name.length > MAX_NAME_LEN || !key || seen.has(key)) return;
    seen.add(key);
    out.push(name);
  });
  return out;
}

/* Read an image file with Tesseract (Croatian + English). Loaded on demand so
   it never weighs down the initial bundle. */
async function ocrImageFile(file, onProgress) {
  const Tesseract = await import("tesseract.js");
  const opts = { logger: (m) => { if (m.status === "recognizing text" && onProgress) onProgress(m.progress); } };
  try {
    const { data } = await Tesseract.recognize(file, "hrv+eng", opts);
    return data.text || "";
  } catch (e) {
    // Croatian traineddata may be unavailable — fall back to English only.
    const { data } = await Tesseract.recognize(file, "eng", opts);
    return data.text || "";
  }
}

/* Extract embedded text from a (digital) PDF via pdf.js. Loaded on demand. */
async function pdfTextFromFile(file) {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  let text = "";
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    // Reconstruct visual lines: pdf.js marks line ends with `hasEOL`; fall back
    // to a jump in the y-coordinate (transform[5]) for PDFs that don't set it.
    // Without this the whole page collapses onto one line and the parser sees a
    // single giant "item".
    let line = "";
    let lastY = null;
    for (const it of content.items) {
      const str = it.str || "";
      const y = it.transform ? it.transform[5] : null;
      if (lastY !== null && y !== null && Math.abs(y - lastY) > 3 && line.trim()) {
        text += line.trim() + "\n";
        line = "";
      }
      line += str + (it.hasEOL ? "\n" : " ");
      if (it.hasEOL) { text += line.trim() + "\n"; line = ""; lastY = null; }
      else if (y !== null) lastY = y;
    }
    if (line.trim()) text += line.trim() + "\n";
    page.cleanup();
  }
  return text;
}

function csvField(v) {
  const s = String(v == null ? "" : v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/* Build a CSV (with a UTF-8 BOM so Excel reads č/ž/š correctly). */
function buildOrderCsv(rows) {
  const header = ["Artikl", "Količina", "Jedinica"];
  const lines = [header, ...rows.map((r) => [r.name, r.qty, r.unit])];
  return "﻿" + lines.map((l) => l.map(csvField).join(",")).join("\r\n");
}

function triggerDownload(filename, text, mime) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function ImportItemsModal({ c, onClose, onAdd }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [defaultUnit, setDefaultUnit] = useState("kom");

  const handleFile = async (file) => {
    if (!file) return;
    setBusy(true); setProgress(0); setStatus("");
    try {
      let extracted = "";
      if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
        setStatus(tr("Reading PDF…"));
        extracted = await pdfTextFromFile(file);
      } else {
        setStatus(tr("Reading image…"));
        extracted = await ocrImageFile(file, (p) => setProgress(p));
      }
      const cleaned = extractMenuItems(extracted).join("\n");
      setText((prev) => (prev.trim() ? prev + "\n" : "") + cleaned);
      setStatus(cleaned ? "" : tr("No text found — type items manually below."));
    } catch (e) {
      setStatus(tr("Automatic reading failed — paste or type items manually below."));
    } finally {
      setBusy(false); setProgress(0);
    }
  };

  const parsed = parseItemLines(text);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", zIndex: 60 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: c.surface, width: "100%", maxWidth: 520, margin: "0 auto", borderRadius: "24px 24px 0 0",
        padding: "22px 22px calc(22px + env(safe-area-inset-bottom, 0px))", maxHeight: "90dvh", overflowY: "auto", fontFamily: fontStack().body,
      }}>
        <div style={{ fontWeight: 700, fontSize: 17, color: c.text, marginBottom: 4 }}>{tr("Import items")}</div>
        <div style={{ fontSize: 12.5, color: c.textFaint, marginBottom: 14 }}>
          {tr("Snap a photo of the menu or pick a PDF — we'll read the text. Then review the list before adding.")}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <label style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "16px 8px", borderRadius: 14, border: `1.5px dashed ${c.border}`, background: c.surfaceAlt, cursor: busy ? "default" : "pointer",
          }}>
            <ImageIcon size={20} color={c.textSub} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: c.text }}>{tr("Photo")}</span>
            <input type="file" accept="image/*" capture="environment" disabled={busy} style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files?.[0])} />
          </label>
          <label style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "16px 8px", borderRadius: 14, border: `1.5px dashed ${c.border}`, background: c.surfaceAlt, cursor: busy ? "default" : "pointer",
          }}>
            <FileText size={20} color={c.textSub} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: c.text }}>{tr("PDF")}</span>
            <input type="file" accept="application/pdf,.pdf" disabled={busy} style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files?.[0])} />
          </label>
        </div>

        {busy && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, color: c.textSub, fontSize: 13 }}>
            <Loader2 size={15} className="spin" /> {status || tr("Reading…")}{progress > 0 ? ` ${Math.round(progress * 100)}%` : ""}
          </div>
        )}
        {!busy && status && <div style={{ fontSize: 12.5, color: c.textSub, marginBottom: 12 }}>{status}</div>}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: c.textSub, fontWeight: 500 }}>{tr("Items — one per line")}</span>
          {text.trim() && (
            <button onClick={() => setText(extractMenuItems(text).join("\n"))} style={{ background: "none", border: `1px solid ${c.border}`, borderRadius: 8, padding: "4px 10px", cursor: "pointer", color: c.textSub, fontSize: 12, fontWeight: 600 }}>
              {tr("Clean up")}
            </button>
          )}
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} placeholder={"Coca-Cola\nHobotnica\nMaslinovo ulje"}
          style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1px solid ${c.border}`, background: c.inputBg, color: c.text, fontSize: 16, boxSizing: "border-box", resize: "vertical", fontFamily: fontStack().body, outline: "none" }} />
        <div style={{ fontSize: 11.5, color: c.textFaint, marginTop: 5 }}>{tr("Tip: paste a menu and tap \"Clean up\" to drop prices, headers and descriptions, and shorten dish names (e.g. \"Hobotnica na žaru\" → \"Hobotnica\").")}</div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 0 16px" }}>
          <span style={{ fontSize: 13, color: c.textSub }}>{tr("Default unit")}</span>
          <div style={{ display: "flex", gap: 6 }}>
            {ORDER_UNITS.map((u) => (
              <button key={u} onClick={() => setDefaultUnit(u)} style={{
                padding: "6px 12px", borderRadius: 999, cursor: "pointer", fontSize: 13, fontWeight: 600,
                border: `1px solid ${defaultUnit === u ? c.text : c.border}`, background: defaultUnit === u ? c.text : c.surface, color: defaultUnit === u ? c.bg : c.textSub,
              }}>{u}</button>
            ))}
          </div>
        </div>

        <PrimaryButton c={c} full disabled={parsed.length === 0} onClick={() => { onAdd(parsed, defaultUnit); onClose(); }}>
          <Plus size={16} /> {tr("Add")} {parsed.length > 0 ? parsed.length : ""} {plural(parsed.length, ["item", "items"], ["artikl", "artikla", "artikala"])}
        </PrimaryButton>
        <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
      </div>
    </div>
  );
}

function OrderingScreen({ c, products, setProducts, orderDraft, setOrderDraft, restaurant }) {
  const [importing, setImporting] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("kom");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [bulkConfirm, setBulkConfirm] = useState(false);

  const removeProducts = (ids) => {
    const set = ids instanceof Set ? ids : new Set(ids);
    setProducts((prev) => prev.filter((p) => !set.has(p.id)));
    setOrderDraft((prev) => { const n = { ...prev }; set.forEach((id) => delete n[id]); return n; });
  };
  const removeOne = (id) => removeProducts([id]);           // one-tap delete
  const toggleSelect = (id) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const exitSelect = () => { setSelectMode(false); setSelected(new Set()); };
  const selectAll = () => setSelected(new Set(products.map((p) => p.id)));
  const deleteSelected = () => { removeProducts(selected); setBulkConfirm(false); exitSelect(); };

  const setQty = (id, qty) => setOrderDraft((prev) => {
    const n = Math.max(0, Number(qty) || 0);
    const next = { ...prev };
    if (n <= 0) delete next[id]; else next[id] = n;
    return next;
  });
  const step = (id, delta) => setQty(id, (Number(orderDraft[id]) || 0) + delta);

  const setUnit = (id, unit) => setProducts((prev) => prev.map((p) => p.id === id ? { ...p, unit } : p));

  const addManual = () => {
    const name = newName.trim();
    if (!name) return;
    if (!products.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      setProducts((prev) => [...prev, { id: uid(), name, unit: newUnit }]);
    }
    setNewName("");
  };

  const addMany = (names, unit) => {
    setProducts((prev) => {
      const have = new Set(prev.map((p) => p.name.toLowerCase()));
      const fresh = [];
      names.forEach((name) => {
        const key = name.toLowerCase();
        if (!have.has(key)) { have.add(key); fresh.push({ id: uid(), name, unit }); }
      });
      return [...prev, ...fresh];
    });
  };

  const orderRows = products
    .filter((p) => (Number(orderDraft[p.id]) || 0) > 0)
    .map((p) => ({ name: p.name, qty: orderDraft[p.id], unit: p.unit }));
  const orderCount = orderRows.length;

  const dateStr = localDateIso();

  const exportCsv = () => {
    if (!orderRows.length) return;
    triggerDownload(`narudzba-${slugify(restaurant?.name || "restaurant")}-${dateStr}.csv`, buildOrderCsv(orderRows), "text/csv;charset=utf-8;");
  };

  const emailOrder = () => {
    if (!orderRows.length) return;
    const rows = orderRows.map((r) => `- ${r.name}: ${r.qty} ${r.unit}`).join("\n");
    const name = restaurant?.name || "";
    const body = LANG === "hr"
      ? `Poštovani,\n\nMolim isporuku sljedeće robe:\n\n${rows}\n\nHvala,\n${name}`
      : `Dear supplier,\n\nPlease deliver the following goods:\n\n${rows}\n\nThank you,\n${name}`;
    const subject = LANG === "hr" ? `Narudžba robe — ${name} (${dateStr})` : `Supply order — ${name} (${dateStr})`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const clearOrder = () => setOrderDraft({});

  return (
    <div style={{ padding: "0 20px 24px" }}>
      <div style={{ fontFamily: fontStack().display, fontSize: 26, fontWeight: 600, color: c.text, margin: "4px 0 2px" }}>{tr("Order supplies")}</div>
      <div style={{ fontSize: 13.5, color: c.textSub, marginBottom: 16 }}>{tr("Build a supplier order and export it as a table.")}</div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <GhostButton c={c} onClick={() => setImporting(true)} style={{ flex: 1, padding: "12px 10px" }}>
          <Upload size={16} /> {tr("Import")}
        </GhostButton>
        <PrimaryButton c={c} onClick={exportCsv} disabled={orderCount === 0} style={{ flex: 1, padding: "13px 10px" }}>
          <Download size={16} /> {tr("Export CSV")}
        </PrimaryButton>
      </div>

      {products.length > 0 && (
        selectMode ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: c.surfaceAlt, borderRadius: 14, padding: "10px 14px", marginBottom: 16 }}>
            <span style={{ fontSize: 13.5, color: c.text, fontWeight: 600 }}>{selected.size} {tr("selected")}</span>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <button onClick={selected.size === products.length ? () => setSelected(new Set()) : selectAll} style={{ background: "none", border: "none", cursor: "pointer", color: c.textSub, fontSize: 12.5, fontWeight: 600 }}>
                {selected.size === products.length ? tr("None") : tr("All")}
              </button>
              <button onClick={() => selected.size && setBulkConfirm(true)} disabled={!selected.size} style={{ background: "none", border: "none", cursor: selected.size ? "pointer" : "default", color: selected.size ? c.rose : c.textFaint, fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                <Trash2 size={14} /> {tr("Delete")}
              </button>
              <button onClick={exitSelect} style={{ background: "none", border: "none", cursor: "pointer", color: c.textSub, fontSize: 12.5, fontWeight: 600 }}>{tr("Cancel")}</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setSelectMode(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: c.textSub, fontSize: 12.5, fontWeight: 600, marginBottom: 12, padding: 0 }}>
            <CheckCircle2 size={14} /> {tr("Select items to delete")}
          </button>
        )
      )}

      {orderCount > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: c.surfaceAlt, borderRadius: 14, padding: "12px 14px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: c.text, fontWeight: 600 }}>
            <ShoppingCart size={15} color={c.textSub} /> {orderCount} {plural(orderCount, ["item", "items"], ["artikl", "artikla", "artikala"])} {tr("in order")}
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            <button onClick={emailOrder} style={{ background: "none", border: "none", cursor: "pointer", color: c.textSub, fontSize: 12.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              <Mail size={14} /> {tr("Email")}
            </button>
            <button onClick={clearOrder} style={{ background: "none", border: "none", cursor: "pointer", color: c.rose, fontSize: 12.5, fontWeight: 600 }}>{tr("Clear")}</button>
          </div>
        </div>
      )}

      {/* Quick manual add */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addManual()}
          placeholder={tr("Add an item (e.g. Coca-Cola)")}
          style={{ flex: 1, minWidth: 0, padding: "12px 14px", borderRadius: 12, border: `1px solid ${c.border}`, background: c.inputBg, color: c.text, fontSize: 16, boxSizing: "border-box", outline: "none" }} />
        <select value={newUnit} onChange={(e) => setNewUnit(e.target.value)}
          style={{ padding: "12px 10px", borderRadius: 12, border: `1px solid ${c.border}`, background: c.inputBg, color: c.text, fontSize: 16, boxSizing: "border-box" }}>
          {ORDER_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        <button onClick={addManual} disabled={!newName.trim()} style={{ width: 46, borderRadius: 12, border: "none", background: newName.trim() ? c.cta : c.textFaint, color: c.ctaText, cursor: newName.trim() ? "pointer" : "default", flexShrink: 0 }}>
          <Plus size={18} style={{ margin: "0 auto" }} />
        </button>
      </div>

      {products.length === 0 ? (
        <EmptyState c={c} icon={ShoppingCart} title={tr("No items yet")}
          message={tr("Import your goods from a menu photo or PDF, or add them one by one above.")}
          actionLabel={tr("Import from photo / PDF")} onAction={() => setImporting(true)} />
      ) : (
        products.map((p) => {
          const qty = Number(orderDraft[p.id]) || 0;
          const inOrder = qty > 0;
          const isSel = selected.has(p.id);
          return (
            <div key={p.id} onClick={selectMode ? () => toggleSelect(p.id) : undefined} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 14, marginBottom: 8,
              border: `1px solid ${(selectMode ? isSel : inOrder) ? c.text : c.border}`,
              background: (selectMode ? isSel : inOrder) ? c.surfaceAlt : c.surface,
              cursor: selectMode ? "pointer" : "default",
            }}>
              {selectMode && (
                <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${isSel ? c.text : c.borderStrong}`, background: isSel ? c.text : "transparent" }}>
                  {isSel && <Check size={14} color={c.bg} />}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14.5, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                {selectMode ? (
                  <div style={{ fontSize: 12, color: c.textSub, marginTop: 2 }}>{p.unit}</div>
                ) : (
                  <select value={p.unit} onChange={(e) => setUnit(p.id, e.target.value)}
                    style={{ marginTop: 2, padding: "2px 4px", borderRadius: 8, border: `1px solid ${c.border}`, background: "transparent", color: c.textSub, fontSize: 12 }}>
                    {ORDER_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                )}
              </div>
              {!selectMode && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button onClick={() => step(p.id, -1)} style={{ width: 30, height: 30, borderRadius: 9, border: `1px solid ${c.border}`, background: c.surface, color: c.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={14} /></button>
                    <input value={qty || ""} onChange={(e) => setQty(p.id, e.target.value)} inputMode="decimal" placeholder="0"
                      style={{ width: 46, textAlign: "center", padding: "7px 4px", borderRadius: 9, border: `1px solid ${c.border}`, background: c.inputBg, color: c.text, fontSize: 16, boxSizing: "border-box" }} />
                    <button onClick={() => step(p.id, 1)} style={{ width: 30, height: 30, borderRadius: 9, border: `1px solid ${c.border}`, background: c.surface, color: c.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={14} /></button>
                  </div>
                  <button onClick={() => removeOne(p.id)} style={{ background: "none", border: "none", cursor: "pointer", color: c.textFaint, flexShrink: 0 }}><Trash2 size={15} /></button>
                </>
              )}
            </div>
          );
        })
      )}

      {importing && <ImportItemsModal c={c} onClose={() => setImporting(false)} onAdd={addMany} />}
      {bulkConfirm && (
        <ConfirmDialog c={c} title={`${LANG === "hr" ? "Ukloniti" : "Remove"} ${selected.size} ${plural(selected.size, ["item", "items"], ["artikl", "artikla", "artikala"])}?`}
          message={tr("The selected items will be removed from your catalog and any current order.")}
          confirmLabel={tr("Remove")} onCancel={() => setBulkConfirm(false)} onConfirm={deleteSelected} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Configuration screen (shown when Supabase is not set up)           */
/* ------------------------------------------------------------------ */

function ConfigScreen({ c, isDark, setIsDark, lang, setLang }) {
  const steps = LANG === "hr" ? [
    "Izradite besplatan projekt na supabase.com.",
    "Otvorite SQL uređivač i pokrenite skriptu iz supabase/schema.sql u ovom repozitoriju.",
    "U Settings → API kopirajte Project URL i javni anon ključ.",
    "Kopirajte .env.example u .env i zalijepite obje vrijednosti.",
    "Ponovno pokrenite dev server (npm run dev).",
  ] : [
    "Create a free project at supabase.com.",
    "Open the SQL editor and run the script in supabase/schema.sql from this repo.",
    "In Settings → API, copy your Project URL and the public anon key.",
    "Copy .env.example to .env and paste both values in.",
    "Restart the dev server (npm run dev).",
  ];
  return (
    <div style={{ minHeight: "100dvh", background: c.bg, display: "flex", flexDirection: "column", fontFamily: fontStack().body }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "calc(18px + env(safe-area-inset-top, 0px)) 20px 18px" }}>
        <LangToggle c={c} lang={lang} setLang={setLang} />
        <IconBtn c={c} onClick={() => setIsDark(!isDark)}>{isDark ? <Sun size={17} /> : <Moon size={17} />}</IconBtn>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px 40px" }}>
        <div style={{ width: "100%", maxWidth: 440 }}>
          <div style={{ textAlign: "center", marginBottom: 22 }}>
            <div style={{ margin: "0 auto 6px", width: 130 }}>
              <OrdioraLogo c={c} size={130} />
            </div>
            <div style={{ color: c.textSub, marginTop: 2, fontSize: 14.5 }}>{tr("Connect your Supabase backend to get started.")}</div>
          </div>
          <SectionCard c={c}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <KeyRound size={18} color={c.textSub} />
              <span style={{ fontWeight: 700, fontSize: 15, color: c.text }}>{tr("Set up in 5 steps")}</span>
            </div>
            {steps.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "9px 0", borderTop: i ? `1px solid ${c.border}` : "none" }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 999, flexShrink: 0, display: "flex", alignItems: "center",
                  justifyContent: "center", background: c.text, color: c.bg, fontSize: 12, fontWeight: 700,
                }}>{i + 1}</div>
                <div style={{ fontSize: 13.5, color: c.text, lineHeight: 1.5, paddingTop: 2 }}>{s}</div>
              </div>
            ))}
          </SectionCard>
          <div style={{ fontSize: 12, color: c.textFaint, textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
            {tr("Full instructions are in the project README. Use only the public anon key here — never the service_role key.")}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  App root                                                            */
/* ------------------------------------------------------------------ */

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState("hr"); // "hr" | "en" — device-local UI language
  const [loaded, setLoaded] = useState(false);
  const [user, setUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [resModal, setResModal] = useState(null); // null | 'new' | reservation object
  const [notifOpen, setNotifOpen] = useState(false);

  const [workspace, setWorkspace] = useState(null); // { slug, name } | null
  const [registry, setRegistry] = useState([]); // [{ slug, name }, ...] — every restaurant in this artifact
  const [creatingNew, setCreatingNew] = useState(false);
  const [newRecovery, setNewRecovery] = useState(null); // recovery code to show once, right after setup

  const [restaurant, setRestaurant] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [tables, setTables] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [chat, setChat] = useState({ general: [], floor: [], kitchen: [] });
  const [notifications, setNotifications] = useState([]);
  const [products, setProducts] = useState([]);     // supplies catalog
  const [orderDraft, setOrderDraft] = useState({});  // { productId: quantity }
  const [now, setNow] = useState(() => Date.now());  // minute tick for reservation expiry (device-local)

  // Holds the exact object references most recently hydrated from the cloud, per
  // slice. A persist effect saves only when its slice DIFFERS from this snapshot
  // — so the values we just loaded (or the empty fallbacks a failed read returns)
  // are never written straight back (which on a failed read would destroy real
  // data), while any genuine user edit (a fresh reference) always saves. This is
  // reference-based, so it's immune to timing and to workspace re-loads that
  // reuse the same object.
  const lastLoaded = useRef({});

  // Loads every piece of data scoped to one restaurant's workspace, and
  // attempts an auto-login if a remembered session matches this workspace.
  const loadWorkspaceData = async (slug) => {
    const scoped = (key, fallback) => loadKey(`restaurantos:${slug}:${key}`, fallback, true);
    const [rest, accs, tbls, res, sh, ch, notifs, prods, draft, remembered] = await Promise.all([
      scoped("restaurant", null),
      scoped("accounts", []),
      scoped("tables", []),
      scoped("reservations", []),
      scoped("shifts", []),
      scoped("chat", { general: [], floor: [], kitchen: [] }),
      scoped("notifications", []),
      scoped("products", []),
      scoped("orderDraft", {}),
      loadKey("restaurantos:remembered", null, false),
    ]);
    // Record the loaded references BEFORE applying them so the persist effects
    // recognise these exact values as "just hydrated" and skip writing them back.
    lastLoaded.current = { restaurant: rest, accounts: accs, tables: tbls, reservations: res, shifts: sh, chat: ch, notifications: notifs, products: prods, orderDraft: draft };
    setRestaurant(rest);
    setAccounts(accs);
    setTables(tbls);
    setReservations(res);
    setShifts(sh);
    setChat(ch);
    setNotifications(notifs);
    setProducts(prods);
    setOrderDraft(draft);
    if (remembered && remembered.slug === slug) {
      const match = accs.find((a) => a.email === remembered.email && a.password === remembered.password);
      if (match) setUser(match);
    }
  };

  useEffect(() => {
    (async () => {
      const [ws, reg, themePref, langPref] = await Promise.all([
        loadKey("restaurantos:workspace", null, false),
        loadKey("restaurantos:registry", [], true),
        loadKey("restaurantos:theme", null, false),
        loadKey("restaurantos:lang", null, false),
      ]);
      setRegistry(reg);
      if (themePref) setIsDark(themePref.isDark);
      if (langPref === "hr" || langPref === "en") { setLang(langPref); LANG = langPref; }
      if (ws && ws.slug) {
        await loadWorkspaceData(ws.slug);
        setWorkspace(ws);
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => { if (loaded && workspace && restaurant && restaurant !== lastLoaded.current.restaurant) saveKey(`restaurantos:${workspace.slug}:restaurant`, restaurant, true); }, [restaurant, loaded, workspace]);
  useEffect(() => { if (loaded && workspace && accounts !== lastLoaded.current.accounts) saveKey(`restaurantos:${workspace.slug}:accounts`, accounts, true); }, [accounts, loaded, workspace]);
  useEffect(() => { if (loaded && workspace && tables !== lastLoaded.current.tables) saveKey(`restaurantos:${workspace.slug}:tables`, tables, true); }, [tables, loaded, workspace]);
  useEffect(() => { if (loaded && workspace && reservations !== lastLoaded.current.reservations) saveKey(`restaurantos:${workspace.slug}:reservations`, reservations, true); }, [reservations, loaded, workspace]);

  // Once a reservation's end time (date + time + duration) passes, finalize its
  // status — seated → completed, pending/confirmed → no-show (cancelled/completed/
  // no-show untouched) — so past bookings resolve and drop out of the active list.
  // Runs while the app is open (on load + every 60s); catches up on next open.
  useEffect(() => {
    if (!loaded || !workspace) return;
    const applyExpiry = () => setReservations((prev) => {
      let changed = false;
      const next = prev.map((r) => {
        if (!isPastReservation(r, Date.now())) return r;
        let s = r.status;
        if (s === "seated") s = "completed";
        else if (s === "pending" || s === "confirmed") s = "no-show";
        if (s !== r.status) { changed = true; return { ...r, status: s }; }
        return r;
      });
      return changed ? next : prev; // same ref when nothing changed → no persist churn
    });
    applyExpiry();
    const id = setInterval(() => { applyExpiry(); setNow(Date.now()); }, 60000);
    return () => clearInterval(id);
  }, [loaded, workspace]);
  useEffect(() => { if (loaded && workspace && shifts !== lastLoaded.current.shifts) saveKey(`restaurantos:${workspace.slug}:shifts`, shifts, true); }, [shifts, loaded, workspace]);
  useEffect(() => { if (loaded && workspace && chat !== lastLoaded.current.chat) saveKey(`restaurantos:${workspace.slug}:chat`, chat, true); }, [chat, loaded, workspace]);
  useEffect(() => { if (loaded && workspace && notifications !== lastLoaded.current.notifications) saveKey(`restaurantos:${workspace.slug}:notifications`, notifications, true); }, [notifications, loaded, workspace]);
  useEffect(() => { if (loaded && workspace && products !== lastLoaded.current.products) saveKey(`restaurantos:${workspace.slug}:products`, products, true); }, [products, loaded, workspace]);
  useEffect(() => { if (loaded && workspace && orderDraft !== lastLoaded.current.orderDraft) saveKey(`restaurantos:${workspace.slug}:orderDraft`, orderDraft, true); }, [orderDraft, loaded, workspace]);
  useEffect(() => { if (loaded) saveKey("restaurantos:theme", { isDark }, false); }, [isDark, loaded]);
  useEffect(() => { if (loaded) saveKey("restaurantos:lang", lang, false); }, [lang, loaded]);

  // Publish the chosen language to the module-level translator so every child
  // rendered synchronously below (and any handler that fires afterwards) reads it.
  LANG = lang;
  const c = PALETTE[isDark ? "dark" : "light"];
  const bp = useBreakpoint();

  const notify = (type, text) => {
    // Cap history so the blob (and every write/load of it) can't grow unbounded.
    setNotifications((prev) => [...prev, { id: uid(), type, text, time: Date.now(), read: false }].slice(-50));
  };

  const completeSetup = ({ restaurant: r, owner, tables: t, remember }) => {
    const slug = generateSlug(r.name, registry.map((w) => w.slug));
    const ws = { slug, name: r.name };
    const recoveryCode = generateRecoveryCode();
    const restaurantWithSlug = { ...r, slug, recoveryCode };
    setRestaurant(restaurantWithSlug);
    setNewRecovery(recoveryCode);
    setAccounts([owner]);
    setTables(t);
    // Start the new restaurant empty — otherwise a previous session's data (still
    // in memory after Sign out, which doesn't clear it) would leak into it.
    setReservations([]);
    setShifts([]);
    setChat({ general: [], floor: [], kitchen: [] });
    setNotifications([]);
    setProducts([]);
    setOrderDraft({});
    setUser(owner);
    setWorkspace(ws);
    setCreatingNew(false);
    setView("dashboard");
    saveKey(`restaurantos:${slug}:restaurant`, restaurantWithSlug, true);
    saveKey(`restaurantos:${slug}:accounts`, [owner], true);
    saveKey(`restaurantos:${slug}:tables`, t, true);
    saveKey("restaurantos:workspace", ws, false);
    const nextRegistry = [...registry, ws];
    setRegistry(nextRegistry);
    saveKey("restaurantos:registry", nextRegistry, true);
    if (remember) saveKey("restaurantos:remembered", { slug, email: owner.email, password: owner.password }, false);
  };

  // Access requires the EXACT restaurant name plus a valid password. The
  // registry is never shown; a name is only ever resolved when the person
  // already knows it, and the password identifies which account signs in.
  const loginWithNameAndPassword = async (name, password, remember) => {
    const target = (name || "").trim().toLowerCase();
    const entry = registry.find((r) => (r.name || "").trim().toLowerCase() === target);
    if (!entry) return { ok: false };
    const accs = await loadKey(`restaurantos:${entry.slug}:accounts`, [], true);
    const account = accs.find((a) => a.password === password);
    if (!account) return { ok: false };
    await loadWorkspaceData(entry.slug);
    setWorkspace(entry);
    setUser(account);
    setView("dashboard");
    saveKey("restaurantos:workspace", entry, false);
    if (remember) saveKey("restaurantos:remembered", { slug: entry.slug, email: account.email, password: account.password }, false);
    else saveKey("restaurantos:remembered", null, false);
    return { ok: true };
  };

  // Forgotten-password recovery for the owner: exact restaurant name + the
  // restaurant's recovery code lets them set a new owner password.
  const recoverOwnerPassword = async (name, code, newPassword) => {
    const target = (name || "").trim().toLowerCase();
    const entry = registry.find((r) => (r.name || "").trim().toLowerCase() === target);
    if (!entry) return { ok: false, error: tr("No restaurant found with that name.") };
    const rest = await loadKey(`restaurantos:${entry.slug}:restaurant`, null, true);
    if (!rest || !rest.recoveryCode) return { ok: false, error: tr("This restaurant has no recovery code set.") };
    if (normalizeCode(rest.recoveryCode) !== normalizeCode(code)) return { ok: false, error: tr("Incorrect recovery code.") };
    if ((newPassword || "").length < 6) return { ok: false, error: tr("New password must be at least 6 characters.") };
    const accs = await loadKey(`restaurantos:${entry.slug}:accounts`, [], true);
    const idx = accs.findIndex((a) => a.role === "owner");
    if (idx === -1) return { ok: false, error: tr("No owner account found.") };
    if (accs.some((a, i) => i !== idx && a.password === newPassword)) return { ok: false, error: tr("That password is already in use by a staff account. Choose a different one.") };
    const nextAccs = accs.map((a, i) => i === idx ? { ...a, password: newPassword } : a);
    await saveKey(`restaurantos:${entry.slug}:accounts`, nextAccs, true);
    return { ok: true };
  };

  const switchWorkspace = () => {
    setUser(null);
    setWorkspace(null);
    setRestaurant(null);
    setAccounts([]);
    setTables([]);
    setReservations([]);
    setShifts([]);
    setChat({ general: [], floor: [], kitchen: [] });
    setNotifications([]);
    setProducts([]);
    setOrderDraft({});
    setView("dashboard");
    saveKey("restaurantos:workspace", null, false);
    saveKey("restaurantos:remembered", null, false);
  };

  const signOut = () => {
    setUser(null);
    setView("dashboard");
    saveKey("restaurantos:remembered", null, false);
  };

  // When an account's password changes, keep the signed-in user object and this
  // device's "remember me" token in sync so auto-login doesn't silently break.
  const onAccountPasswordChanged = (accountId, newPassword) => {
    if (!user || accountId !== user.id) return;
    setUser((u) => (u ? { ...u, password: newPassword } : u));
    const remembered = loadLocal("restaurantos:remembered", null);
    if (remembered && workspace && remembered.slug === workspace.slug && remembered.email === user.email) {
      saveKey("restaurantos:remembered", { ...remembered, password: newPassword }, false);
    }
  };

  // Used by Settings so a rename also updates the entry shown in the workspace picker.
  const updateRestaurant = (updated) => {
    setRestaurant(updated);
    setRegistry((prev) => {
      const next = prev.map((w) => w.slug === updated.slug ? { ...w, name: updated.name } : w);
      saveKey("restaurantos:registry", next, true);
      return next;
    });
  };

  const createReservation = (r) => {
    setReservations((prev) => [...prev, r]);
    notify("reservation", `${tr("New reservation:")} ${r.name} · ${r.date} ${tr("at")} ${r.time} (${r.table})`);
  };
  const updateReservation = (id, payload) => {
    setReservations((prev) => prev.map((r) => r.id === id ? { ...r, ...payload } : r));
  };
  const deleteReservation = (id) => {
    setReservations((prev) => prev.filter((r) => r.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const toggleNotifications = () => {
    setNotifOpen((open) => {
      const next = !open;
      if (next) setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      return next;
    });
  };

  if (!isSupabaseConfigured) {
    return <ConfigScreen c={c} isDark={isDark} setIsDark={setIsDark} lang={lang} setLang={setLang} />;
  }

  if (!loaded) {
    return (
      <div style={{ minHeight: "100dvh", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={26} color={c.textFaint} className="spin" />
        <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  if (creatingNew) {
    return (
      <SetupWizard c={c} isDark={isDark} setIsDark={setIsDark} lang={lang} setLang={setLang} onComplete={completeSetup}
        onCancel={() => setCreatingNew(false)} />
    );
  }

  if (!user) {
    return <LoginScreen c={c} isDark={isDark} setIsDark={setIsDark} lang={lang} setLang={setLang} onLogin={loginWithNameAndPassword} onRecover={recoverOwnerPassword} onCreateNew={() => setCreatingNew(true)} />;
  }

  // Signed in but the restaurant record didn't load (e.g. a transient read
  // failure) — offer a retry instead of crashing screens that assume it exists.
  if (!restaurant) {
    return (
      <div style={{ minHeight: "100dvh", background: c.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24, fontFamily: fontStack().body }}>
        <div style={{ color: c.textSub, fontSize: 14.5, textAlign: "center", maxWidth: 300, lineHeight: 1.5 }}>{tr("Couldn't load this restaurant's data. Check your connection and try again.")}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <PrimaryButton c={c} onClick={() => window.location.reload()}>{tr("Retry")}</PrimaryButton>
          <GhostButton c={c} onClick={signOut}>{tr("Sign out")}</GhostButton>
        </div>
      </div>
    );
  }

  const canCreateReservation = user.role === "owner" || user.role === "waiter";
  const titleMap = {
    dashboard: "Dashboard", reservations: "Reservations", chat: "Chat",
    analytics: user.role === "owner" ? "Analytics" : "My Analytics",
    more: "More", shifts: "Shifts", staff: "Team", settings: "Settings", orders: "Order supplies", followups: "Follow-ups",
  };

  const isDesktop = bp === "desktop";
  // On desktop the sidebar surfaces every destination, so the "More" bucket
  // screen is redundant — fall back to the dashboard if it's ever selected.
  const activeView = isDesktop && view === "more" ? "dashboard" : view;
  // Content column widths per breakpoint (desktop uses a sidebar + wider main).
  const contentMax = isDesktop ? 960 : bp === "tablet" ? 760 : 520;

  const screens = (
    <div style={{ flex: 1 }}>
      {activeView === "dashboard" && <DashboardScreen c={c} user={user} reservations={reservations} shifts={shifts} setView={setView} openNewReservation={() => setResModal("new")} canCreate={canCreateReservation} now={now} />}
      {activeView === "reservations" && <ReservationsScreen c={c} reservations={reservations} setReservations={setReservations} user={user} openNewReservation={() => setResModal("new")} openEditReservation={(r) => setResModal(r)} canCreate={canCreateReservation} now={now} />}
      {activeView === "shifts" && <ShiftsScreen c={c} shifts={shifts} setShifts={setShifts} staff={accounts} user={user} />}
      {activeView === "chat" && <ChatScreen c={c} chat={chat} setChat={setChat} staff={accounts} user={user} notify={notify} />}
      {activeView === "analytics" && <AnalyticsScreen c={c} reservations={reservations} shifts={shifts} staff={accounts} user={user} />}
      {activeView === "staff" && <StaffScreen c={c} staff={accounts} setStaff={setAccounts} user={user} restaurant={restaurant} onPasswordChanged={onAccountPasswordChanged} />}
      {activeView === "more" && <MoreScreen c={c} user={user} restaurant={restaurant} setView={setView} isDark={isDark} setIsDark={setIsDark} onSignOut={signOut} onSwitchWorkspace={switchWorkspace} />}
      {activeView === "settings" && <SettingsScreen c={c} user={user} isDark={isDark} setIsDark={setIsDark} lang={lang} setLang={setLang} restaurant={restaurant} setRestaurant={updateRestaurant} tables={tables} setTables={setTables} accounts={accounts} setAccounts={setAccounts} onPasswordChanged={onAccountPasswordChanged} />}
      {activeView === "orders" && <OrderingScreen c={c} products={products} setProducts={setProducts} orderDraft={orderDraft} setOrderDraft={setOrderDraft} restaurant={restaurant} />}
      {activeView === "followups" && (user.role === "owner" || user.role === "waiter") && <FollowUpsScreen c={c} reservations={reservations} setReservations={setReservations} restaurant={restaurant} setView={setView} />}
    </div>
  );

  return (
    <div style={{ minHeight: "100dvh", background: c.bg, fontFamily: fontStack().body, display: "flex", flexDirection: "column" }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Cormorant+Garamond:wght@500;600;700&family=Fraunces:opsz,wght@9..144,500;9..144,600&display=swap');
        * { font-family: 'Inter', -apple-system, sans-serif; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        /* Do NOT add `overflow-x: hidden` to html/body — on iOS Safari it breaks
           one-finger page scrolling (requires two fingers). The layout has no
           horizontal overflow, so it isn't needed. */
        /* Touch devices scroll by finger, so the bar is hidden there. Devices
           with a real pointer (a computer mouse/trackpad) get a visible,
           grabbable scrollbar — otherwise the page looks unscrollable. */
        @media (pointer: coarse) {
          ::-webkit-scrollbar { width: 0px; height: 0px; }
        }
        @media (pointer: fine) {
          * { scrollbar-width: thin; scrollbar-color: rgba(140,140,140,0.55) transparent; }
          ::-webkit-scrollbar { width: 11px; height: 11px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(140,140,140,0.5); border-radius: 8px; border: 3px solid transparent; background-clip: padding-box; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(140,140,140,0.85); background-clip: padding-box; }
        }
        select { -webkit-appearance: none; appearance: none; }
        button { touch-action: manipulation; }
        /* Prevent iOS auto-zoom on focus — keep inputs at 16px+ */
        input, select, textarea { font-size: 16px; }
        /* Left-align native date/time inputs — iOS centers their value by
           default, which looked misaligned next to the text/number fields. */
        input[type="date"], input[type="time"] { text-align: left; }
        input::-webkit-date-and-time-value { text-align: left; margin: 0; }
        input[type="date"]::-webkit-datetime-edit,
        input[type="time"]::-webkit-datetime-edit { text-align: left; }
      `}</style>

      {isDesktop ? (
        // Desktop app shell: lock the viewport (height 100dvh, no page scroll)
        // and let the CONTENT AREA scroll on its own. That way the mouse wheel
        // scrolls the content wherever the cursor is — not only over the
        // scrollbar — while the sidebar and top bar stay put.
        <div style={{ display: "flex", alignItems: "stretch", width: "100%", height: "100dvh", overflow: "hidden" }}>
          <SideNav view={activeView} setView={setView} c={c} user={user} restaurant={restaurant}
            isDark={isDark} setIsDark={setIsDark} onSignOut={signOut} onSwitchWorkspace={switchWorkspace} />
          <div style={{ flex: 1, minWidth: 0, height: "100dvh", display: "flex", flexDirection: "column" }}>
            <TopBar c={c} title={tr(titleMap[activeView])} isDark={isDark} setIsDark={setIsDark}
              notifications={notifications} notifOpen={notifOpen} unreadCount={unreadCount} onOpenNotifications={toggleNotifications} />
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
              <div style={{ width: "100%", maxWidth: contentMax, margin: "0 auto" }}>
                {screens}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: contentMax, margin: "0 auto", width: "100%", flex: 1, display: "flex", flexDirection: "column" }}>
          <TopBar c={c} title={tr(titleMap[view])} isDark={isDark} setIsDark={setIsDark}
            notifications={notifications} notifOpen={notifOpen} unreadCount={unreadCount} onOpenNotifications={toggleNotifications} />
          {screens}
          <BottomNav view={view} setView={setView} c={c} />
        </div>
      )}

      {resModal && (
        <ReservationWizard c={c} reservations={reservations} tables={tables} onClose={() => setResModal(null)}
          editing={typeof resModal === "object" ? resModal : null}
          onCreate={createReservation} onUpdate={updateReservation} onDelete={deleteReservation} />
      )}

      {newRecovery && (
        <RecoveryCodeModal c={c} code={newRecovery} restaurant={restaurant} onClose={() => setNewRecovery(null)} />
      )}
    </div>
  );
}
