import { NextResponse } from "next/server";
import { SERIES_CATALOG } from "@/lib/seriesCatalog";

export const revalidate = 3600;

const OPENAPI = {
  openapi: "3.1.0",
  info: {
    title: "Estadísticas Argentinas API",
    version: "1.0.0",
    description:
      "API pública read-only de indicadores macroeconómicos argentinos. Datos del INDEC, BCRA, MECON, Banco Mundial. Sin auth, sin rate limit explícito.",
    contact: { name: "Datalogía", url: "https://datalogia.app" },
    license: { name: "MIT" },
  },
  servers: [
    { url: "https://estadisticas.datalogia.app/api/v1", description: "Production" },
  ],
  paths: {
    "/catalog": {
      get: {
        summary: "Catálogo completo de series disponibles",
        operationId: "getCatalog",
        tags: ["meta"],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    version: { type: "string" },
                    updated_at: { type: "string", format: "date-time" },
                    categories: { type: "object", additionalProperties: { type: "string" } },
                    series: {
                      type: "array",
                      items: {
                        type: "object",
                        required: ["id", "label", "category", "unit"],
                        properties: {
                          id: { type: "string" },
                          label: { type: "string" },
                          category: { type: "string" },
                          unit: { type: "string" },
                        },
                      },
                    },
                    count: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/series/{id}": {
      get: {
        summary: "Obtener una serie temporal específica",
        operationId: "getSeries",
        tags: ["series"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", enum: SERIES_CATALOG.map((s) => s.id) },
            description: "ID de la serie",
          },
          {
            name: "from",
            in: "query",
            required: false,
            schema: { type: "string", format: "date" },
            description: "Filtrar desde esta fecha (YYYY-MM-DD)",
          },
          {
            name: "to",
            in: "query",
            required: false,
            schema: { type: "string", format: "date" },
            description: "Filtrar hasta esta fecha (YYYY-MM-DD)",
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, maximum: 9999 },
            description: "Máximo de puntos a devolver (últimos N)",
          },
        ],
        responses: {
          "200": {
            description: "Serie encontrada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["id", "label", "category", "unit", "count", "data"],
                  properties: {
                    id: { type: "string" },
                    label: { type: "string" },
                    category: { type: "string" },
                    unit: { type: "string" },
                    count: { type: "integer" },
                    data: {
                      type: "array",
                      items: {
                        type: "array",
                        prefixItems: [
                          { type: "string", description: "Fecha ISO" },
                          { type: "number", description: "Valor" },
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
          "404": {
            description: "Serie no encontrada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { error: { type: "string" } },
                },
              },
            },
          },
        },
      },
    },
    "/snapshot": {
      get: {
        summary: "Snapshot del día — últimos valores de los principales indicadores",
        operationId: "getSnapshot",
        tags: ["snapshot"],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    version: { type: "string" },
                    updated_at: { type: "string", format: "date-time" },
                    indicators: {
                      type: "object",
                      additionalProperties: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          label: { type: "string" },
                          unit: { type: "string" },
                          value: { type: ["number", "null"] },
                          period: { type: ["string", "null"] },
                          monthly_change: { type: ["number", "null"] },
                          yoy_change: { type: ["number", "null"] },
                          source: { type: ["string", "null"] },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/health": {
      get: {
        summary: "Healthcheck",
        operationId: "getHealth",
        tags: ["meta"],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", enum: ["ok"] },
                    version: { type: "string" },
                    timestamp: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  tags: [
    { name: "meta", description: "Endpoints de descubrimiento y monitoreo" },
    { name: "series", description: "Series temporales" },
    { name: "snapshot", description: "Últimos valores combinados" },
  ],
};

export async function GET() {
  return NextResponse.json(OPENAPI, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
