# Flexicell Website (Admin)

Vue 3 admin panel for Flexicell, connected to [flexicell_api](../flexicell_api).

## Stack

- Vue 3 + TypeScript + Vite
- Vue Router + Pinia
- vue-i18n (localization)
- Axios (API client)

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Default dev server: `http://localhost:5173`

Make sure **flexicell_api** is running (default `http://localhost:8000`).

## Environment

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | API base URL (default: `http://localhost:8000/api`) |

## Localization

English strings live in `src/locales/en.json`. To add another language:

1. Copy `en.json` to e.g. `my.json` and translate values.
2. Import it in `src/i18n/index.ts` and add to `messages`.
3. The locale code must match API support (`en`, `my`).

The app sends `X-Locale` header on every API request.

## Admin sections

The sidebar mirrors the existing Laravel admin. Implemented now:

- Login (API auth)
- Dashboard (live API stats)
- Placeholder pages for all other modules

## Logos

Copied from flexicell:

- `public/img/flexicell_logo.png` — login page
- `public/img/logo.png` — sidebar
- `public/favicon.png` — browser tab
# flexicell_website
