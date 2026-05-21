import { promises as fs } from "fs";
import path from "path";

export interface EconomicEvent {
  date: string;
  label: string;
  description: string;
  category: "crisis" | "devaluacion" | "default" | "politica";
  applies_to: string[];
}

const DEV = process.env.NODE_ENV === "development";
const CDN_URL =
  "https://cdn.jsdelivr.net/gh/DiLoretoT/estadisticas-argentinas@main/data/events.json";

let cache: EconomicEvent[] | null = null;

export async function loadEvents(): Promise<EconomicEvent[]> {
  if (cache) return cache;

  if (DEV) {
    try {
      const filePath = path.join(process.cwd(), "data", "events.json");
      const content = await fs.readFile(filePath, "utf-8");
      const parsed = JSON.parse(content) as { events: EconomicEvent[] };
      cache = parsed.events;
      return cache;
    } catch (error) {
      console.error("[loadEvents] dev local:", error);
      return [];
    }
  }

  try {
    const res = await fetch(CDN_URL, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const parsed = (await res.json()) as { events: EconomicEvent[] };
    cache = parsed.events;
    return cache;
  } catch (error) {
    console.error("[loadEvents] fetch fail:", error);
    return [];
  }
}

/** Filter events that apply to the given series tag and fall within the date range of the data */
export function filterEventsForSeries(
  events: EconomicEvent[],
  seriesTag: string,
  data: [string, number][],
): EconomicEvent[] {
  if (!data.length) return [];
  const minDate = data[0][0];
  const maxDate = data[data.length - 1][0];
  return events.filter(
    (e) =>
      (e.applies_to.includes(seriesTag) || e.applies_to.includes("all")) &&
      e.date >= minDate &&
      e.date <= maxDate,
  );
}
