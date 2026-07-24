-- HangulPath database schema (PostgreSQL)
-- Run once via: npm run migrate

CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  level           TEXT NOT NULL DEFAULT 'beginner',       -- beginner | some | intermediate
  learning_style  TEXT NOT NULL DEFAULT 'visual',          -- visual | quiz | practice
  show_leaderboard BOOLEAN NOT NULL DEFAULT true,
  xp              INTEGER NOT NULL DEFAULT 0,
  streak          INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS skill_scores (
  user_id        INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  pronunciation  INTEGER NOT NULL DEFAULT 40,
  writing        INTEGER NOT NULL DEFAULT 40,
  listening      INTEGER NOT NULL DEFAULT 40,
  reading        INTEGER NOT NULL DEFAULT 40
);

CREATE TABLE IF NOT EXISTS hangul_progress (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  character   TEXT NOT NULL,
  learned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, character)
);

CREATE TABLE IF NOT EXISTS word_progress (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_ko     TEXT NOT NULL,
  theme       TEXT NOT NULL,
  learned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, word_ko)
);

CREATE TABLE IF NOT EXISTS sentence_progress (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sentence_ko TEXT NOT NULL,
  learned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, sentence_ko)
);

CREATE TABLE IF NOT EXISTS grammar_progress (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic       TEXT NOT NULL,
  learned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, topic)
);

CREATE TABLE IF NOT EXISTS badges (
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_name  TEXT NOT NULL,
  earned_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_name)
);

CREATE TABLE IF NOT EXISTS topik_readiness (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level      TEXT NOT NULL,          -- 'I' | 'II'
  readiness  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, level)
);

CREATE TABLE IF NOT EXISTS topik_attempts (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level          TEXT NOT NULL,
  score          INTEGER NOT NULL,
  correct_count  INTEGER NOT NULL,
  total_count    INTEGER NOT NULL,
  skill_breakdown JSONB,
  taken_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_topik_attempts_user ON topik_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_users_xp ON users(xp DESC);
