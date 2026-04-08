from __future__ import annotations

import os
from datetime import date
from pathlib import Path
from typing import Iterable

import psycopg
from psycopg import OperationalError
from psycopg.rows import dict_row

BASE_DIR = Path(__file__).resolve().parent
SCHEMA_PATH = BASE_DIR / "schema.sql"


def _conn_kwargs(host: str) -> dict:
  return {
    "host": host,
    "port": int(os.getenv("PGPORT", "5432")),
    "dbname": os.getenv("PGDATABASE", "estadisticapp"),
    "user": os.getenv("PGUSER", "estadisticapp"),
    "password": os.getenv("PGPASSWORD", "estadisticapp"),
    "row_factory": dict_row,
  }


def get_conn() -> psycopg.Connection:
  host = os.getenv("PGHOST", "localhost")
  primary = _conn_kwargs(host)
  try:
    return psycopg.connect(**primary)
  except OperationalError as primary_error:
    # Caso comun: ETL corriendo dentro de devcontainer sin Docker CLI, con
    # Postgres levantado en host/WSL. Probamos host.docker.internal.
    if host not in ("localhost", "127.0.0.1"):
      raise

    fallback_hosts_env = os.getenv(
      "PGHOST_FALLBACK",
      "host.docker.internal,gateway.docker.internal,172.17.0.1",
    )
    fallback_hosts = [item.strip() for item in fallback_hosts_env.split(",") if item.strip()]
    for fallback_host in fallback_hosts:
      if fallback_host == host:
        continue
      try:
        return psycopg.connect(**_conn_kwargs(fallback_host))
      except OperationalError:
        continue
    raise primary_error


def init_db() -> None:
  schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")
  with get_conn() as conn:
    with conn.cursor() as cur:
      cur.execute(schema_sql)
    conn.commit()


def upsert_series(
  series_id: str,
  display_name: str,
  source_name: str | None = None,
  dataset: str | None = None,
  official: bool | None = None,
  frequency: str | None = None,
  unit: str | None = None,
  provider_series_id: str | None = None,
) -> None:
  query = """
    INSERT INTO series (
      series_id,
      display_name,
      source_name,
      dataset,
      official,
      frequency,
      unit,
      provider_series_id
    )
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (series_id)
    DO UPDATE SET
      display_name = EXCLUDED.display_name,
      source_name = EXCLUDED.source_name,
      dataset = EXCLUDED.dataset,
      official = EXCLUDED.official,
      frequency = EXCLUDED.frequency,
      unit = EXCLUDED.unit,
      provider_series_id = EXCLUDED.provider_series_id,
      updated_at = NOW()
  """

  with get_conn() as conn:
    with conn.cursor() as cur:
      cur.execute(
        query,
        (
          series_id,
          display_name,
          source_name,
          dataset,
          official,
          frequency,
          unit,
          provider_series_id,
        ),
      )
    conn.commit()


def upsert_observations(
  series_id: str,
  observations: Iterable[tuple[date, float]],
) -> int:
  rows = [(series_id, point_date, float(value)) for point_date, value in observations]
  if not rows:
    return 0

  query = """
    INSERT INTO observations (series_id, date, value)
    VALUES (%s, %s, %s)
    ON CONFLICT (series_id, date)
    DO UPDATE SET
      value = EXCLUDED.value,
      updated_at = NOW()
  """

  with get_conn() as conn:
    with conn.cursor() as cur:
      cur.executemany(query, rows)
    conn.commit()

  return len(rows)


def start_refresh_run(series_id: str) -> int:
  query = """
    INSERT INTO refresh_runs (series_id, status)
    VALUES (%s, 'running')
    RETURNING run_id
  """
  with get_conn() as conn:
    with conn.cursor() as cur:
      cur.execute(query, (series_id,))
      run_id = int(cur.fetchone()["run_id"])
    conn.commit()
  return run_id


def finish_refresh_run(
  run_id: int,
  status: str,
  rows_upserted: int,
  error_message: str | None = None,
) -> None:
  query = """
    UPDATE refresh_runs
    SET
      finished_at = NOW(),
      status = %s,
      rows_upserted = %s,
      error_message = %s
    WHERE run_id = %s
  """
  with get_conn() as conn:
    with conn.cursor() as cur:
      cur.execute(query, (status, rows_upserted, error_message, run_id))
    conn.commit()


def update_series_refresh_status(
  series_id: str,
  last_status: str,
  last_date: date | None,
  row_count: int,
  error_message: str | None = None,
) -> None:
  query = """
    INSERT INTO series_refresh_status (
      series_id,
      last_status,
      last_run_at,
      last_date,
      row_count,
      error_message,
      updated_at
    )
    VALUES (%s, %s, NOW(), %s, %s, %s, NOW())
    ON CONFLICT (series_id)
    DO UPDATE SET
      last_status = EXCLUDED.last_status,
      last_run_at = EXCLUDED.last_run_at,
      last_date = EXCLUDED.last_date,
      row_count = EXCLUDED.row_count,
      error_message = EXCLUDED.error_message,
      updated_at = NOW()
  """

  with get_conn() as conn:
    with conn.cursor() as cur:
      cur.execute(query, (series_id, last_status, last_date, row_count, error_message))
    conn.commit()


def purge_old_refresh_runs(days: int = 90) -> int:
  query = """
    DELETE FROM refresh_runs
    WHERE finished_at < NOW() - make_interval(days => %s)
  """
  with get_conn() as conn:
    with conn.cursor() as cur:
      cur.execute(query, (days,))
      deleted = cur.rowcount
    conn.commit()
  return deleted


def get_series_status_rows() -> list[dict]:
  query = """
    SELECT
      srs.series_id,
      srs.last_status,
      srs.last_run_at,
      srs.last_date,
      srs.row_count,
      srs.error_message
    FROM series_refresh_status srs
    ORDER BY srs.series_id
  """

  with get_conn() as conn:
    with conn.cursor() as cur:
      cur.execute(query)
      return [dict(row) for row in cur.fetchall()]
