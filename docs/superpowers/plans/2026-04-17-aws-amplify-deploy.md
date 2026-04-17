# AWS Amplify Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the AI English Tutor app from Netlify to AWS Amplify with git-push auto-deploys.

**Architecture:** Remove Netlify-specific files and dependencies, verify the Next.js build works standalone, then connect the GitHub repo to AWS Amplify via the console. Amplify natively handles Next.js 16 App Router SSR and API routes with no adapter needed.

**Tech Stack:** Next.js 16, AWS Amplify Hosting, GitHub

---

### Task 1: Remove Netlify dependencies and config

**Files:**
- Modify: `package.json`
- Delete: `netlify.toml`

- [ ] **Step 1: Remove `@netlify/plugin-nextjs` from package.json devDependencies**

Edit `package.json` — remove this line from `devDependencies`:
```json
"@netlify/plugin-nextjs": "^5.15.9",
```

Result:
```json
"devDependencies": {
  "@tailwindcss/postcss": "^4",
  "@testing-library/jest-dom": "^6.9.1",
  "@testing-library/react": "^16.3.2",
  "@testing-library/user-event": "^14.6.1",
  "@types/node": "^20",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "@vitejs/plugin-react": "^4.7.0",
  "eslint": "^9",
  "eslint-config-next": "16.2.3",
  "happy-dom": "^20.9.0",
  "jsdom": "^27.0.1",
  "tailwindcss": "^4",
  "typescript": "^5",
  "vitest": "^4.1.4"
}
```

- [ ] **Step 2: Delete `netlify.toml`**

```bash
rm netlify.toml
```

- [ ] **Step 3: Reinstall dependencies to clean lockfile**

```bash
npm install
```

Expected: lock file updated, no `@netlify/plugin-nextjs` in `node_modules`.

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

Expected: exits with code 0, `.next/` directory produced, no Netlify-related errors.

- [ ] **Step 5: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json
git rm netlify.toml
git commit -m "chore: remove Netlify plugin and config, prepare for Amplify"
```

---

### Task 2: Set up AWS Amplify (manual console steps)

**No code changes — AWS console walkthrough.**

- [ ] **Step 1: Create AWS account**

Go to https://aws.amazon.com → "Create an AWS Account". Use your email. Choose "Free" support plan.

- [ ] **Step 2: Open AWS Amplify**

In the AWS Console search bar, type `Amplify` → click "AWS Amplify".

Make sure region is set to one close to your users (top-right dropdown). `eu-central-1` (Frankfurt) recommended for Europe.

- [ ] **Step 3: Start new app**

Click **"Deploy an app"** → select **GitHub** → click **"Next"**.

Authorize AWS to access your GitHub account when prompted.

- [ ] **Step 4: Select repository**

- Repository: `aienglish`
- Branch: `main`
- Click **Next**

- [ ] **Step 5: Review build settings**

Amplify auto-detects Next.js. Confirm:
- Build command: `npm run build`
- Output directory: `.next`

If not auto-detected, set them manually. Click **Next**.

- [ ] **Step 6: Add environment variable**

Before deploying, find the **"Environment variables"** section on the same screen.

Add:
| Key | Value |
|-----|-------|
| `GROQ_API_KEY` | `<your Groq API key>` |

- [ ] **Step 7: Deploy**

Click **"Save and deploy"**. First build starts automatically (~2 min).

- [ ] **Step 8: Verify deployment**

Once build shows green ✓:
- Click the auto-generated URL (format: `https://main.xxxxxx.amplifyapp.com`)
- Open the app in browser
- Test voice input or text input — confirm tutor responds
- Check browser console for no errors

---

### Task 3: Verify API routes work in production

- [ ] **Step 1: Test `/api/chat`**

In the deployed app, type a message and send it. Confirm tutor reply appears. If it fails, check Amplify → App → "Monitoring" tab for server-side logs.

- [ ] **Step 2: Test `/api/translate`**

Click the translate button on a tutor message. Confirm Ukrainian translation appears below the message.

- [ ] **Step 3: Confirm env var is set correctly if requests fail**

In Amplify Console → App → "Environment variables" — verify `GROQ_API_KEY` is present.

If missing or wrong: update it → Amplify Console → "Redeploy this version" (or push an empty commit to trigger rebuild).

```bash
git commit --allow-empty -m "chore: trigger redeploy"
git push
```
