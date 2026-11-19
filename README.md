# Garnet Board

## Run locally

1. Copy `.env.example` to `.env` and set `MONGODB_URI` to your Atlas connection string.
2. In Atlas → Network Access, allow your IP (or `0.0.0.0/0`).
3. Run:

   ```bash
   npm install
   npm run import
   npm run dev
   ```

4. Open http://localhost:5173.

## Deploy to Vercel

1. In Atlas → Network Access, allow `0.0.0.0/0`.
2. In Vercel → Settings → Environment Variables, add `MONGODB_URI` and `CRON_SECRET` (any random text).
3. Push to `main`. Vercel builds and deploys it.
