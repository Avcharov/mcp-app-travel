export type TransportMode = "driving" | "transit" | "walking";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Place {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  photoUrl?: string;
}

export interface Day {
  id: string;
  label: string;
  places: Place[];
}

export interface Route {
  from: string; // placeId
  to: string;   // placeId
  mode: TransportMode;
  polyline: string;
  duration: string;
  distance: string;
}
