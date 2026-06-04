# SchoolSaaS Frontend

Next.js 14 + TypeScript + Tailwind CSS frontend for the SchoolSaaS platform.

## Quick Start (Local)

```bash
# 1. Install dependencies
yarn install

# 2. Copy environment file
cp .env.local.example .env.local
# Edit .env.local to point to your backend API

# 3. Run dev server
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

### Option A: Vercel Dashboard (Recommended)
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo: `Osinachi-cloud/sms_frontend`
3. Framework preset: **Next.js**
4. Add environment variables from `.env.local.example`
5. Click **Deploy**

### Option B: Vercel CLI
```bash
npm install -g vercel
vercel --prod
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Your Railway backend URL + `/api` |
| `NEXT_PUBLIC_USE_MOCK_FALLBACK` | No | `true` for dev/demo mode |
| `NEXT_PUBLIC_ENABLE_AI_TUTOR` | No | `true` to show AI widget |
| `NEXT_PUBLIC_ENABLE_OFFLINE_MODE` | No | `true` to enable IndexedDB caching |

## Tech Stack

- Next.js 14 App Router
- React 18 + TypeScript
- Tailwind CSS
- Axios + SWR for data fetching
- Recharts for analytics
- TipTap rich text editor
- Framer Motion animations

## Backend Connection

This frontend expects a SchoolSaaS backend running at the URL specified in `NEXT_PUBLIC_API_BASE_URL`.

Make sure your backend's `CORS_ALLOWED_ORIGINS` includes your Vercel domain.
