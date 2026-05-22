"""Inserta <AnalysisPanel /> dentro de cada sección apropiada del HomeClient.

Estrategia: para cada (sectionId, seriesField, noun, format), busca
`id="{sectionId}"` y encuentra el siguiente `</section>` siguiendo el
balance de tags. Inserta el AnalysisPanel JUSTO antes del cierre.
"""

from __future__ import annotations

import re
from pathlib import Path

# (sectionId, seriesField, noun, format, goodDirection)
TARGETS = [
    ("monedas", "dolarOficial", "el dólar oficial", "currency_ars", "neutral"),
    ("precios", "inflacion", "la inflación mensual", "percent", "down"),
    ("actividad", "emae", "la actividad económica", "index", "up"),
    ("empleo", "desocupacion", "la tasa de desocupación", "percent", "down"),
    ("mercado", "riesgoPais", "el riesgo país", "basis_points", "down"),
    ("monetario", "reservas", "las reservas del BCRA", "currency_usd", "up"),
    ("comercio", "balanzaComercial", "la balanza comercial", "currency_usd", "up"),
    ("deuda", "deudaTotal", "la deuda pública total", "currency_usd", "down"),
    ("social", "pobreza", "la tasa de pobreza", "percent", "down"),
]


def find_section_close(content: str, start_idx: int) -> int:
    """Devuelve la posición del </section> que cierra la sección abierta en start_idx."""
    depth = 1
    pos = start_idx
    while depth > 0 and pos < len(content):
        next_open = content.find("<section", pos)
        next_close = content.find("</section>", pos)
        if next_close == -1:
            return -1
        if next_open != -1 and next_open < next_close:
            depth += 1
            pos = next_open + 1
        else:
            depth -= 1
            pos = next_close + 1
            if depth == 0:
                return next_close
    return -1


def main():
    path = Path(__file__).resolve().parent.parent / "components" / "HomeClient.tsx"
    content = path.read_text(encoding="utf-8")

    inserted = 0
    skipped = 0

    # Procesamos en orden inverso para no romper los offsets
    insertions = []  # (close_pos, snippet)

    for section_id, series_field, noun, fmt, good in TARGETS:
        marker = f'id="{section_id}"'
        idx = content.find(marker)
        if idx == -1:
            print(f"  ✗ id='{section_id}' no encontrado")
            continue
        # Buscar el cierre </section> correspondiente
        # Empezamos después del marker
        close_pos = find_section_close(content, idx + len(marker))
        if close_pos == -1:
            print(f"  ✗ cierre </section> para id='{section_id}' no encontrado")
            continue
        # Verificar si ya tiene AnalysisPanel en esa sección
        section_body = content[idx:close_pos]
        if "AnalysisPanel" in section_body:
            print(f"  ~ id='{section_id}' ya tiene AnalysisPanel, skip")
            skipped += 1
            continue

        snippet = (
            f"\n        <div className=\"mt-6\">\n"
            f"          <AnalysisPanel\n"
            f"            data={{series.{series_field}}}\n"
            f"            noun=\"{noun}\"\n"
            f"            format=\"{fmt}\"\n"
            f"            goodDirection=\"{good}\"\n"
            f"          />\n"
            f"        </div>\n      "
        )
        insertions.append((close_pos, snippet))

    # Aplicar de atrás hacia adelante
    insertions.sort(key=lambda t: -t[0])
    for pos, snippet in insertions:
        content = content[:pos] + snippet + content[pos:]
        inserted += 1

    path.write_text(content, encoding="utf-8")
    print(f"\nInsertados: {inserted}  Skipped: {skipped}")


if __name__ == "__main__":
    main()
