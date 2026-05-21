#!/bin/bash
# Ignored Build Step para Vercel.
#
# Vercel ejecuta este script antes de cada potencial build.
#   - exit 0 → cancela el build (skip deploy).
#   - exit 1 → procede con el build normal.
#
# Política: si los únicos archivos cambiados desde el commit anterior son
# JSONs bajo data/ (es decir, fueron commits del ETL via GitHub Actions),
# NO redeployar. El frontend lee la data en vivo vía jsdelivr CDN, no
# necesita rebuild para reflejar nuevos datos.
#
# Si cambió cualquier otra cosa (código TS/CSS, package.json, workflows,
# config) → SÍ build.
#
# Referencia: https://vercel.com/docs/projects/git/ignored-build-step

set -e

# Vercel pasa el commit anterior en VERCEL_GIT_PREVIOUS_SHA cuando está
# disponible. Si no, usamos HEAD^.
PREV_SHA="${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}"

# Listado de archivos cambiados desde el commit previo
CHANGED=$(git diff --name-only "$PREV_SHA" HEAD)

if [ -z "$CHANGED" ]; then
  echo "No hay cambios — proceder con build."
  exit 1
fi

# Verificamos si TODOS los cambios son bajo data/
NON_DATA=$(echo "$CHANGED" | grep -v '^data/' || true)

if [ -z "$NON_DATA" ]; then
  echo "Solo cambios en data/. Skipear build."
  echo "$CHANGED"
  exit 0
else
  echo "Cambios fuera de data/. Build necesario."
  echo "$NON_DATA"
  exit 1
fi
