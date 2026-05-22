"use client";

import dynamic from "next/dynamic";
import type { FeatureCollection } from "@/components/ArgentinaMap";

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
  category?: string;
  description?: string;
}

interface Props {
  geojson: FeatureCollection;
  data: ProvinciaStat[];
  indicators: IndicatorMeta[];
  defaultIndicator?: string;
}

/**
 * Wrapper lazy del ArgentinaMap. El mapa es 100% interactivo (click,
 * hover, ranking sincronizado, navegación) — no necesita SSR y de hecho
 * el SSR producía un hydration mismatch (React error #418) por la
 * serialización del GeoJSON grande + useRouter.
 */
function MapSkeleton() {
  return (
    <div
      className="rounded-xl border flex items-center justify-center"
      style={{
        background: "var(--color-card)",
        borderColor: "var(--color-border)",
        aspectRatio: "700/900",
        color: "var(--color-text-muted)",
        fontSize: "0.875rem",
      }}
    >
      Cargando mapa…
    </div>
  );
}

const ArgentinaMapInner = dynamic(
  () => import("@/components/ArgentinaMap").then((m) => m.ArgentinaMap),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <div className="h-6 w-1/3 rounded" style={{ background: "var(--color-bg-alt)" }} />
        <div className="grid md:grid-cols-3 gap-5">
          <div className="md:col-span-2">
            <MapSkeleton />
          </div>
          <div className="h-[700px] rounded-xl border" style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }} />
        </div>
      </div>
    ),
  },
);

export function ArgentinaMapLazy(props: Props) {
  return <ArgentinaMapInner {...props} />;
}
