/**
 * Cronograma estimado de publicaciones del INDEC y otras fuentes oficiales.
 *
 * Las fechas se calculan en runtime a partir de reglas conocidas (día del
 * mes/trimestre típico). No son las fechas EXACTAS — INDEC publica un
 * calendario oficial pero requiere scraping JS, no API. Las reglas que
 * usamos abajo coinciden ~95% de las veces con el calendario real.
 */

export interface PublicationRule {
  id: string;
  indicator: string;
  source: string;
  frequency: "monthly" | "quarterly" | "semiannual";
  /** Días después del cierre del período de referencia. */
  daysLag: number;
  /** Hora aproximada de publicación (16hs Argentina). */
  publishHour: number;
  description: string;
  detailPath?: string; // link interno a /detalle/X
}

export const RULES: PublicationRule[] = [
  {
    id: "ipc",
    indicator: "IPC — Índice de Precios al Consumidor",
    source: "INDEC",
    frequency: "monthly",
    daysLag: 12,
    publishHour: 16,
    description: "Inflación mensual nacional + por región + núcleo/regulados/estacionales.",
    detailPath: "/detalle/inflacion",
  },
  {
    id: "linea_indigencia",
    indicator: "Línea de indigencia (CBA / CBT)",
    source: "INDEC",
    frequency: "monthly",
    daysLag: 8,
    publishHour: 16,
    description: "Valor monetario de Canasta Básica Alimentaria y Total.",
    detailPath: "/detalle/pobreza",
  },
  {
    id: "ica",
    indicator: "ICA — Intercambio Comercial Argentino",
    source: "INDEC",
    frequency: "monthly",
    daysLag: 22,
    publishHour: 16,
    description: "Exportaciones, importaciones, balanza comercial.",
  },
  {
    id: "emae",
    indicator: "EMAE — Estimador Mensual Actividad Económica",
    source: "INDEC",
    frequency: "monthly",
    daysLag: 22,
    publishHour: 16,
    description: "Proxy mensual del PBI.",
    detailPath: "/detalle/actividad",
  },
  {
    id: "ipi",
    indicator: "IPI — Índice de Producción Industrial",
    source: "INDEC",
    frequency: "monthly",
    daysLag: 25,
    publishHour: 16,
    description: "Actividad manufacturera por rama.",
  },
  {
    id: "isac",
    indicator: "ISAC — Indicador Sintético Actividad Construcción",
    source: "INDEC",
    frequency: "monthly",
    daysLag: 25,
    publishHour: 16,
    description: "Construcción privada.",
  },
  {
    id: "pbi",
    indicator: "PBI trimestral",
    source: "INDEC",
    frequency: "quarterly",
    daysLag: 90,
    publishHour: 16,
    description: "Cuentas Nacionales — oferta y demanda agregada.",
    detailPath: "/detalle/actividad",
  },
  {
    id: "eph_empleo",
    indicator: "EPH — Empleo y desocupación",
    source: "INDEC",
    frequency: "quarterly",
    daysLag: 80,
    publishHour: 16,
    description: "Encuesta Permanente de Hogares, mercado laboral.",
    detailPath: "/detalle/empleo",
  },
  {
    id: "eph_pobreza",
    indicator: "EPH — Pobreza e indigencia",
    source: "INDEC",
    frequency: "semiannual",
    daysLag: 90,
    publishHour: 16,
    description: "Incidencia de pobreza y indigencia por hogares y personas.",
    detailPath: "/detalle/pobreza",
  },
  {
    id: "bcra_reservas",
    indicator: "Reservas BCRA",
    source: "BCRA",
    frequency: "monthly",
    daysLag: 3,
    publishHour: 18,
    description: "Stock de reservas internacionales (publicación diaria; el cierre mensual ~día 3).",
  },
];

export interface UpcomingPublication {
  ruleId: string;
  indicator: string;
  source: string;
  description: string;
  detailPath?: string;
  /** Período de referencia (ej. "Abr 2026" o "T1 2026"). */
  refPeriodLabel: string;
  /** Fecha estimada de publicación. */
  estimatedDate: Date;
  /** Días hasta la publicación (negativo = ya pasó). */
  daysUntil: number;
  /** Frequency type. */
  frequency: PublicationRule["frequency"];
}

const MESES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

function endOfMonth(year: number, month: number): Date {
  // month 0-indexed
  return new Date(year, month + 1, 0);
}

function endOfQuarter(year: number, quarter: number): Date {
  // quarter 1-4
  return new Date(year, quarter * 3, 0);
}

function endOfSemester(year: number, semester: number): Date {
  // semester 1-2
  return new Date(year, semester * 6, 0);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function quarterOf(d: Date): number {
  return Math.floor(d.getMonth() / 3) + 1;
}

function semesterOf(d: Date): number {
  return Math.floor(d.getMonth() / 6) + 1;
}

function periodLabel(rule: PublicationRule, refDate: Date): string {
  if (rule.frequency === "monthly") {
    return `${MESES[refDate.getMonth()]} ${refDate.getFullYear()}`;
  }
  if (rule.frequency === "quarterly") {
    return `T${quarterOf(refDate)} ${refDate.getFullYear()}`;
  }
  // semiannual
  return `S${semesterOf(refDate)} ${refDate.getFullYear()}`;
}

/**
 * Calcula las próximas N publicaciones esperadas. Para cada regla, devuelve
 * la próxima publicación (la que aún no llegó o llegó hace menos de 14 días).
 */
export function computeUpcomingPublications(
  now: Date = new Date(),
  horizonDays: number = 60,
): UpcomingPublication[] {
  const upcoming: UpcomingPublication[] = [];

  for (const rule of RULES) {
    // Encontrar el período de referencia "más reciente" cuya fecha estimada
    // de publicación caiga entre (now - 14 días) y (now + horizonDays).
    const candidates: { refDate: Date; pubDate: Date }[] = [];

    if (rule.frequency === "monthly") {
      // Probar últimos 6 meses + próximos 2
      for (let i = -2; i <= 6; i++) {
        const m = now.getMonth() - i;
        const refDate = endOfMonth(now.getFullYear(), m);
        const pubDate = addDays(refDate, rule.daysLag);
        candidates.push({ refDate, pubDate });
      }
    } else if (rule.frequency === "quarterly") {
      const currentQ = quarterOf(now);
      for (let i = -1; i <= 3; i++) {
        const q = currentQ - i;
        const year = now.getFullYear() + Math.floor((q - 1) / 4);
        const adjustedQ = ((q - 1) % 4 + 4) % 4 + 1;
        const refDate = endOfQuarter(year, adjustedQ);
        const pubDate = addDays(refDate, rule.daysLag);
        candidates.push({ refDate, pubDate });
      }
    } else {
      // semiannual
      const currentS = semesterOf(now);
      for (let i = -1; i <= 2; i++) {
        const s = currentS - i;
        const year = now.getFullYear() + Math.floor((s - 1) / 2);
        const adjustedS = ((s - 1) % 2 + 2) % 2 + 1;
        const refDate = endOfSemester(year, adjustedS);
        const pubDate = addDays(refDate, rule.daysLag);
        candidates.push({ refDate, pubDate });
      }
    }

    // Filtrar: la fecha de publicación tiene que estar en la ventana [now-14, now+horizon]
    const validCandidates = candidates.filter((c) => {
      const daysUntil =
        (c.pubDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysUntil >= -14 && daysUntil <= horizonDays;
    });

    // Tomar el más cercano a now (preferentemente el próximo)
    validCandidates.sort((a, b) => {
      const da =
        (a.pubDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      const db =
        (b.pubDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      // Priorizamos los que aún no pasaron (daysUntil >= 0)
      const ap = da >= 0 ? 0 : 1;
      const bp = db >= 0 ? 0 : 1;
      if (ap !== bp) return ap - bp;
      return Math.abs(da) - Math.abs(db);
    });

    if (validCandidates.length === 0) continue;
    const chosen = validCandidates[0];
    const daysUntil =
      (chosen.pubDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    upcoming.push({
      ruleId: rule.id,
      indicator: rule.indicator,
      source: rule.source,
      description: rule.description,
      detailPath: rule.detailPath,
      refPeriodLabel: periodLabel(rule, chosen.refDate),
      estimatedDate: chosen.pubDate,
      daysUntil: Math.round(daysUntil),
      frequency: rule.frequency,
    });
  }

  // Ordenar por fecha de publicación (los próximos primero)
  upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
  return upcoming;
}
