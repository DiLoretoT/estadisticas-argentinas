import { promises as fs } from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const seriesDir = path.join(dataDir, "series");

export async function readIndicator(
  fileName: string
): Promise<Record<string, unknown>> {
  try {
    const content = await fs.readFile(
      path.join(dataDir, fileName),
      "utf-8"
    );
    return JSON.parse(content);
  } catch {
    return {};
  }
}

export async function readSeries(
  fileName: string
): Promise<[string, number][]> {
  try {
    const content = await fs.readFile(
      path.join(seriesDir, fileName),
      "utf-8"
    );
    return JSON.parse(content);
  } catch {
    return [];
  }
}
