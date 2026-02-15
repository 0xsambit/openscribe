# OpenScribe

OpenScribe is a self-hosted AI LinkedIn Content Strategist.

This guide covers:

- local setup
- starting/stopping services
- Ollama configuration
- end-to-end feature testing

## 1) Prerequisites

- Node.js `>= 20`
- npm
- Docker Desktop (for PostgreSQL + Redis)
- Ollama (installed locally)

## 2) First-time setup

From the project root:

```powershell
npm install
```

Copy environment file:

```powershell
copy .env.example .env
```

> `.env` already has local defaults for Docker + Ollama in this project.

## 3) Start infrastructure (Postgres + Redis)

```powershell
docker compose up -d
```

Verify:

```powershell
docker compose ps
```

You should see `openscribe-postgres` and `openscribe-redis` as `healthy`.

## 4) Prepare database schema

```powershell
npm run db:push
```

## 5) Ollama setup

Check Ollama is available:

```powershell
ollama list
```

If no model exists, pull one:

```powershell
ollama pull phi3:mini
```

Optional quick check:

```powershell
ollama run phi3:mini "Write a short LinkedIn post about learning in public"
```

## 6) Start the app

From root:

```powershell
npm run dev
```

App URLs:

- Frontend: http://localhost:3000
- Backend health: http://localhost:3001/api/v1/health

---

## 7) How to use the app

1. Open http://localhost:3000
2. Register a new account (or login)
3. Go to Dashboard → Settings
4. Add AI Provider configuration:
     - Provider: `ollama`
     - API Key: `ollama` (placeholder value is fine)
     - Model: `phi3:mini`
5. Save
6. Go to Dashboard → Posts and import LinkedIn posts (CSV or JSON)
7. Go to Analytics to run analysis
8. Go to Strategy to generate strategy
9. Go to Drafts to generate post drafts

---

## 8) End-to-end test checklist

Use this sequence to validate all major features:

### A. Auth

- [ ] Register succeeds
- [ ] Login succeeds
- [ ] On refresh, session remains logged in
- [ ] Logout works and redirects to login

### B. API key / provider setup

- [ ] Save Ollama provider config
- [ ] No 401 on authenticated dashboard API calls

### C. LinkedIn import

- [ ] Upload CSV/JSON successfully
- [ ] Imported posts appear in posts list
- [ ] Pagination works

### D. Analytics

- [ ] Style analysis runs
- [ ] Engagement/topic analytics run
- [ ] Results render without errors

### E. Strategy generation

- [ ] Strategy can be generated
- [ ] Current strategy view loads

### F. Draft generation

- [ ] Generate drafts from strategy/posts
- [ ] Draft list displays generated content
- [ ] Draft status updates work (approve/reject if enabled)

---

## 9) Sample CSV for testing import

Save as `sample-posts.csv`:

```csv
postText,likesCount,commentsCount,sharesCount,postedAt
"Just shipped a major feature at work. Here's what I learned about shipping fast without breaking things: 1) Start with the smallest possible scope 2) Ship to 5% of users first 3) Monitor like crazy for 24 hours 4) Iterate based on real feedback. The biggest lesson? Perfect is the enemy of shipped.",142,28,12,2024-12-01
"5 lessons from my first year as an engineering manager: 1) Your job is to multiply the output of others not do the work yourself 2) 1-on-1s are sacred - never cancel them 3) Feedback should be frequent and specific 4) Celebrate wins publicly address issues privately 5) Your team's growth is your success metric. What would you add?",328,64,45,2024-11-15
"Hot take: Most best practices are just popular practices. What actually matters is understanding the WHY behind each decision. Context always beats dogma.",189,52,18,2024-10-20
"The biggest career mistake I see engineers make: optimizing for compensation instead of learning velocity. In your 20s and early 30s compound learning beats compound interest.",256,71,34,2024-09-10
"I interviewed 50+ senior engineers last year. The #1 trait that separated the great ones? They could explain complex things simply. Technical depth is table stakes. Communication is the force multiplier.",403,98,67,2024-08-05
```

> **Note**: Column names are flexible. The parser recognizes variations like `Post`, `post_text`, `Content`, `Date`, `Posted`, etc.

To use:

1. Save the above content to `sample-posts.csv`
2. Go to Dashboard → Posts
3. Click the large **"Click to upload CSV or JSON"** box
4. Select your CSV file
5. Wait for import confirmation

---

## 10) Stop / restart commands

### Stop app (frontend + backend)

In the terminal running `npm run dev`, press `Ctrl + C`.

### Stop Docker services

```powershell
docker compose down
```

### Start again

```powershell
docker compose up -d
npm run dev
```

### Full reset (delete DB volume)

```powershell
docker compose down -v
docker compose up -d
npm run db:push
```

---

## 11) Troubleshooting

### `localhost:3000` not loading

- Ensure frontend is running (check terminal output)
- Check port conflict:

```powershell
netstat -ano | findstr :3000
```

Kill stale process if needed:

```powershell
taskkill /PID <PID> /F
```

### 401 errors after login/register

- Usually means tokens were not stored or are stale
- Logout and login again
- Hard refresh browser (`Ctrl + Shift + R`)

### DB connection errors

- Ensure containers are running:

```powershell
docker compose ps
```

### Ollama generation errors

- Ensure Ollama service is running
- Ensure model exists:

```powershell
ollama list
```

- Ensure model name in app settings exactly matches installed model (`phi3:mini`)

---

## 12) Useful scripts

From root:

```powershell
npm run dev
npm run dev:backend
npm run dev:frontend
npm run build
npm run build:backend
npm run build:frontend
npm run db:push
npm run db:studio
```

---

If you want, I can also add a quick Postman collection JSON in the repo for testing auth, posts import, strategy, and drafts APIs directly.
