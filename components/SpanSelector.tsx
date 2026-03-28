"use client";

interface Span {
  label: string;
  months: number | null;
}

const DEFAULT_SPANS: Span[] = [
  { label: "1A", months: 12 },
  { label: "5A", months: 60 },
  { label: "10A", months: 120 },
  { label: "Max", months: null },
];

interface SpanSelectorProps {
  spans?: Span[];
  active: string;
  onChange: (label: string) => void;
}

export function SpanSelector({
  spans = DEFAULT_SPANS,
  active,
  onChange,
}: SpanSelectorProps) {
  return (
    <div className="flex gap-1">
      {spans.map((s) => (
        <button
          key={s.label}
          onClick={() => onChange(s.label)}
          className="px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150"
          style={{
            background: active === s.label ? "var(--color-primary)" : "transparent",
            color: active === s.label ? "#fff" : "var(--color-text-muted)",
            border: active === s.label ? "none" : "1px solid var(--color-border)",
          }}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

/** Filter data by span. Returns the last N months of data, or all if months is null. */
export function filterBySpan(
  data: [string, number][],
  spanLabel: string,
  spans: Span[] = DEFAULT_SPANS
): [string, number][] {
  const span = spans.find((s) => s.label === spanLabel);
  if (!span || span.months === null) return data;
  return data.slice(-span.months);
}
