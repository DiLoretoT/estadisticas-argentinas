/**
 * SiteMark — el ícono del paraguas Datalogía.
 *
 * 3 barras + peak dot con sombra real. fill="currentColor" para theming.
 * El color se controla desde el padre con `color: var(--mark-color)` que
 * apunta a `var(--color-primary)` en light y dark.
 *
 * Mantiene paridad con datalogia-portal/components/site-mark.tsx (v4).
 */
export function SiteMark({
  size = 20,
  className = "",
  "aria-hidden": ariaHidden = true,
}: {
  size?: number;
  className?: string;
  "aria-hidden"?: boolean;
}) {
  const uid = "dl-mark";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      aria-hidden={ariaHidden}
      style={{ filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.16))" }}
    >
      <defs>
        <linearGradient id={`${uid}-bar-shadow`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="black" stopOpacity="0" />
          <stop offset="1" stopColor="black" stopOpacity="0.22" />
        </linearGradient>
        <radialGradient id={`${uid}-dot-shadow`} cx="0.4" cy="0.35" r="0.7">
          <stop offset="0.55" stopColor="black" stopOpacity="0" />
          <stop offset="1" stopColor="black" stopOpacity="0.28" />
        </radialGradient>
      </defs>
      <rect x="14" y="60" width="20" height="34" rx="2" />
      <rect x="38" y="44" width="20" height="50" rx="2" />
      <rect x="62" y="24" width="20" height="70" rx="2" />
      <circle cx="72" cy="12" r="8" />
      <rect x="14" y="60" width="20" height="34" rx="2" fill={`url(#${uid}-bar-shadow)`} />
      <rect x="38" y="44" width="20" height="50" rx="2" fill={`url(#${uid}-bar-shadow)`} />
      <rect x="62" y="24" width="20" height="70" rx="2" fill={`url(#${uid}-bar-shadow)`} />
      <circle cx="72" cy="12" r="8" fill={`url(#${uid}-dot-shadow)`} />
    </svg>
  );
}
