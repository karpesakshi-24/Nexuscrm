# NexusCRM — React Frontend

A dark, elegant CRM frontend built with React + Vite + Tailwind CSS, designed to connect to the NexusCRM Django backend.

## Stack

| Tool | Purpose |
|---|---|
| React 18 + Vite | Fast build & HMR |
| Tailwind CSS | Utility-first styling |
| React Router v6 | Client-side routing |
| Axios | HTTP client with JWT interceptor |
| TanStack Query | Data fetching + caching |
| Zustand | Auth state (persisted) |
| Recharts | Dashboard charts |
| @dnd-kit | Kanban drag-and-drop |
| react-hot-toast | Toast notifications |
| Lucide React | Icon set |

## Pages

| Route | Page |
|---|---|
| `/login` | JWT login |
| `/` | Dashboard (stats, revenue chart, funnel, leaderboard) |
| `/contacts` | Contact list with search/filter/pagination |
| `/contacts/:id` | Contact detail + activity log |
| `/tasks` | Task manager (all/today/overdue/upcoming tabs) |
| `/pipeline` | Kanban board with drag-and-drop |
| `/emails` | Email threads + compose |
| `/notifications` | In-app notifications |
| `/reports` | Revenue, funnel, agent leaderboard |
| `/settings` | Profile, password, user management |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — for local dev the default proxy works without changes

# 3. Run dev server
npm run dev
# → http://localhost:3000
```

## Environment

```env
# For local dev — Vite proxies /api → localhost:8000 automatically
# For production — set to your Railway backend URL
VITE_API_URL=http://localhost:8000/api
```

## Production Build

```bash
npm run build
# Output goes to /dist — deploy to Vercel
```

## Deployment (Vercel)

1. Push to GitHub
2. Import repo on Vercel
3. Set `VITE_API_URL` to your Railway backend URL (e.g. `https://nexuscrm.railway.app/api`)
4. Deploy — `vercel.json` handles SPA routing

## Design

- **Dark theme** — deep indigo/purple palette
- **Fonts** — Syne (headings), DM Sans (body), JetBrains Mono (code)
- **Accent color** — `#c341f0` (vivid purple)
- **Cards** — glassmorphism with subtle borders
- **Animations** — fade-up on page load, smooth transitions
