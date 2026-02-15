# OpenScribe — Usage Guide

OpenScribe is a self-hosted AI LinkedIn Content Strategist. This guide covers how to set up, run, and use all features.

---

## Prerequisites

| Tool                  | Purpose                        |
| --------------------- | ------------------------------ |
| **Node.js 18+**       | Runtime for backend & frontend |
| **Docker Desktop**    | PostgreSQL & Redis containers  |
| **Ollama** (optional) | Local AI model inference       |

---

## 1. Starting the App

### Start Infrastructure (Docker)

```bash
cd openscribe
docker compose up -d
```

This starts:

- **PostgreSQL** on port `5432`
- **Redis** on port `6379`

### Push Database Schema

```bash
cd backend
npx prisma db push
```

### Start the Backend

```bash
cd backend
npm run dev
# Runs on http://localhost:3001
```

### Start the Frontend

```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

### (Optional) Start Ollama

If you want to use a local AI model:

```bash
ollama pull phi3:mini
ollama serve
# Runs on http://localhost:11434
```

---

## 2. Registration & Login

1. Open **http://localhost:3000** in your browser.
2. Click **Register** and create an account (email, password, name).
3. After registration you are automatically logged in and redirected to the dashboard.

---

## 3. Configure an AI Provider (Required for AI Features)

Before using content generation or strategy features, you must add an API key.

1. Go to **Settings → API Keys**.
2. Select a **Provider** (OpenAI, Anthropic, or Ollama).
3. Enter the **API Key**:
     - For **Ollama (local)**: use any placeholder value like `ollama` (Ollama doesn't require a real key).
     - For **OpenAI**: use your `sk-...` key.
     - For **Anthropic**: use your Anthropic API key.
4. Enter the **Model Name**:
     - Ollama: `phi3:mini`, `llama3`, `mistral`, etc.
     - OpenAI: `gpt-4o`, `gpt-4o-mini`, etc.
     - Anthropic: `claude-sonnet-4-20250514`, etc.
5. Click **Add Key**.

---

## 4. Import LinkedIn Posts

1. Go to **Posts** from the sidebar.
2. Click the upload area and select a **CSV** or **JSON** file.

### CSV Format

Your CSV should include these columns (case-insensitive):

| Column          | Description                 |
| --------------- | --------------------------- |
| `postText`      | The body text of the post   |
| `likesCount`    | Number of likes             |
| `commentsCount` | Number of comments          |
| `sharesCount`   | Number of shares            |
| `postedAt`      | Date the post was published |

Example:

```csv
postText,likesCount,commentsCount,sharesCount,postedAt
"My first LinkedIn post about AI...",42,8,3,2024-01-15
```

After upload you'll see a success message showing how many posts were imported and how many duplicates were skipped.

---

## 5. Analyze Your Writing Style

After importing posts:

1. On the **Posts** page, click **Analyze Style** in the top-right.
2. This starts a background AI job that analyzes your writing patterns, tone, and style.
3. You can also click **Extract Topics** to identify recurring themes.

These analyses feed into strategy and content generation for more personalized output.

---

## 6. Generate a Content Strategy

1. Go to **Strategy** from the sidebar.
2. Switch to the **Generate New** tab.
3. Fill in the form:
     - **Strategy Type**: Weekly (7 days), Monthly (30 days), or Campaign (goal-driven).
     - **Posts Per Week**: How often you want to post (1–14).
     - **Primary Goal**: Thought Leadership, Lead Generation, Community Building, or Brand Awareness.
     - **Target Audience Description** (required): Describe who you're writing for.
     - **Target Industries / Roles / KPIs** (optional): Comma-separated values for more specificity.
4. Click **Generate Strategy**.
5. The strategy generates in the background. Switch to **Current Strategy** to view it once ready.

The generated strategy includes content themes with descriptions and posting frequencies.

---

## 7. Generate Content Drafts

1. Go to **Drafts** from the sidebar.
2. Switch to the **Generate New** tab.
3. Enter a **Topic** (required) — e.g., "5 AI productivity tips for developers".
4. Click **Generate Draft**.
5. The AI generates a LinkedIn post draft in the background. Switch to **My Drafts** to view it.

### Reviewing Drafts

- **Copy**: Click the copy icon to copy the post text to your clipboard.
- **Edit**: Click the edit icon to modify the draft text, then save.
- **Rate**: Use the star rating + optional text feedback to rate drafts. This feedback improves future generations.
- **Delete**: Remove drafts you don't want.

Filter drafts by status: All, Draft, Approved, or Rejected.

---

## 8. Set Your Preferences

Go to **Settings → Preferences** to configure:

| Field                 | Description                                    |
| --------------------- | ---------------------------------------------- |
| **Writing Style**     | e.g., conversational, formal, persuasive       |
| **Tone Preference**   | e.g., professional, casual, inspirational      |
| **Preferred Topics**  | Comma-separated list of topics you write about |
| **Posting Frequency** | Posts per week (1–14)                          |
| **Target Audience**   | Short description of your audience             |

These preferences are used by the AI when generating content and strategies.

---

## 9. Analytics

The **Analytics** page shows engagement metrics across your imported posts, including trends and performance breakdowns.

---

## 10. Profile Management

Go to **Settings → Profile** to update your display name. Your email is shown but cannot be changed.

---

## API Reference (Backend)

The backend runs on `http://localhost:3001/api/v1`. All authenticated endpoints require a `Bearer` token in the `Authorization` header.

| Method | Endpoint                       | Description                |
| ------ | ------------------------------ | -------------------------- |
| POST   | `/auth/register`               | Create account             |
| POST   | `/auth/login`                  | Login, get tokens          |
| POST   | `/auth/refresh`                | Refresh access token       |
| POST   | `/auth/logout`                 | Logout (send refreshToken) |
| GET    | `/users/me`                    | Get profile                |
| PUT    | `/users/me`                    | Update name                |
| PUT    | `/users/me/preferences`        | Update AI preferences      |
| POST   | `/linkedin/upload`             | Upload CSV/JSON posts      |
| GET    | `/linkedin/posts`              | List posts (pagination)    |
| DELETE | `/linkedin/posts/:id`          | Delete a post              |
| GET    | `/api-keys`                    | List API keys              |
| POST   | `/api-keys`                    | Add API key                |
| DELETE | `/api-keys/:id`                | Delete API key             |
| POST   | `/strategy/generate`           | Generate content strategy  |
| GET    | `/strategy/current`            | Get active strategy        |
| GET    | `/strategy`                    | List all strategies        |
| POST   | `/content/generate`            | Generate draft content     |
| GET    | `/content/drafts`              | List drafts                |
| GET    | `/content/drafts/:id`          | Get single draft           |
| PUT    | `/content/drafts/:id`          | Update draft               |
| DELETE | `/content/drafts/:id`          | Delete draft               |
| POST   | `/content/drafts/:id/feedback` | Submit rating/feedback     |
| POST   | `/analysis/style`              | Start style analysis job   |
| POST   | `/analysis/topics`             | Start topic extraction job |
| GET    | `/analysis/style/:jobId`       | Get job status/result      |

---

## Troubleshooting

| Issue                                | Solution                                                               |
| ------------------------------------ | ---------------------------------------------------------------------- |
| **"No valid posts found"** on upload | Check CSV has `postText` column (case-insensitive)                     |
| **Strategy generation fails**        | Ensure you have posts imported AND an AI provider (API key) configured |
| **Content generation returns 400**   | Topic is required — make sure it's not empty                           |
| **Logout returns error**             | This is handled gracefully; tokens are cleared client-side regardless  |
| **Docker containers not starting**   | Run `docker compose up -d` and verify with `docker ps`                 |
| **Ollama not connecting**            | Ensure `ollama serve` is running and accessible at port 11434          |

---

## Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL="postgresql://openscribe:openscribe_dev@localhost:5432/openscribe?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key-change-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-change-in-production"
ENCRYPTION_KEY="your-32-byte-hex-encryption-key"
PORT=3001
NODE_ENV=development
OLLAMA_BASE_URL="http://localhost:11434"
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```
