# Security model & runbook

## Modelo de amenaza (qué protegemos y de qué)

**Lo que el sitio expone:**
- Datos económicos públicos argentinos (todos ya publicados por INDEC/BCRA).
- Código fuente (repo público).
- API GET-only sin auth.

**Lo que NO tiene:**
- Datos personales de usuarios.
- Login / sesiones.
- Pagos.
- Recursos privados detrás de auth.

**Conclusión**: la superficie de ataque es chica. Los riesgos reales son:
1. **Disponibilidad** — DoS, caída de jsdelivr/GitHub raw, build con datos corruptos.
2. **Integridad de la data** — supply chain (npm packages, GitHub Actions third-party, CDN comprometida).
3. **Headers de seguridad** del navegador (clickjacking, MIME sniffing, etc.) — afecta SEO y trust marker en Chrome.
4. **Secrets accidentales** committeados al repo público.

## Defensas implementadas (status actual)

| # | Control | Estado |
|---|---------|--------|
| 1 | Security Headers (HSTS, CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Frame-Options) en `next.config.ts` | ✅ |
| 2 | CSP restrictiva (default-src 'self', frame-ancestors 'none') | ✅ |
| 3 | Cache-Control en `/api/*` con `s-maxage=3600 swr=86400` (mitiga DoS común) | ✅ |
| 4 | CORS explícito en `/api/*` (`Access-Control-Allow-Origin: *` para uso público read-only) | ✅ |
| 5 | jsdelivr CDN primary + `raw.githubusercontent.com` fallback con timeout 4s | ✅ |
| 6 | GitHub Actions pineadas a SHA específicos (mitigación tj-actions / publisher compromise) | ✅ |
| 7 | Workflow `security.yml` con GitLeaks + npm audit + CodeQL (JS + Python), corre en push/PR/semanal | ✅ |
| 8 | Dependabot config (`.github/dependabot.yml`) para Actions, npm y pip — PRs semanales | ✅ |
| 9 | `ci.yml` usa `pull_request` (no `pull_request_target`) — inmune a pwn-request | ✅ |
| 10 | `permissions:` declarado explícito por workflow (least privilege) | ✅ |
| 11 | Whitelist en `/api/series?name=X` contra valores arbitrarios | ✅ |
| 12 | Sin secrets en código (validado con grep + GitLeaks en CI) | ✅ |
| 13 | Push del ETL a `main` protegido vía fine-grained PAT `ETL_PUSH_TOKEN` (scope: solo este repo, Contents RW). El bot bypassa "require PR" por `enforce_admins=false`. Repos personales no admiten bypass por app. | ✅ |

## Acciones manuales pendientes (UI de plataformas)

Estas requieren clicks en dashboards, no se pueden automatizar desde el repo.

### ⏰ Rotación del PAT del ETL — antes de ~2026-08-30
- [ ] El fine-grained PAT `ETL_PUSH_TOKEN` (creado 2026-06-01, exp. 90 días) vence **~2026-08-30**. Si expira, `etl-daily` y `etl-fx` vuelven a fallar en el push a `main` (`GH006`).
  - Regenerar en https://github.com/settings/personal-access-tokens (mismo scope: repo `estadisticas-argentinas`, Contents: Read and write).
  - Recargar: `gh secret set ETL_PUSH_TOKEN --repo DiLoretoT/estadisticas-argentinas`.

### En GitHub → Settings → Code security
- [ ] **Secret scanning**: activar (free para repos públicos).
- [ ] **Push protection**: activar (bloquea push de secrets conocidos antes de aterrizar).
- [ ] **Code scanning (CodeQL)**: activar el workflow auto-managed o usar el `security.yml` que ya está en el repo.
- [ ] **Dependabot alerts**: confirmar habilitado (default en públicos).
- [ ] **Dependabot security updates**: activar (PR auto cuando hay vuln).

### En Cloudflare → DNS de datalogia.app
- [ ] **Activar proxy** del CNAME `estadisticas` (nube naranja).
  - Pros: DDoS L3/L4/L7, oculta IP de Vercel, WAF custom rules, bot fight mode básico — todo gratis.
  - Cons mínimos: 1 hop extra (~ms).
  - Recomendado.

### En Vercel → Project Settings
- [ ] **Settings → Usage → Spending Limit**: setear un hard cap mensual (ej. USD 30) para evitar facturas sorpresa.
- [ ] **Settings → Security → Attack Challenge Mode** (Pro): mantener apagado salvo bajo ataque.
- [ ] **Settings → Deployment Protection → Vercel Authentication for Preview Deployments**: opcional, evita que previews se indexen/usen.

### Opcional: Sentry
- [ ] Crear proyecto free tier (5k events/mes) y conectar via `@sentry/nextjs`. Detecta errores 500 en `/api/*` que podrían indicar ataques o bugs.

## Runbook — qué hacer si...

### El sitio devuelve "Sin datos" en todos los KPIs
1. Chequear `/status`. Si esa página también está vacía → tanto jsdelivr como GitHub raw están caídos (improbable).
2. Verificar status de jsdelivr: https://www.jsdelivrstatus.com/
3. Verificar status de GitHub: https://www.githubstatus.com/
4. Si ambos OK, problema es del cache de Vercel. Forzar revalidación: trigger un deploy manual con cualquier commit cosmético.

### jsdelivr cae durante horas
- El fallback automático ya apunta a `raw.githubusercontent.com`. No requiere intervención.
- Si GitHub raw también cae, considerar: (a) cambiar `next.config.ts` para self-host data desde `/public/data/`, (b) commit + redeploy.

### Vercel Spending Limit alcanzado
- El sitio queda offline hasta el próximo mes o hasta que se levante el límite.
- Subir el límite o investigar el origen del tráfico:
  - Vercel → Analytics → Top paths / sources.
  - Si es DDoS, activar Cloudflare proxy y reglas WAF.

### Aparece una vulnerability en Dependabot
1. Leer la advisory (link en el PR de Dependabot).
2. Si afecta runtime, mergear el PR o bumpear manual.
3. Si afecta solo devDependencies (tests, build), prioridad baja — mergear cuando se pueda.

### Un secret se filtró en un commit
- **NO** revertir con `git revert` (queda en historia).
- Pasos:
  1. Rotar el secret en el servicio origen INMEDIATAMENTE (cualquier secret en repo público se considera comprometido al instante).
  2. Para borrar de historia: `git filter-repo --invert-paths --path <archivo>` + force-push. Requiere coordinar.
  3. GitHub Push Protection idealmente lo previene de antemano.

### Workflow ETL falla silencioso (data desactualizada)
- `/status` muestra qué series están con error.
- Logs del run: GitHub → Actions → ETL diario → último run.
- Si una fuente cambió de schema (caso real: BCRA cambió la respuesta), arreglar el parser y desplegar.

## Auditorías recurrentes

- **Mensual**: revisar Dependabot PRs y mergear las que aplican.
- **Trimestral**: pegar la URL del sitio en https://securityheaders.com/ y https://observatory.mozilla.org/ — confirmar score A+.
- **Trimestral**: rotar el PAT `ETL_PUSH_TOKEN` (vence cada 90 días — próximo: ~2026-08-30; ver "Acciones manuales pendientes").

## Referencias

- [OWASP Top 10 2025](https://owasp.org/Top10/2025/)
- [OWASP HTTP Headers Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html)
- [Next.js Content Security Policy](https://nextjs.org/docs/app/guides/content-security-policy)
- [GitHub Actions security hardening](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [Cloudflare DDoS protection](https://developers.cloudflare.com/ddos-protection/)
