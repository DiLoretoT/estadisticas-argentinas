# Estadisticas Argentinas

Dashboard de indicadores macroeconomicos y sociales de Argentina con datos oficiales actualizados.

## Inicio rapido

```bash
git clone https://github.com/DiLoretoT/estadisticas-argentinas.git
cd estadisticas-argentinas
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

No necesita Docker, PostgreSQL ni servicios externos. Los datos estan incluidos en el repositorio como archivos JSON.

## Stack

| Capa | Tecnologia |
|------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + TypeScript |
| Estilos | Tailwind CSS 4 + CSS Variables |
| Animaciones | framer-motion |
| Datos | Archivos JSON estaticos (sin DB) |

## Estructura del proyecto

```
estadisticas-argentinas/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Home: hero + KPIs + graficos + scroll
│   ├── layout.tsx                # Layout raiz (navbar, theme, fonts)
│   ├── globals.css               # Design tokens (colores, sombras, dark mode)
│   ├── api/
│   │   ├── indicadores/route.ts  # GET /api/indicadores — resumen JSON
│   │   └── series/route.ts       # GET /api/series?name=X — serie temporal
│   └── detalle/
│       ├── inflacion/            # IPC mensual + serie historica
│       ├── dolar/                # Oficial + blue (diario y mensual)
│       ├── euro/                 # BCRA diario y mensual
│       ├── salarios/             # RIPTE nivel y variacion
│       ├── actividad/            # EMAE + PBI
│       ├── empleo/               # Desocupacion + empleo (EPH)
│       └── pobreza/              # Pobreza + linea de indigencia
│
├── components/
│   ├── AreaChart.tsx             # Grafico SVG interactivo (hover, tooltip, gradient)
│   ├── KpiCard.tsx               # Tarjeta de indicador con sparkline
│   ├── DataTable.tsx             # Tabla con sticky header y fechas formateadas
│   ├── SpanSelector.tsx          # Selector de rango temporal (1A/5A/10A/Max)
│   ├── DetailPage.tsx            # Layout reutilizable para paginas de detalle
│   ├── Hero.tsx                  # Seccion hero con animaciones
│   ├── HomeClient.tsx            # Orquestador de la home (KPIs + secciones)
│   ├── Navbar.tsx                # Barra de navegacion con glass effect
│   ├── ThemeProvider.tsx         # Dark/light mode con persistencia
│   ├── LinkCard.tsx              # Tarjeta de navegacion con hover lift
│   ├── SectionHeader.tsx         # Encabezado de seccion con fade-in
│   └── Footer.tsx                # Pie de pagina
│
├── lib/
│   ├── formatters.ts             # Formateo de numeros, fechas y porcentajes
│   └── readData.ts               # Lectura de JSON desde disco (server-side)
│
└── data/                         # Datos estaticos (actualizados por ETL externo)
    ├── inflacion.json            # Indicador resumen
    ├── dolar_oficial.json
    ├── dolar_blue.json
    ├── empleo.json
    ├── pobreza.json
    ├── ...
    └── series/                   # Series temporales [[fecha, valor], ...]
        ├── inflacion_mensual.json
        ├── dolar_oficial_diario.json
        ├── dolar_blue_mensual.json
        ├── emae_mensual.json
        ├── pbi_trimestral.json
        ├── tasa_desocupacion.json
        ├── tasa_pobreza.json
        └── ...
```

## Indicadores disponibles

| Indicador | Fuente | Frecuencia | Archivo |
|-----------|--------|------------|---------|
| Inflacion (IPC) | INDEC | Mensual | inflacion_mensual.json |
| Dolar oficial | BCRA | Diario | dolar_oficial_diario.json |
| Dolar blue | argentinadatos.com | Diario | dolar_blue_diario.json |
| Euro | BCRA | Diario | euro_diario.json |
| RIPTE (salarios) | INDEC/SSPM | Mensual | ripte_mensual.json |
| EMAE (actividad) | INDEC/SSPM | Mensual | emae_mensual.json |
| PBI | INDEC | Trimestral | pbi_trimestral.json |
| Desocupacion | INDEC (EPH) | Trimestral | tasa_desocupacion.json |
| Empleo | INDEC (EPH) | Trimestral | tasa_empleo.json |
| Pobreza | INDEC (EPH) | Semestral | tasa_pobreza.json |
| Linea de indigencia | INDEC | Mensual | linea_indigencia.json |

## Formato de datos

### Indicador resumen (`data/*.json`)

```json
{
  "updated_at": "2026-03-28",
  "monthly": { "period": "2026-02", "value": 2.62 },
  "source": { "name": "INDEC", "official": true }
}
```

### Serie temporal (`data/series/*.json`)

Array de tuplas `[fecha_ISO, valor]`:

```json
[
  ["2024-01-01", 0.0254],
  ["2024-02-01", 0.0131],
  ...
]
```

Los valores de porcentaje estan en decimal (0.0254 = 2.54%). El frontend los multiplica por 100 al mostrarlos.

## API

### `GET /api/indicadores`

Devuelve resumen de todos los indicadores principales.

### `GET /api/series?name=<nombre>`

Devuelve una serie temporal. Nombres disponibles: `inflacion_mensual`, `dolar_oficial_diario`, `dolar_blue_mensual`, `pbi_trimestral`, `emae_mensual`, `tasa_desocupacion`, `tasa_pobreza`, etc.

## Dark mode

El tema se persiste en `localStorage`. Se puede cambiar con el boton de la navbar. El sistema respeta `prefers-color-scheme` como default.

## Actualizacion de datos

Los JSON se generan con un pipeline ETL externo (proyecto `estadisticApp` con Python + PostgreSQL). Para actualizar:

1. Correr el ETL en el proyecto fuente
2. Copiar `data/` al repo
3. Commit + push

Los datos se pueden actualizar sin tocar codigo — solo reemplazar los JSON.

## Deploy

```bash
npm run build    # Genera build de produccion
npm start        # Sirve en puerto 3000
```

Compatible con Vercel, Netlify o cualquier hosting que soporte Next.js.
