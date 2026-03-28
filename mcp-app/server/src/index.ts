import { McpServer } from "skybridge/server";
import { z } from "zod";

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL ?? "http://localhost:8080";
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY ?? "";
const USE_MOCK = process.env.USE_MOCK === "true" || false; // flip to false when Python service is ready

// ─── Mock data ───────────────────────────────────────────────────────────────
const MOCK_PREDICTIONS = [
  {
    origin: { placeId: "pred1", name: "Sagrada Família", address: "C/ de Mallorca, 401, Barcelona", lat: 41.4036, lng: 2.1744 },
    destination: { placeId: "pred2", name: "Park Güell", address: "C/ d'Olot, Barcelona", lat: 41.4145, lng: 2.1527 },
    route: {
      from: "pred1",
      to: "pred2",
      mode: "WALK" as const,
      polyline: "",
      distance: "1.8 km",
      duration: "22 mins",
    },
  },
  {
    origin: { placeId: "pred3", name: "La Barceloneta Beach", address: "Barceloneta, Barcelona", lat: 41.3808, lng: 2.1898 },
    destination: null,
    route: null,
  },
];

const MOCK_PLACES: Record<string, Array<{ placeId: string; name: string; address: string; lat: number; lng: number }>> = {
  default: [
    { placeId: "p1", name: "Sagrada Família", address: "C/ de Mallorca, 401, Barcelona", lat: 41.4036, lng: 2.1744 },
    { placeId: "p2", name: "Park Güell", address: "C/ d'Olot, Barcelona", lat: 41.4145, lng: 2.1527 },
    { placeId: "p3", name: "La Barceloneta Beach", address: "Barceloneta, Barcelona", lat: 41.3808, lng: 2.1898 },
    { placeId: "p4", name: "Gothic Quarter", address: "Barri Gòtic, Barcelona", lat: 41.3833, lng: 2.1762 },
    { placeId: "p5", name: "Camp Nou", address: "C/ d'Arístides Maillol, Barcelona", lat: 41.3809, lng: 2.1228 },
  ],
  paris: [
    { placeId: "pp1", name: "Eiffel Tower", address: "Champ de Mars, 5 Av. Anatole France, Paris", lat: 48.8584, lng: 2.2945 },
    { placeId: "pp2", name: "Louvre Museum", address: "Rue de Rivoli, Paris", lat: 48.8606, lng: 2.3376 },
    { placeId: "pp3", name: "Notre-Dame Cathedral", address: "6 Parvis Notre-Dame, Paris", lat: 48.8530, lng: 2.3499 },
    { placeId: "pp4", name: "Montmartre", address: "Montmartre, Paris", lat: 48.8867, lng: 2.3431 },
    { placeId: "pp5", name: "Palace of Versailles", address: "Place d'Armes, Versailles", lat: 48.8049, lng: 2.1204 },
  ],
  rome: [
    { placeId: "pr1", name: "Colosseum", address: "Piazza del Colosseo, Rome", lat: 41.8902, lng: 12.4922 },
    { placeId: "pr2", name: "Vatican Museums", address: "Viale Vaticano, Rome", lat: 41.9065, lng: 12.4536 },
    { placeId: "pr3", name: "Trevi Fountain", address: "Piazza di Trevi, Rome", lat: 41.9009, lng: 12.4833 },
    { placeId: "pr4", name: "Pantheon", address: "Piazza della Rotonda, Rome", lat: 41.8986, lng: 12.4769 },
    { placeId: "pr5", name: "Borghese Gallery", address: "Piazzale Scipione Borghese, Rome", lat: 41.9143, lng: 12.4927 },
  ],
};

// ─── Mock directions helpers ──────────────────────────────────────────────────
function encodePolyline(points: Array<[number, number]>): string {
  let output = "";
  let prevLat = 0, prevLng = 0;
  for (const [lat, lng] of points) {
    const dLat = Math.round(lat * 1e5) - Math.round(prevLat * 1e5);
    const dLng = Math.round(lng * 1e5) - Math.round(prevLng * 1e5);
    prevLat = lat;
    prevLng = lng;
    for (const v of [dLat, dLng]) {
      let n = v < 0 ? ~(v << 1) : v << 1;
      while (n >= 0x20) {
        output += String.fromCharCode((0x20 | (n & 0x1f)) + 63);
        n >>= 5;
      }
      output += String.fromCharCode(n + 63);
    }
  }
  return output;
}

function getMockDirections(
  originLat: number, originLng: number,
  destinationLat: number, destinationLng: number,
  mode: string,
) {
  const points: Array<[number, number]> = Array.from({ length: 5 }, (_, i) => {
    const t = i / 4;
    return [
      originLat + (destinationLat - originLat) * t,
      originLng + (destinationLng - originLng) * t,
    ];
  });
  const polyline = encodePolyline(points);

  const R = 6371;
  const dLat = (destinationLat - originLat) * (Math.PI / 180);
  const dLng = (destinationLng - originLng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(originLat * (Math.PI / 180)) *
      Math.cos(destinationLat * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2;
  const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const speeds: Record<string, number> = { WALK: 5, BICYCLE: 15, TRANSIT: 30, DRIVE: 50, TWO_WHEELER: 40 };
  const durationMin = Math.round((distKm / (speeds[mode] ?? 30)) * 60);

  return {
    polyline,
    distance: distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`,
    duration: durationMin < 60 ? `${durationMin} mins` : `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`,
  };
}

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
        "Plan a multi-day trip. Use this whenever the user wants to plan, explore, or organise places to visit. " +
        "If the user mentions specific places, destinations, or preferences (e.g. 'museums in Paris', 'beaches in Barcelona'), " +
        "the LLM should search for matching places first and pass the resolved names into the `places` parameter. " +
        "If the user has no specific preferences, you can omit `places` and just provide `days`.",
      inputSchema: {
        days: z
          .number()
          .int()
          .min(1)
          .max(30)
          .optional()
          .describe("Number of days to plan for. Defaults to 1."),
        places: z
          .array(z.array(z.string()))
          .describe(
            "Places to visit per day. Outer array = days, inner array = place names for that day. " +
            'Example: [["Eiffel Tower","Louvre Museum"],["Versailles","Montmartre"]]. ' +
            "Each name will be resolved via search. Its length overrides `days`. " +
            "If the user has no specific preferences or context, pass an empty array []."
          ),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ days, places }) => {
      const dayCount = places.length > 0 ? places.length : (days ?? 1);
      return {
        structuredContent: { days: dayCount, places: places.length > 0 ? places : null },
        content: [
          {
            type: "text",
            text: `Opening travel planner for ${dayCount} day${dayCount > 1 ? "s" : ""}${places.length > 0 ? ` with ${places.flat().length} places to resolve.` : "."}`,
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
        "APP-ONLY — this tool is called by the app UI, not directly by the LLM. " +
        "Search for places (attractions, restaurants, hotels, etc.) by text query. " +
        "Returns a list of matching places with coordinates and place IDs.",
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
        const url = `${PYTHON_SERVICE_URL}/places/?name=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Python service error: ${res.status}`);
        const raw = await res.json() as Array<{ name: string; formatted_address: string; lat: number; lng: number; place_id: string }>;
        const places = raw.map(r => ({ placeId: r.place_id, name: r.name, address: r.formatted_address, lat: r.lat, lng: r.lng }));
        return {
          structuredContent: { places },
          content: [{ type: "text", text: `Found ${places.length} place(s) for "${query}".` }],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Search failed: ${err instanceof Error ? err.message : String(err)}` }],
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
        "APP-ONLY — this tool is called by the app UI, not directly by the LLM. " +
        "Get directions and route polyline between two places for a given transport mode. " +
        "Requires place IDs returned by search-places.",
      inputSchema: {
        originPlaceId: z.string().describe("Place ID of the origin (from search-places)."),
        destinationPlaceId: z.string().describe("Place ID of the destination (from search-places)."),
        mode: z
          .enum(["DRIVE", "BICYCLE", "WALK", "TWO_WHEELER", "TRANSIT"])
          .describe("Transport mode (RouteTravelMode): DRIVE, BICYCLE, WALK, TWO_WHEELER, TRANSIT."),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ originPlaceId, destinationPlaceId, mode }) => {
      if (USE_MOCK) {
        const allPlaces = Object.values(MOCK_PLACES).flat();
        const origin = allPlaces.find(p => p.placeId === originPlaceId);
        const destination = allPlaces.find(p => p.placeId === destinationPlaceId);
        if (!origin || !destination) {
          return {
            content: [{ type: "text", text: `[MOCK] Place ID not found in mock data.` }],
            isError: true,
          };
        }
        const data = getMockDirections(origin.lat, origin.lng, destination.lat, destination.lng, mode);
        return {
          structuredContent: data,
          content: [{ type: "text", text: `[MOCK] Route: ${data.distance}, ~${data.duration}.` }],
        };
      }
      try {
        const res = await fetch(`${PYTHON_SERVICE_URL}/places/compute_route/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin_place_id: originPlaceId,
            destination_place_id: destinationPlaceId,
            travel_mode: mode,
          }),
        });
        if (!res.ok) throw new Error(`Python service error: ${res.status}`);
        const raw = await res.json() as Array<Record<string, unknown>>;
        const route = (Array.isArray(raw) ? raw[0] : raw) as Record<string, unknown>;
        // polyline comes as { encodedPolyline: "..." }
        const polylineRaw = route.polyline as Record<string, unknown> | string | undefined;
        const polyline = typeof polylineRaw === "string"
          ? polylineRaw
          : (polylineRaw?.encodedPolyline as string ?? "");
        // distance/duration may come as objects like { text: "1.2 km", value: 1200 }
        const distRaw = route.distance as Record<string, unknown> | string | undefined;
        const distance = typeof distRaw === "string" ? distRaw : (distRaw?.text as string ?? "");
        const durRaw = route.duration as Record<string, unknown> | string | undefined;
        const duration = typeof durRaw === "string" ? durRaw : (durRaw?.text as string ?? "");
        const data = { polyline, distance, duration };
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
  )

  // ─── Tool: predict-places ──────────────────────────────────────────────────
  .registerTool(
    "predict-places",
    {
      description:
        "APP-ONLY — this tool is called by the app UI, not directly by the LLM. " +
        "Upload images (e.g. travel brochures, screenshots) and predict places and routes from them. " +
        "Returns a list of predicted origin/destination pairs with optional routes.",
      inputSchema: {
        images: z.array(z.string()).describe("Array of base64-encoded image strings (without data-URI prefix)."),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ images }) => {
      if (USE_MOCK) {
        // Generate polylines for mock predictions that have routes
        const predictions = MOCK_PREDICTIONS.map((p) => {
          if (p.route && p.origin && p.destination) {
            const dirs = getMockDirections(p.origin.lat, p.origin.lng, p.destination.lat, p.destination.lng, p.route.mode);
            return { ...p, route: { ...p.route, polyline: dirs.polyline, distance: dirs.distance, duration: dirs.duration } };
          }
          return p;
        });
        return {
          structuredContent: { predictions },
          content: [{ type: "text" as const, text: `[MOCK] Predicted ${predictions.length} place(s) from ${images.length} image(s).` }],
        };
      }
      try {
        // Build multipart form data — each image becomes a file part
        const formData = new FormData();
        for (const base64Img of images) {
          const buffer = Buffer.from(base64Img, "base64");
          const blob = new Blob([buffer], { type: "image/jpeg" });
          formData.append("files", blob, "image.jpg");
        }

        const res = await fetch(`${PYTHON_SERVICE_URL}/places/predict/`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error(`Python service error: ${res.status}`);

        const raw = await res.json() as Array<{
          origin: { name: string; formatted_address: string; lat: number; lng: number; place_id: string };
          destination?: { name: string; formatted_address: string; lat: number; lng: number; place_id: string } | null;
          route?: {
            polyline: string | { encodedPolyline: string };
            distance: string | { text: string };
            duration: string | { text: string };
            travel_mode?: string;
          } | null;
        }>;

        const predictions = raw.map((item) => {
          const origin = {
            placeId: item.origin.place_id,
            name: item.origin.name,
            address: item.origin.formatted_address,
            lat: item.origin.lat,
            lng: item.origin.lng,
          };

          const destination = item.destination ? {
            placeId: item.destination.place_id,
            name: item.destination.name,
            address: item.destination.formatted_address,
            lat: item.destination.lat,
            lng: item.destination.lng,
          } : null;

          let route = null;
          if (item.route && destination) {
            const polylineRaw = item.route.polyline;
            const polyline = typeof polylineRaw === "string"
              ? polylineRaw
              : (polylineRaw?.encodedPolyline ?? "");
            const distRaw = item.route.distance;
            const distance = typeof distRaw === "string" ? distRaw : (distRaw?.text ?? "");
            const durRaw = item.route.duration;
            const duration = typeof durRaw === "string" ? durRaw : (durRaw?.text ?? "");
            const mode = (item.route.travel_mode as "DRIVE" | "WALK" | "TRANSIT" | "BICYCLE" | "TWO_WHEELER") ?? "DRIVE";
            route = { from: origin.placeId, to: destination.placeId, mode, polyline, distance, duration };
          }

          return { origin, destination, route };
        });

        return {
          structuredContent: { predictions },
          content: [{ type: "text" as const, text: `Predicted ${predictions.length} place(s) from ${images.length} image(s).` }],
        };
      } catch (err) {
        return {
          content: [{ type: "text" as const, text: `Prediction failed: ${err instanceof Error ? err.message : String(err)}` }],
          isError: true,
        };
      }
    },
  );

server.run();
export type AppType = typeof server;

