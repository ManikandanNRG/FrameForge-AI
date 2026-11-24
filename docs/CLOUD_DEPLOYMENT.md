# Remote Cloud Deployment Guide — AI Filmmaking Studio

This guide provides the complete, production-tested steps to deploy your **AI Filmmaking Studio (CineFlow)** to the cloud so you can access and manage your film projects from your mobile phone, laptop, or any browser anywhere in the world.

---

## 1. Cloud Architecture Overview

```
                      ┌──────────────────────────────────────────────┐
                      │                 USER CLIENT                  │
                      │  Mobile Safari / Chrome / Desktop Browser    │
                      └──────────────────────┬───────────────────────┘
                                             │ HTTPS
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │              VERCEL / RAILWAY                │
                      │         Next.js 15 App Router & API          │
                      │       In-App AI Director Chat Co-Pilot       │
                      └──────────────┬────────────────┬──────────────┘
                                     │                │
                     Prisma / Pooling│                │ BullMQ
                                     ▼                ▼
       ┌───────────────────────────────────┐    ┌─────────────────────────────────┐
       │         SUPABASE / NEON           │    │          UPSTASH REDIS          │
       │    Serverless PostgreSQL DB       │    │    Serverless BullMQ Queue      │
       │  (Projects, Scenes, Shots, Chat)  │    │     (Background Generation)     │
       └───────────────────────────────────┘    └─────────────────────────────────┘
                                     ▲
                                     │ Secure Auth Token
                      ┌──────────────┴───────────────────────────────┐
                      │        LOCAL COMPANION SERVICE (Optional)     │
                      │   Home PC / Mac running FFmpeg & Local Media │
                      └──────────────────────────────────────────────┘
```

---

## 2. Prerequisites & Free Tier Services

All recommended cloud services below offer generous **Free Tiers** sufficient to run your studio 24/7 at $0 cost:

| Component | Recommended Cloud Provider | Free Tier Limit |
| :--- | :--- | :--- |
| **Frontend & API** | [Vercel](https://vercel.com) | Unlimited hobby deployments, SSL, global CDN |
| **PostgreSQL DB** | [Supabase](https://supabase.com) or [Neon](https://neon.tech) | 500 MB storage, connection pooling, automated backups |
| **Redis Queue** | [Upstash Redis](https://upstash.com) | 10,000 requests/day, serverless REST/TLS |
| **AI Text Engine** | Google Gemini API & OpenRouter | Gemini (1,500 requests/day free), OpenRouter (200 req/day free) |

---

## 3. Step-by-Step Deployment Instructions

### Step 1: Provision the Cloud PostgreSQL Database
1. Go to **[Supabase](https://supabase.com)** or **[Neon](https://neon.tech)** and create a new project.
2. Select your nearest region (e.g., `ap-south-1` or `us-east-1`).
3. Under **Database Settings**, copy the **Transaction Pooler Connection String** (port `6543` for Supabase, or connection pooled URL for Neon):
   ```
   DATABASE_URL="postgresql://postgres.[YOUR-PROJECT]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.[YOUR-PROJECT]:[YOUR-PASSWORD]@aws-0-[REGION].supabase.com:5432/postgres"
   ```

### Step 2: Provision the Cloud Redis Cache & Queue
1. Go to **[Upstash](https://upstash.com)** and create a **Serverless Redis Database**.
2. Under the **Details** tab, copy the **`REDIS_URL`** connection string:
   ```
   REDIS_URL="rediss://default:[YOUR-UPSTASH-PASSWORD]@[YOUR-ENDPOINT].upstash.io:6379"
   ```

### Step 3: Configure Environment Variables
Create or verify your cloud environment variables:

```bash
# Database
DATABASE_URL="postgresql://..."

# Background Queue
REDIS_URL="rediss://..."

# Authentication & Security
AUTH_SECRET="generate-a-secure-32-byte-hex-string"
NEXTAUTH_URL="https://your-studio-app.vercel.app"

# AI Generation Keys (Free Tiers Supported)
GEMINI_API_KEY="AIzaSy..."
OPENROUTER_API_KEY="sk-or-v1-..."

# Media Storage Configuration
STORAGE_BACKEND="LOCAL_COMPANION" # or "S3_COMPATIBLE" if using AWS/Cloudflare R2
```

### Step 4: Deploy to Vercel
1. Push your repository to your private GitHub/GitLab account:
   ```powershell
   git add .
   git commit -m "feat: in-app AI director chat & cloud deployment readiness"
   git push origin main
   ```
2. Open **[Vercel Dashboard](https://vercel.com/new)** and click **Add New > Project**.
3. Import your GitHub repository.
4. Framework Preset will auto-detect **Next.js**.
5. In **Environment Variables**, paste the keys from Step 3 (`DATABASE_URL`, `REDIS_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, `GEMINI_API_KEY`).
6. Click **Deploy**. Vercel will build and deploy your app in ~90 seconds.

### Step 5: Initialize the Remote Database Schema
Once your Vercel deployment is active, run the initial database schema push to Supabase/Neon:
```powershell
# Set your remote database URL temporarily in your terminal
$env:DATABASE_URL="postgresql://..."
npx prisma db push
```

---

## 4. Accessing Your Studio Remotely

Once deployed, you can access your studio from anywhere:
- **Phone / Mobile**: Open `https://your-studio-app.vercel.app` in Chrome or Safari. Add to Home Screen as a PWA.
- **Laptop / Remote Office**: Log in to manage scripts, generate image/video prompts, review storyboards, and export release kits.
- **In-App AI Director Chat**:
  - Tap the **✨ AI Director** floating button in the bottom right corner of any page.
  - Send messages like:
    - *"Change Scene 1 hook to a 4-beat transformation montage"*
    - *"Align machine in Scene 4 and 5"*
    - *"Audit ASMR QC score"*
  - The AI Director executes the database changes, updates scene prompts via the Universal Prompt Compiler, and returns verified QC scores directly to your mobile screen!

---

## 5. Local Media Companion Integration (Optional)

If you render 4K video exports locally on your GPU or external hard drive:
1. Run the local companion service on your home workstation:
   ```powershell
   npm run companion
   ```
2. In the online web UI under **Settings > Media Storage**, enter your companion's pairing token.
3. The online app will orchestrate project planning and prompt generation, while offloading heavy video rendering and raw file storage to your local disk.
