/**
 * SiteMark — el ícono del paraguas Datalogía.
 *
 * 3 barras + peak dot con sombra real. fill="currentColor" para theming.
 * El color se controla desde el padre con `color: var(--mark-color)` que
 * apunta a `var(--color-primary)` en light y dark.
 *
 * v5: glifo achatado y centrado dentro del viewBox (tinta en y[19,81], centro
 * 50,50) con el punto pegado a las barras. Así, renderizado con `items-center`
 * junto al wordmark, la marca queda dentro de la banda de mayúsculas del texto
 * (no sobresale arriba/abajo) sin necesidad de alinear a la baseline.
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
      <rect x="16" y="57" width="20" height="24" rx="2.5" />
      <rect x="40" y="47" width="20" height="34" rx="2.5" />
      <rect x="64" y="35" width="20" height="46" rx="2.5" />
      <circle cx="74" cy="27" r="8" />
      <rect x="16" y="57" width="20" height="24" rx="2.5" fill={`url(#${uid}-bar-shadow)`} />
      <rect x="40" y="47" width="20" height="34" rx="2.5" fill={`url(#${uid}-bar-shadow)`} />
      <rect x="64" y="35" width="20" height="46" rx="2.5" fill={`url(#${uid}-bar-shadow)`} />
      <circle cx="74" cy="27" r="8" fill={`url(#${uid}-dot-shadow)`} />
    </svg>
  );
}
