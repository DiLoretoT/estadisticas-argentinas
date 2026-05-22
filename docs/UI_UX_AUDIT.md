# UI/UX Audit — 2026-05-22

Recorrido completo del sitio con Playwright (desktop 1440x900 + mobile 375x812).
Screenshots: `test-results/ui-audit/{desktop,mobile}/<page>.png`.

## Pages auditadas

| Page | Desktop | Mobile | Console errors |
|---|---|---|---|
| `/` | ✅ | ✅ Muy larga | — |
| `/explorar` | ✅ | ✅ | — |
| `/analisis` | ✅ | ✅ | — |
| `/comparativa` | ✅ | ✅ | — |
| `/mapa` | ⚠️ Hydration #418 | ⚠️ | React #418 |
| `/provincia/[slug]` (3 ejemplos) | ✅ | ✅ | — |
| `/calendario` | ✅ | ✅ | — |
| `/calculadora` | ✅ | ✅ | — |
| `/metodologia` | ✅ | ✅ | — |
| `/status` | ✅ | ✅ | — |
| `/detalle/*` (3 ejemplos) | ✅ | ✅ | — |

## 🔴 Críticos (bug o UX rota)

### 1. React hydration error #418 en /mapa — FIXED este commit
GeoJSON 1.7 MB + `useRouter` en componente client causaban mismatch SSR↔CSR.
Solución: `ArgentinaMapLazy.tsx` con `dynamic(ssr:false)`. Skeleton placeholder
para evitar layout shift.

### 2. Comparativa LATAM: outlier de inflación aplasta el resto — FIXED este commit
Argentina con 213% inflación hacía que el resto (3-5%) se viera como barras
mínimas indistinguibles. Solución: si el valor top es >3× el segundo, escalar
contra el segundo y marcar la barra "clippeada" con un borde derecho.

### 3. Perfil provincia: "Datos básicos" demasiado pobre — FIXED este commit
Solo tenía Superficie y Densidad. Agregados: IDH renombrado, Exportaciones,
% del país (población), Principal rubro de exportaciones.

## 🟠 Importantes (mejora UX significativa)

### 4. Home mobile es muy larga
~16.000 px de scroll. 10+ secciones temáticas, todas con cards similares
visualmente. Falta jerarquía o navegación interna.

**Propuesta**:
- TOC fijo arriba o sidebar derecho con anchors a secciones.
- O un selector "Saltar a..." al principio.
- O un "Resumen del día" arriba con los 5 indicadores más importantes
  destacados, y debajo las secciones temáticas.

### 5. Análisis cruzado: algunos coeficientes confunden
Por ejemplo, "Dólar vs Inflación" da Pearson 0.38 (débil) cuando intuitivamente
debería ser fuerte. Causa: la relación NO es lineal — la devaluación es
exponencial (16x desde 2015) mientras la inflación es % mensual (10x volatilidad).

**Propuesta**: En las cards de comparativas, cuando el coef recomendado no sea
Pearson, mostrar el ejemplo del por qué. Ej. "Spearman (rangos) > Pearson para
esta serie porque la devaluación es no lineal."

Esto ya está implementado en la pre-curada (donde elegimos el coef correcto
por par). Pero el "análisis libre" siempre usa Pearson — debería ofrecer
toggle entre Pearson / Spearman / Kendall.

### 6. Cards de KPI mucha redundancia en home
Los 7 dólares (oficial, MEP, CCL, blue, cripto, tarjeta, mayorista) se ven todos
casi iguales — solo cambia el número. ¿Se puede reducir a 4 cards principales
(oficial, MEP, blue, brecha) y el resto en un toggle "ver todos"?

### 7. Hero del home: el texto explica todo, no hay un "hook" visual
La pantalla inicial debería tener algo más impactante: ej. "Hoy: USD oficial $X
(↑Y% mensual)", "Inflación última: Z%". Un dashboard tipo cockpit en vez de un
título grande.

## 🟡 Mejorables (UX incremental)

### 8. La navbar tiene "Comparativa" pero no es claro a qué se refiere
"Comparativa LATAM" sería más descriptivo. Ya está como tooltip pero el label
principal podría ser más específico.

### 9. Falta atajo "Volver arriba" en páginas largas
Especialmente home y `/provincia/[slug]`.

### 10. Charts: ejes a veces se solapan en mobile
Cuando el viewport es 375px, los labels Y del MultiCurrencyChart se cortan o
solapan con la línea de la serie.

### 11. Tipografía: cards con tipos de fuente inconsistentes
Algunos números en tabular, otros en proporcional. Falta consistencia.

### 12. Algunos KPI no tienen sparkline
`empleo` y `pobreza` en algunas KPI cards tienen sparkline, otros no. Verificar
consistencia.

## 🟢 Textos (consistencia y claridad)

### 13. Tono mezclado: técnico vs casual
Algunas descripciones de chart usan "FOB", "BIFF", "MOA" sin explicar.
Otras son muy casuales. Definir glosario y revisar.

### 14. "actualizados automáticamente" — FIXED previamente
Removido del Hero y Footer (sesión anterior).

### 15. Labels de KPI cards muy técnicos
"M2 priv. (YoY)" → "M2 privado interanual" (más legible).
"BADLAR" → "BADLAR — tasa entre bancos privados" o solo el contexto.

## 🔵 Accesibilidad

### 16. Falta alt text en imágenes del Hero
El logo "datalogia-isotipo.png" tiene alt="Datalogía" ✅. Verificar OG image.

### 17. Contraste de algunos colores
- `var(--color-text-muted)` sobre `var(--color-bg)` en dark mode podría
  estar bajo del ratio 4.5:1.
- Color de éxito (verde) en barras de Argentina destacada — verificar.

### 18. Falta `aria-label` en algunos botones icon-only
El toggle de tema en navbar tiene aria-label ✅. Hamburger mobile también ✅.
Verificar botones de Compartir, Descargar CSV.

### 19. Tab order en /explorar
Verificar que con Tab se pueda navegar por los selectores en orden lógico.

## Próximos pasos sugeridos

Orden de prioridad para próximas sesiones:

1. **Mobile UX home** (#4): TOC o quick-nav arriba para reducir el scroll.
2. **Análisis libre con toggle Pearson/Spearman/Kendall** (#5).
3. **Hero como cockpit** (#7): convertir el hero estático en mini-dashboard
   con los 5-6 KPIs principales del día.
4. **Glosario / explicaciones de términos técnicos** (#13).
5. **Botón "volver arriba"** en páginas largas (#9).
6. Auditoría de contraste a11y con axe-core (#17).
