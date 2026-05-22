"""Script único para agregar description + source a cada <AreaChart> en HomeClient.tsx.

Identifica cada chart por su prop `label` y le agrega las props
`description` y `source` con los textos correspondientes.

Idempotente: si el chart ya tiene description o source, no hace nada.
"""

from __future__ import annotations

import re
from pathlib import Path

CHARTS: dict[str, tuple[str, str]] = {
    "Dólar oficial (cierre mensual)": (
        "Cotización oficial del USD informada por el BCRA, valor de cierre del último día hábil del mes.",
        "BCRA — Cotizaciones",
    ),
    "Dólar blue (cierre mensual)": (
        "Cotización del dólar paralelo o 'blue' en el mercado informal de la Ciudad de Buenos Aires.",
        "ArgentinaDatos / Ámbito",
    ),
    "IPC — variación mensual (%)": (
        "Variación del Índice de Precios al Consumidor respecto al mes anterior. Mide la inflación 'punta a punta' del mes.",
        "INDEC",
    ),
    "RIPTE — variación mensual (%)": (
        "Remuneración Imponible Promedio de Trabajadores Estables. Variación nominal del salario promedio del trabajo registrado.",
        "MTEySS / SIPA",
    ),
    "EMAE — índice mensual base 2004=100": (
        "Estimador Mensual de Actividad Económica. Proxy mensual del PBI, captura la actividad de todos los sectores.",
        "INDEC",
    ),
    "PBI trimestral (mill. $ constantes)": (
        "Producto Bruto Interno a precios constantes (volumen físico), sin efecto inflacionario.",
        "INDEC — Cuentas Nacionales",
    ),
    "Tasa de desocupación (%)": (
        "Porcentaje de la población económicamente activa que busca trabajo y no lo encuentra. Encuesta de hogares urbanos.",
        "INDEC — EPH",
    ),
    "Salario real (RIPTE / IPC, base 100)": (
        "Poder adquisitivo del salario nominal después de descontar la inflación. Base 100 en el primer mes disponible.",
        "Cálculo propio sobre RIPTE (MTEySS) y IPC (INDEC)",
    ),
    "Riesgo país EMBI (puntos básicos)": (
        "Sobretasa que pagan los bonos soberanos argentinos por encima del Tesoro de EE.UU. Mide la percepción de riesgo de default.",
        "ArgentinaDatos / Ámbito",
    ),
    "S&P Merval (ARS, cierre mensual)": (
        "Índice principal de la Bolsa de Comercio de Buenos Aires. Captura las acciones argentinas más líquidas.",
        "Yahoo Finance",
    ),
    "Reservas internacionales BCRA (USD millones)": (
        "Stock de reservas internacionales del Banco Central. Incluye oro, divisas y DEGs del FMI.",
        "BCRA",
    ),
    "Tasa de política monetaria (% anual)": (
        "Tasa de referencia que fija el BCRA en sus operaciones de mercado abierto. Define el costo del dinero en pesos.",
        "BCRA",
    ),
    "Exportaciones totales (USD millones, mensual)": (
        "Valor FOB (Free On Board) de las exportaciones de bienes. Suma de productos primarios, MOA, MOI y combustibles.",
        "INDEC — ICA (Intercambio Comercial Argentino)",
    ),
    "Balanza comercial (USD millones)": (
        "Diferencia entre exportaciones e importaciones de bienes. Positiva = superávit; negativa = déficit comercial.",
        "INDEC — ICA",
    ),
    "Deuda Pública Bruta Total (USD millones, anual)": (
        "Stock total de la Deuda Pública Bruta del Sector Público Nacional al cierre de cada año, expresada en dólares al tipo de cambio de cierre.",
        "MECON — Secretaría de Finanzas",
    ),
    "Deuda con Organismos Internacionales — FMI/BIRF/BID (USD M)": (
        "Subcomponente de la deuda con multilaterales (FMI, Banco Mundial, BID). Los saltos en 2018 y 2025 corresponden a acuerdos con el FMI.",
        "MECON — Secretaría de Finanzas",
    ),
    "Tasa de pobreza (%)": (
        "Porcentaje de personas bajo la línea de pobreza (ingresos < Canasta Básica Total). Medición semestral por aglomerado urbano.",
        "INDEC — EPH",
    ),
    "Línea de indigencia ($ por adulto/mes)": (
        "Valor monetario de la Canasta Básica Alimentaria por adulto equivalente. Define el umbral de indigencia.",
        "INDEC — CBA/CBT",
    ),
}


def add_props_to_chart(content: str, label: str, description: str, source: str) -> str:
    """Encuentra el <AreaChart ... label="X" ... /> y le agrega description + source si no las tiene."""
    # Buscar el bloque completo del componente <AreaChart ... />
    # Patrón: <AreaChart  [no permite < y >]  label="<label>"  [resto]  />
    # Construyo el patrón con escape del label
    escaped = re.escape(label)
    pattern = re.compile(
        r'(<AreaChart\b)([^<>]*?label="' + escaped + r'"[^<>]*?)(/>)',
        re.DOTALL,
    )

    def replacer(match: re.Match[str]) -> str:
        opening = match.group(1)
        attrs = match.group(2)
        closing = match.group(3)
        # Skip si ya tiene description o source
        if "description=" in attrs or "source=" in attrs:
            return match.group(0)
        # Agregar antes del cierre
        new_attrs = attrs.rstrip() + f'\n            description="{description}"\n            source="{source}"\n          '
        return f"{opening}{new_attrs}{closing}"

    new_content, n = pattern.subn(replacer, content)
    return new_content, n


def main():
    path = Path(__file__).resolve().parent.parent / "components" / "HomeClient.tsx"
    content = path.read_text(encoding="utf-8")
    total = 0
    for label, (desc, src) in CHARTS.items():
        content, n = add_props_to_chart(content, label, desc, src)
        if n > 0:
            print(f"  + {label}: {n} match")
        total += n
    path.write_text(content, encoding="utf-8")
    print(f"\nTotal substitutions: {total} / {len(CHARTS)} charts")


if __name__ == "__main__":
    main()
