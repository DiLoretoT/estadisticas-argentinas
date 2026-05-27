"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

// Tipos GeoJSON mínimos locales para no depender de @types/geojson
interface PolygonGeom {
  type: "Polygon";
  coordinates: number[][][];
}
interface MultiPolygonGeom {
  type: "MultiPolygon";
  coordinates: number[][][][];
}
interface Feature {
  type: "Feature";
  geometry: PolygonGeom | MultiPolygonGeom | null;
  properties: { provincia?: string } | null;
}
export interface FeatureCollection {
  type: "FeatureCollection";
  features: Feature[];
}

interface ProvinciaStat {
  provincia: string;
  [key: string]: string | number;
}

interface IndicatorMeta {
  key: string;
  label: string;
  unit: string;
  higher_is_better: boolean;
  source: string;
  /** Agrupador opcional para UI: "Demografía", "Economía", "Social", "Política". */
  category?: string;
  /** Texto corto que ayuda al usuario a interpretar el indicador. */
  description?: string;
}

interface Props {
  geojson: FeatureCollection;
  data: ProvinciaStat[];
  indicators: IndicatorMeta[];
  defaultIndicator?: string;
}

const W = 700;
const H = 900;
const PAD = 20;

/** Equirectangular projection — basta para Argentina, no necesita Mercator. */
function project(
  lng: number,
  lat: number,
  bounds: { minLng: number; maxLng: number; minLat: number; maxLat: number },
  width: number,
  height: number,
): [number, number] {
  const x =
    PAD +
    ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * (width - 2 * PAD);
  const y =
    PAD +
    ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * (height - 2 * PAD);
  return [x, y];
}

/** Convierte un ring de coordenadas [lng, lat][] en string SVG path. */
function ringToPath(
  ring: number[][],
  bounds: { minLng: number; maxLng: number; minLat: number; maxLat: number },
  width: number,
  height: number,
): string {
  return ring
    .map(([lng, lat], i) => {
      const [x, y] = project(lng, lat, bounds, width, height);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join("") + "Z";
}

/** Calcula bbox global de un FeatureCollection. */
function computeBounds(fc: FeatureCollection) {
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const feature of fc.features) {
    const geom = feature.geometry;
    if (!geom) continue;
    const walk = (coords: unknown) => {
      if (Array.isArray(coords) && typeof coords[0] === "number") {
        const [lng, lat] = coords as [number, number];
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      } else if (Array.isArray(coords)) {
        coords.forEach(walk);
      }
    };
    walk((geom as PolygonGeom | MultiPolygonGeom).coordinates);
  }
  return { minLng, maxLng, minLat, maxLat };
}

/** Color choropleth interpolando entre color base claro y saturado. */
function colorFor(
  value: number | null,
  min: number,
  max: number,
  higherIsBetter: boolean,
): string {
  if (value === null) return "var(--color-bg-alt)";
  const range = max - min || 1;
  const t = Math.min(1, Math.max(0, (value - min) / range));
  // Si higher_is_better, escala verde-claro → verde-fuerte.
  // Si no (ej. desempleo, deuda), escala amarillo-claro → rojo-fuerte.
  // Usamos OKLCH para uniforme percepción.
  const lightness = 0.92 - t * 0.4; // 0.92 → 0.52
  const chroma = 0.04 + t * 0.16; // 0.04 → 0.20
  const hue = higherIsBetter ? 150 : 38; // verde vs terracotta
  return `oklch(${lightness} ${chroma} ${hue})`;
}

function fmtValue(v: number, unit: string): string {
  if (unit === "habitantes") {
    if (v >= 1e6) return `${(v / 1e6).toFixed(2)} M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(0)} mil`;
    return v.toLocaleString("es-AR");
  }
  if (unit === "km²") return v.toLocaleString("es-AR") + " km²";
  if (unit === "hab/km²")
    return v.toLocaleString("es-AR", { maximumFractionDigits: 1 });
  if (unit === "millones de USD") {
    if (v >= 1000) return `US$ ${(v / 1000).toFixed(1)} mil M`;
    return `US$ ${v.toLocaleString("es-AR", { maximumFractionDigits: 0 })} M`;
  }
  if (unit === "índice 0-1")
    return v.toLocaleString("es-AR", { maximumFractionDigits: 3 });
  return v.toLocaleString("es-AR", { maximumFractionDigits: 2 });
}

/** Regex de combining marks construido dinamicamente para evitar
 *  caracteres combining literales en el source code. */
const COMBINING_REGEX = new RegExp(
  "[" + String.fromCharCode(0x0300) + "-" + String.fromCharCode(0x036f) + "]",
  "g",
);

/** Slugify para URL de provincia. */
function toSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(COMBINING_REGEX, "")
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function ArgentinaMap({
  geojson,
  data,
  indicators,
  defaultIndicator,
}: Props) {
  const router = useRouter();
  const [currentInd, setCurrentInd] = useState(
    defaultIndicator || indicators[0]?.key || "poblacion",
  );
  const [hoverProv, setHoverProv] = useState<string | null>(null);

  const indicatorMeta = indicators.find((i) => i.key === currentInd) || indicators[0];

  // Mapping provincia → valor
  const dataMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const row of data) {
      const v = row[currentInd];
      if (typeof v === "number") m.set(row.provincia, v);
    }
    return m;
  }, [data, currentInd]);

  // Min/max para escala de color
  const { min, max } = useMemo(() => {
    const values = Array.from(dataMap.values());
    if (!values.length) return { min: 0, max: 1 };
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [dataMap]);

  // BBox + paths
  const { bounds, paths } = useMemo(() => {
    const b = computeBounds(geojson);
    const ps = geojson.features.map((f) => {
      const props = f.properties as { provincia?: string };
      const provincia = props.provincia || "";
      const geom = f.geometry as PolygonGeom | MultiPolygonGeom | null;
      if (!geom) return { provincia, path: "" };

      let path = "";
      if (geom.type === "Polygon") {
        for (const ring of geom.coordinates) {
          path += ringToPath(ring, b, W, H);
        }
      } else if (geom.type === "MultiPolygon") {
        for (const polygon of geom.coordinates) {
          for (const ring of polygon) {
            path += ringToPath(ring, b, W, H);
          }
        }
      }
      return { provincia, path };
    });
    return { bounds: b, paths: ps };
  }, [geojson]);

  // Ranking para tabla lateral
  const ranking = useMemo(() => {
    return [...dataMap.entries()]
      .sort((a, b) => {
        return indicatorMeta?.higher_is_better ? b[1] - a[1] : a[1] - b[1];
      })
      .map(([provincia, value], i) => ({
        rank: i + 1,
        provincia,
        value,
      }));
  }, [dataMap, indicatorMeta]);

  // Agrupar indicadores por categoría
  const categories = useMemo(() => {
    const map = new Map<string, IndicatorMeta[]>();
    for (const ind of indicators) {
      const cat = ind.category || "Indicadores";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(ind);
    }
    return Array.from(map.entries());
  }, [indicators]);

  if (!indicatorMeta) {
    return <div>Sin indicadores disponibles.</div>;
  }

  return (
    <div className="space-y-4">
      {/* Selector agrupado por categoría */}
      {categories.length > 1 ? (
        <div className="space-y-2">
          {categories.map(([cat, inds]) => (
            <div key={cat} className="flex flex-wrap items-center gap-2">
              <span
                className="text-[10px] font-semibold uppercase tracking-wider min-w-[80px]"
                style={{ color: "var(--color-text-muted)" }}
              >
                {cat}
              </span>
              {inds.map((ind) => (
                <button
                  key={ind.key}
                  onClick={() => setCurrentInd(ind.key)}
                  className="text-sm px-3 py-1.5 rounded-lg border transition-colors"
                  style={{
                    background:
                      currentInd === ind.key
                        ? "var(--color-primary)"
                        : "var(--color-card)",
                    color:
                      currentInd === ind.key ? "#fff" : "var(--color-text)",
                    borderColor: "var(--color-border)",
                    fontWeight: currentInd === ind.key ? 600 : 400,
                  }}
                  title={ind.description}
                >
                  {ind.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {indicators.map((ind) => (
            <button
              key={ind.key}
              onClick={() => setCurrentInd(ind.key)}
              className="text-sm px-3 py-1.5 rounded-lg border transition-colors"
              style={{
                background:
                  currentInd === ind.key
                    ? "var(--color-primary)"
                    : "var(--color-card)",
                color:
                  currentInd === ind.key ? "#fff" : "var(--color-text)",
                borderColor: "var(--color-border)",
                fontWeight: currentInd === ind.key ? 600 : 400,
              }}
              title={ind.description}
            >
              {ind.label}
            </button>
          ))}
        </div>
      )}

      {/* Descripción del indicador actual */}
      {indicatorMeta.description && (
        <p
          className="text-xs leading-relaxed"
          style={{ color: "var(--color-text-muted)" }}
        >
          {indicatorMeta.description}
        </p>
      )}

      <div className="grid md:grid-cols-3 gap-5">
        {/* Mapa */}
        <div
          className="md:col-span-2 rounded-xl border overflow-hidden relative"
          style={{
            background: "var(--color-card)",
            borderColor: "var(--color-border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="px-4 pt-3 pb-1">
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              {indicatorMeta.label}
            </h3>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ display: "block" }}>
            {paths.map(({ provincia, path }) => {
              const value = dataMap.get(provincia) ?? null;
              const fill = colorFor(value, min, max, indicatorMeta.higher_is_better);
              const isHovered = hoverProv === provincia;
              return (
                <path
                  key={provincia}
                  d={path}
                  fill={fill}
                  stroke={isHovered ? "var(--color-primary)" : "var(--color-card)"}
                  strokeWidth={isHovered ? 2.5 : 0.8}
                  style={{
                    cursor: "pointer",
                    transition: "stroke 0.15s, stroke-width 0.15s",
                  }}
                  onMouseEnter={() => setHoverProv(provincia)}
                  onClick={() => router.push(`/provincia/${toSlug(provincia)}`)}
                  onMouseLeave={() => setHoverProv(null)}
                >
                  <title>
                    {provincia}: {value !== null ? fmtValue(value, indicatorMeta.unit) : "—"}
                  </title>
                </path>
              );
            })}

            {/* Tooltip dentro del SVG si hay hover */}
            {hoverProv && (() => {
              const value = dataMap.get(hoverProv) ?? null;
              return (
                <g>
                  <rect
                    x={W - 280}
                    y={20}
                    width={260}
                    height={70}
                    rx={8}
                    fill="var(--color-card)"
                    stroke="var(--color-border)"
                    strokeWidth={1.5}
                  />
                  <text
                    x={W - 268}
                    y={50}
                    fontSize="22"
                    fontWeight="700"
                    fill="var(--color-text)"
                    style={{ fontFamily: "var(--font-sans, system-ui)" }}
                  >
                    {hoverProv}
                  </text>
                  <text
                    x={W - 268}
                    y={78}
                    fontSize="18"
                    fontWeight="600"
                    fill="var(--color-primary)"
                    style={{ fontFamily: "var(--font-sans, system-ui)" }}
                  >
                    {value !== null ? fmtValue(value, indicatorMeta.unit) : "—"}
                  </text>
                </g>
              );
            })()}
          </svg>

          {/* Escala de color */}
          <div
            className="px-4 py-3 border-t flex items-center justify-between text-xs"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-muted)",
            }}
          >
            <span>{fmtValue(min, indicatorMeta.unit)}</span>
            <div
              className="h-2 flex-1 mx-3 rounded"
              style={{
                background: indicatorMeta.higher_is_better
                  ? "linear-gradient(to right, oklch(0.92 0.04 150), oklch(0.52 0.2 150))"
                  : "linear-gradient(to right, oklch(0.92 0.04 38), oklch(0.52 0.2 38))",
              }}
            />
            <span>{fmtValue(max, indicatorMeta.unit)}</span>
          </div>
        </div>

        {/* Ranking */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{
            background: "var(--color-card)",
            borderColor: "var(--color-border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="px-4 pt-3 pb-2 border-b" style={{ borderColor: "var(--color-border)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              Ranking
            </h3>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {ranking.map((row) => {
              const isHovered = hoverProv === row.provincia;
              return (
                <div
                  key={row.provincia}
                  className="flex items-center justify-between px-3 py-1.5 text-xs"
                  style={{
                    background: isHovered
                      ? "var(--color-primary-soft)"
                      : "transparent",
                    borderBottom: "1px solid var(--color-border)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={() => setHoverProv(row.provincia)}
                  onMouseLeave={() => setHoverProv(null)}
                  onClick={() => router.push(`/provincia/${toSlug(row.provincia)}`)}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="tabular-nums w-5 text-right"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {row.rank}
                    </span>
                    <span
                      style={{
                        color: "var(--color-text)",
                        fontWeight: isHovered ? 600 : 400,
                      }}
                    >
                      {row.provincia}
                    </span>
                  </span>
                  <span
                    className="tabular-nums font-medium"
                    style={{ color: "var(--color-text)" }}
                  >
                    {fmtValue(row.value, indicatorMeta.unit)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
        <strong>Fuente:</strong> {indicatorMeta.source}. Pasale el mouse o tocá una
        provincia para ver el valor exacto. El ranking lateral se ordena de
        mejor a peor según el indicador (verde = más, terracotta = menos cuando
        más significa peor).
      </p>
    </div>
  );
}
