import { promises as fs } from "fs";
import path from "path";
import { fetchDataJson } from "./cdn";

export interface EconomicEvent {
  date: string;
  label: string;
  description: string;
  category: "crisis" | "devaluacion" | "default" | "politica";
  applies_to: string[];
}

const DEV = process.env.NODE_ENV === "development";

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

  const data = await fetchDataJson<{ events: EconomicEvent[] }>(
    "events.json",
    86400,
  );
  if (data?.events) {
    cache = data.events;
    return cache;
  }
  return [];
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
