import { useEffect, useRef } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
} from "@vis.gl/react-google-maps";
import { useTravelStore } from "@/store/travelStore.js";
import { useCallTool } from "@/helpers.js";
import type { Route } from "@/types.js";
import { RoutePolyline } from "./RoutePolyline.js";

const DAY_COLORS = ["#1a73e8", "#e8710a", "#1e8e3e", "#a142f4", "#d93025", "#f29900"];

interface Props {
  apiKey: string;
}

export function TravelMap({ apiKey }: Props) {
  const days = useTravelStore((s) => s.days);
  const transportMode = useTravelStore((s) => s.transportMode);
  const routes = useTravelStore((s) => s.routes);
  const routeVersion = useTravelStore((s) => s.routeVersion);
  const upsertRoute = useTravelStore((s) => s.upsertRoute);
  const { callToolAsync } = useCallTool("get-directions");

  // Stabilize callToolAsync via ref to avoid dependency issues
  const callToolRef = useRef(callToolAsync);
  callToolRef.current = callToolAsync;

  // Centralized route fetching — runs when routeVersion changes
  useEffect(() => {
    const pairs = days.flatMap((day) =>
      day.places.slice(0, -1).map((place, i) => ({
        from: place,
        to: day.places[i + 1],
      })),
    );

    if (pairs.length === 0) return;

    let cancelled = false;

    (async () => {
      for (const { from, to } of pairs) {
        if (cancelled) break;
        try {
          const result = await callToolRef.current({
            originLat: from.lat,
            originLng: from.lng,
            destinationLat: to.lat,
            destinationLng: to.lng,
            mode: transportMode,
          });
          if (cancelled) break;
          const content = result.structuredContent as {
            polyline?: string;
            duration?: string;
            distance?: string;
          } | undefined;
          if (content?.polyline) {
            const route: Route = {
              from: from.placeId,
              to: to.placeId,
              mode: transportMode,
              polyline: content.polyline,
              duration: content.duration ?? "",
              distance: content.distance ?? "",
            };
            upsertRoute(route);
          }
        } catch {
          // Skip failed route — don't block the rest
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // routeVersion captures all itinerary/mode changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeVersion]);

  // All places across all days (with day index for color)
  const allPlaces = days.flatMap((day, dayIndex) =>
    day.places.map((place) => ({ ...place, dayIndex })),
  );

  // Default center: first place or world view
  const firstPlace = allPlaces[0];
  const center = firstPlace
    ? { lat: firstPlace.lat, lng: firstPlace.lng }
    : { lat: 20, lng: 0 };

  if (!apiKey) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--color-text-secondary)" }}>
        Map unavailable — Google Maps API key not configured
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        mapId="travel-planner-map"
        defaultCenter={center}
        defaultZoom={firstPlace ? 13 : 2}
        style={{ width: "100%", height: "100%" }}
        gestureHandling="greedy"
        disableDefaultUI={false}
      >
        {/* Markers */}
        {allPlaces.map((place, globalIndex) => {
          const color = DAY_COLORS[place.dayIndex % DAY_COLORS.length];
          const dayOrder =
            days[place.dayIndex].places.findIndex((p) => p.placeId === place.placeId) + 1;
          return (
            <AdvancedMarker
              key={`${place.placeId}-${globalIndex}`}
              position={{ lat: place.lat, lng: place.lng }}
              title={place.name}
            >
              <Pin
                background={color}
                borderColor={color}
                glyphColor="#fff"
                glyph={String(dayOrder)}
              />
            </AdvancedMarker>
          );
        })}

        {/* Routes */}
        {routes.map((route) => (
          <RoutePolyline key={`${route.from}-${route.to}-${route.mode}`} route={route} />
        ))}
      </Map>
    </APIProvider>
  );
}
