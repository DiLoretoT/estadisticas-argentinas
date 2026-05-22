/**
 * Helpers para perfiles provinciales.
 *
 * Maneja:
 *  - Lectura de provincias_stats.json (en server, fs en dev / fetch CDN en prod).
 *  - Slug ↔ nombre canónico.
 *  - Lookup por slug.
 */

export interface ProvinciaStat {
  provincia: string;
  poblacion?: number;
  area_km2?: number;
  densidad?: number;
  idh?: number;
  export_total?: number;
  export_pp?: number;
  export_moa?: number;
  export_moi?: number;
  export_cye?: number;
  tipo_economia?: string;
}

export interface IndicatorMeta {
  key: string;
  label: string;
  category?: string;
  unit: string;
  higher_is_better: boolean;
  source: string;
  description?: string;
}

export interface ProvinciasStatsFile {
  indicators: IndicatorMeta[];
  data: ProvinciaStat[];
  notes?: Record<string, string>;
}

/** Slugify: "Tierra del Fuego" → "tierra-del-fuego" */
export function provinciaSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** Encuentra una provincia en stats data por slug. */
export function findBySlug(
  stats: ProvinciasStatsFile,
  slug: string,
): ProvinciaStat | undefined {
  return stats.data.find((p) => provinciaSlug(p.provincia) === slug);
}

/** Devuelve las 24 provincias con su slug + nombre. */
export function listAllSlugs(stats: ProvinciasStatsFile): {
  slug: string;
  provincia: string;
}[] {
  return stats.data.map((p) => ({
    slug: provinciaSlug(p.provincia),
    provincia: p.provincia,
  }));
}

/** Computa el ranking de una provincia en un indicador dado, devuelve {rank, total}. */
export function rankIn(
  stats: ProvinciasStatsFile,
  provincia: string,
  key: keyof ProvinciaStat,
): { rank: number; total: number; isTopHalf: boolean } | null {
  const values = stats.data
    .map((p) => ({ prov: p.provincia, val: (p[key] as number | undefined) ?? null }))
    .filter((p) => typeof p.val === "number") as { prov: string; val: number }[];
  if (values.length === 0) return null;
  const meta = stats.indicators.find((i) => i.key === key);
  const higher = meta?.higher_is_better ?? true;
  values.sort((a, b) => (higher ? b.val - a.val : a.val - b.val));
  const idx = values.findIndex((v) => v.prov === provincia);
  if (idx === -1) return null;
  return {
    rank: idx + 1,
    total: values.length,
    isTopHalf: idx + 1 <= values.length / 2,
  };
}
