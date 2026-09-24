# Cinou AI — website

Plain HTML/CSS/JS, no build step. Open `index.html` in a browser, or host
the folder on any static host (Netlify, Vercel, GitHub Pages, S3, etc.).

## Files
- `index.html` — page markup
- `styles.css` — all styling (warm cream/terracotta palette built around your logo)
- `script.js` — mobile nav, the phone-download modal, and the comment system
- `assets/logo.png` — your uploaded logo, used as the nav mark, favicon, and inside the hero mockup

## Before you launch: replace the placeholder links
Every button that should point somewhere real currently has:

```html
href="DESTINATION"
```

Search the project for `DESTINATION` and swap each one for the real URL. They are:
- **Try Cinou AI** (nav + hero) → your web app URL
- **Cinou Premium / Get Cinou Premium / Upgrade to Premium** → your pricing/checkout page
- **Open Cinou AI** (download section) → your web app URL
- **Android download** (inside the phone modal, and the "Cinou on the web" tile) → Google Play listing
- **Privacy / Terms** (footer) → your legal pages

The **iPhone** download and the **PC app** are marked "Coming soon" and are intentionally
not links yet — turn them into real links (and remove the `disabled` attribute on the
PC button) once those builds ship.

## About the comment system
It's a real, working comment + nested-reply system — people can post a comment, and
reply to any comment, right now, with no setup. It currently stores everything in the
visitor's own browser via `localStorage`, so:
- It works immediately, with no backend, and comments persist for that visitor across visits.
- Comments are **not shared between visitors** — each person only sees their own browser's copy (plus the two seeded example comments).

To make comments shared and public across all visitors, point `script.js` at a small
backend (e.g. a Firebase/Supabase collection, or your own API with a `comments` table)
and swap the `loadComments`/`saveComments` functions for `fetch` calls. The rendering
logic (`renderComment`, `renderReply`, avatars, timestamps) can stay as-is.

## Fonts
The page loads **Fraunces** (headlines) and **Inter** (body/UI) from Google Fonts via
the `@import` at the top of `styles.css`. If you need it fully self-contained/offline,
download those font files and swap the `@import` for local `@font-face` rules.
