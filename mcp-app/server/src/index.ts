import { McpServer } from "skybridge/server";
import { z } from "zod";

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL ?? "http://localhost:8000";
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY ?? "";

const server = new McpServer(
  { name: "travel-planner", version: "0.0.1" },
  { capabilities: {} },
)
  // ─── Widget: plan-travel ────────────────────────────────────────────────────
  .registerWidget(
    "plan-travel",
    {
      description:
        "Open the travel planner. Shows a fullscreen split-view with a day-by-day itinerary sidebar and a live Google Map with routes.",
      _meta: {
        ui: {
          csp: {
            connectDomains: [
              "https://maps.googleapis.com",
              "https://maps.gstatic.com",
            ],
            resourceDomains: [
              "https://maps.googleapis.com",
              "https://maps.gstatic.com",
              "https://fonts.googleapis.com",
              "https://fonts.gstatic.com",
            ],
          },
        },
      },
    },
    {
      description:
        "Plan a multi-day trip. Use this whenever the user wants to plan, explore, or organise places to visit.",
      inputSchema: {
        days: z
          .number()
          .int()
          .min(1)
          .max(30)
          .optional()
          .describe("Number of days to plan for. Defaults to 1."),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ days }) => {
      const dayCount = days ?? 1;
      return {
        structuredContent: { days: dayCount },
        content: [
          {
            type: "text",
            text: `Opening travel planner for ${dayCount} day${dayCount > 1 ? "s" : ""}.`,
          },
        ],
        _meta: {
          googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        },
      };
    },
  )

  // ─── Tool: search-places ────────────────────────────────────────────────────
  .registerTool(
    "search-places",
    {
      description:
        "Search for places (attractions, restaurants, hotels, etc.) by text query. Returns a list of matching places with coordinates.",
      inputSchema: {
        query: z.string().describe("Text search query, e.g. 'museums in Barcelona'."),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ query }) => {
      try {
        const url = `${PYTHON_SERVICE_URL}/search?query=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Python service error: ${res.status}`);
        const data = await res.json() as { places: unknown[] };
        return {
          structuredContent: data,
          content: [{ type: "text", text: `Found ${(data.places ?? []).length} places for "${query}".` }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Search failed: ${err}` }],
          isError: true,
        };
      }
    },
  )

  // ─── Tool: get-directions ───────────────────────────────────────────────────
  .registerTool(
    "get-directions",
    {
      description:
        "Get directions and route polyline between two coordinates for a given transport mode.",
      inputSchema: {
        originLat: z.number().describe("Origin latitude."),
        originLng: z.number().describe("Origin longitude."),
        destinationLat: z.number().describe("Destination latitude."),
        destinationLng: z.number().describe("Destination longitude."),
        mode: z
          .enum(["driving", "transit", "walking"])
          .describe("Transport mode."),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ originLat, originLng, destinationLat, destinationLng, mode }) => {
      try {
        const res = await fetch(`${PYTHON_SERVICE_URL}/directions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin: { lat: originLat, lng: originLng },
            destination: { lat: destinationLat, lng: destinationLng },
            mode,
          }),
        });
        if (!res.ok) throw new Error(`Python service error: ${res.status}`);
        const data = await res.json() as { polyline: string; duration: string; distance: string };
        return {
          structuredContent: data,
          content: [{ type: "text", text: `Route: ${data.distance}, ~${data.duration}.` }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Directions failed: ${err}` }],
          isError: true,
        };
      }
    },
  );

server.run();
export type AppType = typeof server;

