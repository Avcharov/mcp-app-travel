# Travel Planner MCP App – SPEC

## Value Proposition

Help users plan multi-day trips with a visual, map-centric experience. Search for places, organise them day by day, drag-and-drop to reorder, and visualise routes between them on Google Maps — all within the LLM conversation.

## Architecture Decisions

- **One widget**: `plan-travel` — fullscreen, owns the entire experience.
- **MCP server is a proxy**: all real data comes from a Python service that queries Google APIs. The server translates MCP tool calls into HTTP requests to that Python backend.
- **Google Maps API key**: loaded server-side from `GOOGLE_MAPS_API_KEY` env var, passed to the widget via `_meta.googleMapsApiKey`. Never bundled in client code.

## UX Flow

1. LLM triggers `plan-travel` widget (user says "Help me plan a trip to Barcelona").
2. Widget opens fullscreen — split layout: **Sidebar left | Map right**.
3. User types in Search Bar → `search-places` tool fires → results appear below search.
4. User clicks a result to add it to the active day's itinerary.
5. User can drag-and-drop places within a day to reorder the visit order.
6. Map updates: markers + route polylines between consecutive places.
7. User picks transport mode (car / public transit / walking) → routes re-fetch.
8. User can add more days; each day is a collapsible section in the sidebar.
9. Inline mode shows a compact summary card; user can expand to fullscreen.

## Tools (MCP → Python Proxy)

### Widget: `plan-travel`
- Input: `{ destination?: string }` — optional seed destination LLM can pre-fill
- Output `structuredContent`: `{ days: Day[] }` — itinerary the LLM can reference
- Output `_meta`: `{ googleMapsApiKey: string }` — never exposed to LLM

### Tool: `search-places`
- readOnly: true
- Input: `{ query: string }`
- Proxied to Python service `GET /search?query=…`
- Output: `{ places: Place[] }`

### Tool: `get-directions`
- readOnly: true
- Input: `{ origin: LatLng, destination: LatLng, mode: TransportMode }`
- Proxied to Python service `POST /directions`
- Output: `{ polyline: string, duration: string, distance: string }`

## Data Types

```
Place   { placeId, name, address, lat, lng, rating?, photoUrl? }
Day     { id, label, places: Place[] }
LatLng  { lat: number, lng: number }
TransportMode = "driving" | "transit" | "walking"
Route   { from: string, to: string, mode: TransportMode, polyline: string, duration: string, distance: string }
```

## CSP Requirements

```
connectDomains:  ["https://maps.googleapis.com"]
resourceDomains: ["https://maps.googleapis.com", "https://maps.gstatic.com"]
```

## File Structure

```
server/src/index.ts              — McpServer: plan-travel widget + 2 tools
web/src/
  helpers.ts                     — generateHelpers<AppType>()
  types.ts                       — shared TS interfaces
  store/travelStore.ts           — createStore (itinerary, search, routes, transport)
  index.css                      — global styles + CSS vars (light/dark)
  components/
    Layout/AppLayout.tsx         — fullscreen flex split
    Sidebar/
      Sidebar.tsx
      SearchBar.tsx
      SearchResults.tsx
      DayPlan.tsx
      PlaceCard.tsx
      TransportSelector.tsx
    Map/
      TravelMap.tsx
      RoutePolyline.tsx
  widgets/plan-travel.tsx        — entry widget
```

## Environment Variables

| Variable | Purpose |
|---|---|
| `GOOGLE_MAPS_API_KEY` | Maps JS API key (server-side only) |
| `PYTHON_SERVICE_URL` | Base URL of the Python backend, e.g. `http://localhost:8000` |

## Design Notes (Hackathon Phase 1)

- Minimal styling: CSS variables for theming, functional layout.
- No design system — raw HTML + CSS.
- Design to be improved in Phase 2 when assets arrive from designers.
