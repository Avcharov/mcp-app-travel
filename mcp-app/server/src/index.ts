import { McpServer } from "skybridge/server";
import { z } from "zod";

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL ?? "http://localhost:8000";
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY ?? "";
const USE_MOCK = process.env.USE_MOCK === "true" || true; // flip to false when Python service is ready

// ─── Mock data ───────────────────────────────────────────────────────────────
const MOCK_PLACES: Record<string, Array<{ placeId: string; name: string; address: string; lat: number; lng: number; rating: number; photoUrl: string }>> = {
  default: [
    { placeId: "p1", name: "Sagrada Família", address: "C/ de Mallorca, 401, Barcelona", lat: 41.4036, lng: 2.1744, rating: 4.8, photoUrl: "" },
    { placeId: "p2", name: "Park Güell", address: "C/ d'Olot, Barcelona", lat: 41.4145, lng: 2.1527, rating: 4.7, photoUrl: "" },
    { placeId: "p3", name: "La Barceloneta Beach", address: "Barceloneta, Barcelona", lat: 41.3808, lng: 2.1898, rating: 4.5, photoUrl: "" },
    { placeId: "p4", name: "Gothic Quarter", address: "Barri Gòtic, Barcelona", lat: 41.3833, lng: 2.1762, rating: 4.6, photoUrl: "" },
    { placeId: "p5", name: "Camp Nou", address: "C/ d'Arístides Maillol, Barcelona", lat: 41.3809, lng: 2.1228, rating: 4.6, photoUrl: "" },
  ],
  paris: [
    { placeId: "pp1", name: "Eiffel Tower", address: "Champ de Mars, 5 Av. Anatole France, Paris", lat: 48.8584, lng: 2.2945, rating: 4.7, photoUrl: "" },
    { placeId: "pp2", name: "Louvre Museum", address: "Rue de Rivoli, Paris", lat: 48.8606, lng: 2.3376, rating: 4.8, photoUrl: "" },
    { placeId: "pp3", name: "Notre-Dame Cathedral", address: "6 Parvis Notre-Dame, Paris", lat: 48.8530, lng: 2.3499, rating: 4.7, photoUrl: "" },
    { placeId: "pp4", name: "Montmartre", address: "Montmartre, Paris", lat: 48.8867, lng: 2.3431, rating: 4.6, photoUrl: "" },
    { placeId: "pp5", name: "Palace of Versailles", address: "Place d'Armes, Versailles", lat: 48.8049, lng: 2.1204, rating: 4.8, photoUrl: "" },
  ],
  rome: [
    { placeId: "pr1", name: "Colosseum", address: "Piazza del Colosseo, Rome", lat: 41.8902, lng: 12.4922, rating: 4.8, photoUrl: "" },
    { placeId: "pr2", name: "Vatican Museums", address: "Viale Vaticano, Rome", lat: 41.9065, lng: 12.4536, rating: 4.7, photoUrl: "" },
    { placeId: "pr3", name: "Trevi Fountain", address: "Piazza di Trevi, Rome", lat: 41.9009, lng: 12.4833, rating: 4.7, photoUrl: "" },
    { placeId: "pr4", name: "Pantheon", address: "Piazza della Rotonda, Rome", lat: 41.8986, lng: 12.4769, rating: 4.7, photoUrl: "" },
    { placeId: "pr5", name: "Borghese Gallery", address: "Piazzale Scipione Borghese, Rome", lat: 41.9143, lng: 12.4927, rating: 4.7, photoUrl: "" },
  ],
};

function getMockPlaces(query: string) {
  const q = query.toLowerCase();
  if (q.includes("paris") || q.includes("france")) return MOCK_PLACES.paris;
  if (q.includes("rome") || q.includes("italy") || q.includes("roman")) return MOCK_PLACES.rome;
  // filter default Barcelona set by keyword, or return all
  const filtered = MOCK_PLACES.default.filter(p =>
    p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q),
  );
  return filtered.length > 0 ? filtered : MOCK_PLACES.default;
}

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
      if (USE_MOCK) {
        const places = getMockPlaces(query);
        return {
          structuredContent: { places },
          content: [{ type: "text", text: `[MOCK] Found ${places.length} places for "${query}".` }],
        };
      }
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

