# Ex Ovo – Website

Website der Ex Ovo GmbH (Webdesign & Branding, Wien).

## Aufbau

- `index.html` – Startseite
- `impressum.html`, `datenschutz.html` – Rechtliches (Platzhalter in eckigen Klammern ausfüllen)
- `src/main.js` – Ladebildschirm, Cursor, Scroll-Animationen (GSAP ScrollTrigger), Kontaktformular
- `src/egg.js` – WebGL-Partikel-Ei (Three.js)
- `src/style.css` – Gestaltung
- `public/` – Bilder und Favicon

Schriften (Unbounded, Inter) und alle Bibliotheken werden beim Build lokal eingebunden – keine Verbindung zu Google Fonts oder anderen Drittanbietern.

## Lokal starten

```bash
npm install
npm run dev
```

## Veröffentlichen mit Vercel

1. Auf vercel.com mit GitHub anmelden → „Add New Project“ → dieses Repository wählen.
2. Vercel erkennt Vite automatisch (Build: `npm run build`, Ausgabe: `dist`) → „Deploy“.
3. Unter „Settings → Domains“ `exovoagency.at` und `www.exovoagency.at` hinzufügen und die angezeigten DNS-Einträge beim Domain-Anbieter eintragen. Die bestehenden E-Mail-Einträge (MX) dabei nicht verändern.

## Vor dem Launch erledigen

- [ ] Impressum: UID-Nummer, GISA-Zahl, Gewerbe, Gewerbebehörde, Fachgruppe, Unternehmensgegenstand
- [ ] Datenschutzerklärung prüfen lassen, Hosting- und Formulardienst eintragen
- [ ] Formspree-Formular anlegen und `[FORMSPREE-ID]` in `index.html` ersetzen (bis dahin öffnet das Formular das E-Mail-Programm)
