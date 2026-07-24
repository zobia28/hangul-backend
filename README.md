# HangulPath API

Backend for the HangulPath Korean-learning app: auth, learning progress,
practice skill scores, TOPIK mock exams, gamification (XP/streak/badges),
and a leaderboard.

Stack: **Node.js + Express + PostgreSQL**, JWT auth with bcrypt-hashed
passwords. Chosen because it's the most widely supported combo on
Render/Railway/Fly.io, has no vendor lock-in, and Postgres scales fine
past the prototype stage.

## 1. Local setup

```bash
cd hangulpath-backend
npm install
cp .env.example .env
```

Edit `.env`:
- `DATABASE_URL` — point at a local Postgres (e.g. `postgres://postgres:postgres@localhost:5432/hangulpath`)
- `JWT_SECRET` — generate one: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

Create the database and run the schema:

```bash
createdb hangulpath        # or create it via your Postgres GUI of choice
npm run migrate            # applies src/schema.sql
```

Start the server:

```bash
npm run dev                # auto-restarts on file changes
# or
npm start
```

The API is now listening on `http://localhost:4000`. Check `GET /health` to confirm it's up.

## 2. API overview

All authenticated routes expect `Authorization: Bearer <token>`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/signup` | – | Create account (`name`, `email`, `password`, `level`, `learningStyle`) |
| POST | `/api/auth/login` | – | Log in, returns `{ token, user }` |
| GET | `/api/users/me` | ✓ | Full profile: user, skills, hangul/word progress, badges, TOPIK readiness |
| PATCH | `/api/users/me` | ✓ | Update `level`, `learningStyle`, `showLeaderboard`, `name` |
| POST | `/api/progress/hangul` | ✓ | Mark a character learned: `{ character }` |
| POST | `/api/progress/words` | ✓ | Mark a word learned: `{ wordKo, theme }` |
| POST | `/api/progress/sentences` | ✓ | Mark a sentence learned: `{ sentenceKo }` |
| POST | `/api/progress/grammar` | ✓ | Mark a grammar topic learned: `{ topic }` |
| POST | `/api/progress/skill` | ✓ | Adjust a skill score: `{ skill, delta, xp }` |
| GET | `/api/topik/questions/:level` | – | Fetch a question set for `I` or `II` (answers stripped) |
| POST | `/api/topik/attempts` | ✓ | Submit answers, get scored, updates readiness + XP |
| GET | `/api/topik/attempts` | ✓ | Past attempt history |
| GET | `/api/leaderboard` | – | Top users by XP who opted in |

Every route that awards XP also returns the user's updated `xp`, `streak`,
and any `newBadges` earned by that action, so the frontend can show a toast
without a second round-trip.

### Example: sign up, then mark a Hangul character learned

```bash
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Mina","email":"mina@example.com","password":"correcthorsebattery","level":"beginner","learningStyle":"visual"}'

# → { "token": "...", "user": { ... } }

curl -X POST http://localhost:4000/api/progress/hangul \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"character":"ㄱ"}'
```

## 3. Database schema

See `src/schema.sql`. Tables: `users`, `skill_scores`, `hangul_progress`,
`word_progress`, `sentence_progress`, `grammar_progress`, `badges`,
`topik_readiness`, `topik_attempts`. Re-run `npm run migrate` any time
the schema changes — every statement uses `CREATE TABLE IF NOT EXISTS`,
so it's safe to run repeatedly.

## 4. Deploying (Render or Railway)

Both platforms follow the same shape:

1. **Push this folder to a Git repo** (its own repo, or a `backend/` subfolder of a monorepo).
2. **Create a Postgres instance** on the platform — it gives you a `DATABASE_URL`.
3. **Create a Web Service** pointing at the repo:
   - Build command: `npm install`
   - Start command: `npm start`
4. **Set environment variables** on the service: `DATABASE_URL` (from step 2, or paste the one Render/Railway generated), `DATABASE_SSL=true`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN` (your deployed frontend's URL).
5. **Run the migration once** against the production database — either via the platform's one-off "Shell" / "Run command" feature (`npm run migrate`), or temporarily set the start command to `npm run migrate && npm start` for the first deploy.
6. Confirm `GET https://<your-app>.onrender.com/health` returns `{ "ok": true }`.

Render specifics: enable "Auto-Deploy" on push, and set the Postgres instance's
region to match the web service's region to keep latency low.

Railway specifics: adding a Postgres plugin to the same project auto-injects
`DATABASE_URL` into your service's environment — you may not need to set it
manually.

## 5. Connecting the frontend

The React artifact currently keeps all state in memory. To wire it up:
- On signup/login, store the returned `token` in memory (or a secure cookie if you add a small backend-for-frontend) and send it as `Authorization: Bearer <token>` on every request.
- Replace local `setUser` calls that award XP/mark progress with the matching API call, then apply the response's `xp`/`streak`/`newBadges` to local state.
- Fetch `/api/users/me` once on load to hydrate the dashboard instead of starting from the hardcoded defaults.

## 6. Security notes

- Passwords are hashed with bcrypt (cost factor 10); never stored in plaintext.
- Rate limiting is applied to `/api/auth/*` (30 requests / 15 min per IP) to blunt brute-force attempts.
- `helmet` sets standard security headers; `cors` restricts origins via `CORS_ORIGIN`.
- TOPIK correct answers are never sent to the client — `/api/topik/questions/:level` strips them, and scoring happens server-side in `/api/topik/attempts`.
