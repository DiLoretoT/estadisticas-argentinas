import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Estadísticas Argentinas — Dashboard de indicadores económicos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "linear-gradient(135deg, #fcfaf6 0%, #f5ece0 50%, #f0ddd0 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Top — eyebrow + brand */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span
            style={{
              fontSize: 22,
              color: "#c45a2d",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Datos oficiales · INDEC · BCRA
          </span>
          <span
            style={{
              fontSize: 22,
              color: "#5a5048",
              fontWeight: 600,
            }}
          >
            Datalogía
          </span>
        </div>

        {/* Middle — title */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <h1
            style={{
              fontSize: 92,
              fontWeight: 800,
              color: "#2d251d",
              lineHeight: 1.0,
              letterSpacing: "-0.025em",
              margin: 0,
            }}
          >
            La economía argentina,
          </h1>
          <h1
            style={{
              fontSize: 92,
              fontWeight: 800,
              color: "#c45a2d",
              lineHeight: 1.0,
              letterSpacing: "-0.025em",
              margin: 0,
            }}
          >
            en datos.
          </h1>
          <p
            style={{
              fontSize: 32,
              color: "#6b5f53",
              margin: "16px 0 0 0",
              lineHeight: 1.3,
              maxWidth: 900,
            }}
          >
            Inflación · Dólar · Actividad · Empleo · Pobreza · Deuda · Mercado.
          </p>
        </div>

        {/* Bottom — URL bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "2px solid #d4b896",
            paddingTop: 24,
          }}
        >
          <span style={{ fontSize: 28, color: "#5a5048", fontWeight: 600 }}>
            estadisticas.datalogia.app
          </span>
          <span style={{ fontSize: 24, color: "#a08a72" }}>
            Open Source · MIT
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
