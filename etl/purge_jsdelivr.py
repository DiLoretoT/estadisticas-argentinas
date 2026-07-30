"""
Purga del cache de jsdelivr para los archivos de data/ que acaba de commitear
el ETL.

Por qué existe
--------------
La web lee los JSON desde `cdn.jsdelivr.net/gh/<repo>@main/data/...`. Los URLs
pinneados a una rama (en vez de a un tag o un commit) los cachea jsdelivr con
`s-maxage=43200`: **12 horas**. Como el ETL publica cada 30 min / 2 hs, el CDN
termina sirviendo archivos de la jornada anterior y el front los descarta por no
ser del día — el caso concreto: el log intradía se veía siempre con una sola
fila.

Purgar después de cada push alinea el cache con el repo sin perder el CDN.

Uso
---
    git diff --name-only HEAD~1 HEAD -- data/ | python etl/purge_jsdelivr.py

Lee rutas relativas al repo por stdin (una por línea) y las purga en lotes.
Es **best-effort**: cualquier fallo se loguea y termina con código 0. Un purge
que no salió no justifica marcar en rojo un ETL que sí publicó los datos.
"""

from __future__ import annotations

import json
import logging
import os
import sys
import urllib.error
import urllib.request

logger = logging.getLogger(__name__)

_PURGE_URL = "https://purge.jsdelivr.net/"
_BATCH_SIZE = 20
_TIMEOUT = 60


def _repo() -> str | None:
    """`owner/repo`, que GitHub Actions expone en GITHUB_REPOSITORY."""
    return os.getenv("GITHUB_REPOSITORY") or None


def build_paths(files: list[str], repo: str) -> list[str]:
    """Rutas del repo → rutas de jsdelivr, deduplicadas y en orden estable."""
    paths: list[str] = []
    seen: set[str] = set()
    for name in files:
        clean = name.strip().replace("\\", "/")
        if not clean:
            continue
        path = f"/gh/{repo}@main/{clean}"
        if path not in seen:
            seen.add(path)
            paths.append(path)
    return paths


def _purge_batch(paths: list[str]) -> None:
    body = json.dumps({"path": paths}).encode("utf-8")
    request = urllib.request.Request(
        _PURGE_URL,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=_TIMEOUT) as response:
        payload = json.loads(response.read().decode("utf-8"))
    logger.info(
        "purge %s → id=%s status=%s",
        len(paths),
        payload.get("id"),
        payload.get("status"),
    )


def purge(files: list[str]) -> int:
    """Purga los archivos indicados. Devuelve cuántos se enviaron."""
    repo = _repo()
    if not repo:
        logger.warning("GITHUB_REPOSITORY no está definido; no se purga nada.")
        return 0

    paths = build_paths(files, repo)
    if not paths:
        logger.info("No hay archivos para purgar.")
        return 0

    sent = 0
    for start in range(0, len(paths), _BATCH_SIZE):
        batch = paths[start : start + _BATCH_SIZE]
        try:
            _purge_batch(batch)
            sent += len(batch)
        except (urllib.error.URLError, TimeoutError, ValueError) as exc:
            logger.warning("Falló el purge de %d archivos: %s", len(batch), exc)

    logger.info("purge solicitado para %d de %d archivos", sent, len(paths))
    return sent


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    purge(sys.stdin.read().splitlines())


if __name__ == "__main__":
    main()
