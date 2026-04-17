# AWS Amplify Deployment — Design Spec
**Date:** 2026-04-17

## Overview

Migrate the AI English Tutor app from Netlify to AWS Amplify Hosting. Git-push to `main` triggers automatic rebuild and redeploy. No Docker, no custom CI config required. Amplify natively supports Next.js 16 App Router with SSR and API routes.

---

## Architecture

```
GitHub (main branch)
  └── push → AWS Amplify
        ├── build: npm ci && npm run build
        ├── Next.js SSR + API routes → Amplify managed compute
        └── URL: https://main.xxxxxx.amplifyapp.com
```

- API routes (`/api/chat`, `/api/translate`) run as Amplify's server-side compute — same as Netlify Functions, no code changes needed
- `GROQ_API_KEY` stored in Amplify environment variables, never in client code
- No database, no authentication — same as current setup

---

## Code Changes

| File | Action |
|------|--------|
| `package.json` | Remove `@netlify/plugin-nextjs` from devDependencies |
| `netlify.toml` | Delete entirely |

No `next.config.js` changes needed — Amplify auto-detects Next.js build settings.

---

## AWS Amplify Setup Steps

1. Create AWS account at aws.amazon.com (if not exists)
2. Navigate to AWS Amplify → "Deploy an app"
3. Connect GitHub → select `aienglish` repo → select `main` branch
4. Amplify auto-detects build command (`npm run build`) and output directory (`.next`)
5. Add environment variable: `GROQ_API_KEY` = `<value>`
6. Deploy — first build runs automatically

---

## Deploy Flow (ongoing)

Every `git push` to `main` → Amplify triggers build (~2 min) → deploys to same URL automatically.

---

## Cost

Free tier (permanently):
- 1,000 build minutes/month
- 15 GB data transfer/month
- 5 GB storage

Pet project with low traffic = $0/month.

---

## Out of Scope

- Custom domain
- Branch previews
- Access control / auth
- CDN configuration
