import { useMemo } from "react";
import { Polyline } from "@vis.gl/react-google-maps";
import type { Route } from "@/types.js";

interface Props {
  route: Route;
}

// Decode a Google Maps encoded polyline into LatLng array
function decodePolyline(encoded: string): Array<{ lat: number; lng: number }> {
  const points: Array<{ lat: number; lng: number }> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

const MODE_COLORS: Record<string, string> = {
  DRIVE: "#1a73e8",
  BICYCLE: "#f4a800",
  TRANSIT: "#1e8e3e",
  WALK: "#e8710a",
  TWO_WHEELER: "#9c27b0",
};

export function RoutePolyline({ route }: Props) {
  const path = useMemo(() => decodePolyline(route.polyline), [route.polyline]);
  const color = MODE_COLORS[route.mode] ?? "#1a73e8";

  return (
    <Polyline
      path={path}
      strokeColor={color}
      strokeWeight={4}
      strokeOpacity={0.8}
    />
  );
}
