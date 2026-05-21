import { promises as fs } from "fs";
import path from "path";

interface StatusEntry {
  series_id: string;
  last_status: string;
  last_run_at: string | null;
  last_date: string | null;
  row_count: number;
  error_message: string | null;
}

const DEV = process.env.NODE_ENV === "development";
const CDN_URL =
  "https://cdn.jsdelivr.net/gh/DiLoretoT/estadisticas-argentinas@main/data/status.json";

async function loadStatus(): Promise<StatusEntry[]> {
  if (DEV) {
    try {
      const filePath = path.join(process.cwd(), "data", "status.json");
      const content = await fs.readFile(filePath, "utf-8");
      return JSON.parse(content) as StatusEntry[];
    } catch (error) {
      console.error("[lastUpdated] dev local:", error);
      return [];
    }
  }
  try {
    const res = await fetch(CDN_URL, { next: { revalidate: 1800 } });
    if (!res.ok) return [];
    return (await res.json()) as StatusEntry[];
  } catch (error) {
    console.error("[lastUpdated] fetch fail:", error);
    return [];
  }
}

/**
 * Devuelve la fecha del último refresh exitoso del ETL, formateado en español.
 */
export async function getLastUpdated(): Promise<string | null> {
  const entries = await loadStatus();
  const successful = entries
    .filter((e) => e.last_status === "success" && e.last_run_at)
    .map((e) => new Date(e.last_run_at as string).getTime())
    .filter((t) => !isNaN(t));

  if (successful.length === 0) return null;

  const maxTs = Math.max(...successful);
  const d = new Date(maxTs);

  const formatter = new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  });
  return formatter.format(d);
}

export async function getStatusEntries(): Promise<StatusEntry[]> {
  return loadStatus();
}
