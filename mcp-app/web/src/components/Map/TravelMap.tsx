import { useEffect, useRef } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap,
} from "@vis.gl/react-google-maps";
import { useTravelStore } from "@/store/travelStore.js";
import { useCallTool } from "@/helpers.js";
import type { Route } from "@/types.js";
import { RoutePolyline } from "./RoutePolyline.js";

/** Easing function — ease-in-out cubic for natural feel */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Linearly interpolate between two values */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Smoothly fly the map camera from current position to a target.
 * Uses requestAnimationFrame + moveCamera for buttery animation.
 */
function flyTo(
  map: google.maps.Map,
  target: { lat: number; lng: number; zoom: number },
  durationMs = 1200,
): () => void {
  const startCenter = map.getCenter();
  const startZoom = map.getZoom() ?? 2;
  if (!startCenter) {
    map.moveCamera({ center: target, zoom: target.zoom });
    return () => {};
  }

  const startLat = startCenter.lat();
  const startLng = startCenter.lng();
  const startTime = performance.now();
  let rafId = 0;

  function animate(now: number) {
    const elapsed = now - startTime;
    const rawT = Math.min(elapsed / durationMs, 1);
    const t = easeInOutCubic(rawT);

    map.moveCamera({
      center: { lat: lerp(startLat, target.lat, t), lng: lerp(startLng, target.lng, t) },
      zoom: lerp(startZoom, target.zoom, t),
    });

    if (rawT < 1) {
      rafId = requestAnimationFrame(animate);
    }
  }

  rafId = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(rafId);
}

/** Sits inside <Map> and smoothly flies the camera to newly added places. */
function MapCameraController() {
  const lastAddedPlace = useTravelStore((s) => s.lastAddedPlace);
  const map = useMap(null);
  const cancelRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    if (!map || !lastAddedPlace) return;

    // Cancel any in-progress animation
    cancelRef.current?.();

    const targetZoom = Math.max(map.getZoom() ?? 0, 14);
    cancelRef.current = flyTo(map, {
      lat: lastAddedPlace.lat,
      lng: lastAddedPlace.lng,
      zoom: targetZoom,
    });

    return () => cancelRef.current?.();
  }, [lastAddedPlace?.placeId]); // fire only when a different place is added
  // eslint-disable-next-line react-hooks/exhaustive-deps

  return null;
}

const DAY_COLORS = ["#1a73e8", "#e8710a", "#1e8e3e", "#a142f4", "#d93025", "#f29900"];

interface Props {
  apiKey: string;
}

export function TravelMap({ apiKey }: Props) {
  const days = useTravelStore((s) => s.days);
  const transportMode = useTravelStore((s) => s.transportMode);
  const segmentModes = useTravelStore((s) => s.segmentModes);
  const routes = useTravelStore((s) => s.routes);
  const routeVersion = useTravelStore((s) => s.routeVersion);
  const upsertRoute = useTravelStore((s) => s.upsertRoute);
  const setRoutes = useTravelStore((s) => s.setRoutes);
  const { callToolAsync } = useCallTool("get-directions");

  // Stabilize callToolAsync via ref to avoid dependency issues
  const callToolRef = useRef(callToolAsync);
  callToolRef.current = callToolAsync;

  // Centralized route fetching — runs when routeVersion changes
  useEffect(() => {
    const withinDayPairs = days.flatMap((day) =>
      day.places.slice(0, -1).map((place, i) => ({
        from: place,
        to: day.places[i + 1],
      })),
    );

    const crossDayPairs = days.slice(0, -1).flatMap((day, i) => {
      const lastPlace = day.places[day.places.length - 1];
      const firstNextPlace = days[i + 1]?.places[0];
      if (!lastPlace || !firstNextPlace) return [];
      return [{ from: lastPlace, to: firstNextPlace }];
    });

    const pairs = [...withinDayPairs, ...crossDayPairs];

    // Prune stale routes whose from→to no longer matches the current pairs
    const validKeys = new Set(pairs.map(({ from, to }) => `${from.placeId}::${to.placeId}`));
    const currentRoutes = useTravelStore.getState().routes;
    const freshRoutes = currentRoutes.filter((r) => validKeys.has(`${r.from}::${r.to}`));
    if (freshRoutes.length !== currentRoutes.length) {
      setRoutes(freshRoutes);
    }

    if (pairs.length === 0) return;

    let cancelled = false;

    (async () => {
      for (const { from, to } of pairs) {
        if (cancelled) break;
        try {
          const segmentKey = `${from.placeId}::${to.placeId}`;
          const mode = segmentModes[segmentKey] ?? transportMode;
          const result = await callToolRef.current({
            originPlaceId: from.placeId,
            destinationPlaceId: to.placeId,
            mode,
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
              mode,
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
        <MapCameraController />

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
