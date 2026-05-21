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

/**
 * Reads `data/status.json` and returns the most recent successful ETL run.
 * Returns a human-friendly label like "21 de mayo de 2026, 06:00" or null if unavailable.
 */
export async function getLastUpdated(): Promise<string | null> {
  try {
    const filePath = path.join(process.cwd(), "data", "status.json");
    const content = await fs.readFile(filePath, "utf-8");
    const entries = JSON.parse(content) as StatusEntry[];
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
  } catch (error) {
    console.error("[getLastUpdated] No pude leer status.json:", error);
    return null;
  }
}
