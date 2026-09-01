#!/usr/bin/env bash
#
# Commitea los cambios del ETL a main a traves de un PR efimero.
#
# Por que no un push directo
# --------------------------
# La proteccion de rama de main exige que los cambios entren por un pull
# request ("Changes must be made through a pull request") y exime a los
# administradores. Por eso el PAT del owner podia pushear directo — hasta que
# vencio el 2026-08-30 y dejo los tres ETL caidos, con los datos congelados.
#
# GITHUB_TOKEN no vence, pero no es admin: no puede saltear la regla. Como la
# regla pide 0 aprobaciones, un PR que el propio workflow abre y mergea la
# cumple tal como esta escrita, sin depender de un secret que caduca ni de
# cambiar la configuracion del repo.
#
# La rama remota se borra sola al mergear (delete_branch_on_merge del repo).
#
# Uso:
#   bash .github/scripts/commit-via-pr.sh "<mensaje>" <prefijo-rama> <path>...
#
# Salidas:
#   $GITHUB_OUTPUT -> committed=true|false
#   $RUNNER_TEMP/changed-data-files.txt -> archivos tocados (para el purge)

set -euo pipefail

if [ "$#" -lt 3 ]; then
  echo "uso: $0 <mensaje> <prefijo-rama> <path> [<path>...]" >&2
  exit 2
fi

MSG="$1"
PREFIX="$2"
shift 2

CHANGED_FILE="${RUNNER_TEMP:-/tmp}/changed-data-files.txt"
: > "$CHANGED_FILE"

if git diff --quiet --exit-code -- "$@"; then
  echo "Sin cambios en: $*. No hay nada que commitear."
  echo "committed=false" >> "$GITHUB_OUTPUT"
  exit 0
fi

# Guardamos la lista ANTES de commitear. El paso de purge no puede deducirla
# despues con `git diff HEAD~1 HEAD`, porque tras el merge el checkout local
# no refleja el squash que quedo en main.
git diff --name-only -- "$@" > "$CHANGED_FILE"
echo "Archivos con cambios:"
cat "$CHANGED_FILE"

BRANCH="${PREFIX}-${GITHUB_RUN_ID}"
pushed=0

cleanup() {
  # Si falla despues de pushear, no dejamos la rama colgada en el remoto.
  if [ "$pushed" -eq 1 ]; then
    echo "Limpiando rama $BRANCH tras el fallo."
    git push origin --delete "$BRANCH" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

git switch -c "$BRANCH"
git add -- "$@"
git commit -m "$MSG"
git push origin "$BRANCH"
pushed=1

gh pr create \
  --base main \
  --head "$BRANCH" \
  --title "$MSG" \
  --body "PR automatico del ETL: la proteccion de main exige que los cambios entren por PR, asi que el workflow lo abre y lo mergea. Solo toca archivos de datos."

# GitHub tarda un momento en calcular la mergeabilidad de un PR recien creado,
# asi que el primer intento puede rebotar sin que haya nada mal.
for attempt in 1 2 3 4 5; do
  if gh pr merge "$BRANCH" --squash; then
    pushed=0
    echo "committed=true" >> "$GITHUB_OUTPUT"
    exit 0
  fi
  echo "El PR todavia no es mergeable (intento $attempt/5). Reintento en 10s."
  sleep 10
done

echo "No se pudo mergear el PR de $BRANCH." >&2
exit 1
