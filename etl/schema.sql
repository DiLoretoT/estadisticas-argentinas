CREATE TABLE IF NOT EXISTS series (
  series_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  source_name TEXT,
  dataset TEXT,
  official BOOLEAN,
  frequency TEXT,
  unit TEXT,
  provider_series_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS observations (
  series_id TEXT NOT NULL REFERENCES series(series_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (series_id, date)
);

CREATE TABLE IF NOT EXISTS refresh_runs (
  run_id BIGSERIAL PRIMARY KEY,
  series_id TEXT NOT NULL REFERENCES series(series_id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running',
  rows_upserted INTEGER NOT NULL DEFAULT 0,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_refresh_runs_series_started
  ON refresh_runs (series_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_observations_date
  ON observations (date);

CREATE TABLE IF NOT EXISTS series_refresh_status (
  series_id TEXT PRIMARY KEY REFERENCES series(series_id) ON DELETE CASCADE,
  last_status TEXT NOT NULL,
  last_run_at TIMESTAMPTZ,
  last_date DATE,
  row_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
