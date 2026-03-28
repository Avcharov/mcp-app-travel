import { createStore } from "skybridge/web";
import type { Day, Place, Route, TransportMode } from "../types.js";

type TravelState = {
  days: Day[];
  activeDayId: string | null;
  transportMode: TransportMode;
  routes: Route[];
  /** Incremented whenever routes need re-fetching (reorder, mode change, cross-day move) */
  routeVersion: number;
  /** Last place added — used to trigger map camera transition. Not persisted to LLM. */
  lastAddedPlace: Place | null;

  // Actions
  addDay: () => void;
  removeDay: (dayId: string) => void;
  setActiveDay: (dayId: string) => void;
  addPlace: (dayId: string, place: Place) => void;
  removePlace: (dayId: string, placeId: string) => void;
  reorderPlaces: (dayId: string, fromIndex: number, toIndex: number) => void;
  movePlaceBetweenDays: (fromDayId: string, toDayId: string, placeId: string, toIndex: number) => void;
  setTransportMode: (mode: TransportMode) => void;
  setRoutes: (routes: Route[]) => void;
  upsertRoute: (route: Route) => void;
  invalidateRoutes: () => void;
  initDays: (count: number) => void;
};

const initialDay: Day = { id: "day-1", label: "Day 1", places: [] };

export const useTravelStore = createStore<TravelState>((set) => ({
  days: [initialDay],
  activeDayId: "day-1",
  transportMode: "walking",
  routes: [],
  routeVersion: 0,
  lastAddedPlace: null,

  addDay: () =>
    set((s) => {
      const n = s.days.length + 1;
      const id = `day-${Date.now()}`;
      return { days: [...s.days, { id, label: `Day ${n}`, places: [] }], activeDayId: id };
    }),

  removeDay: (dayId) =>
    set((s) => {
      const filtered = s.days.filter((d) => d.id !== dayId);
      // Re-label all days sequentially so gaps are closed (Day 1, Day 2, …)
      const days = filtered.map((d, i) => ({ ...d, label: `Day ${i + 1}` }));
      const activeDayId =
        s.activeDayId === dayId ? (days[0]?.id ?? null) : s.activeDayId;
      return { days, activeDayId };
    }),

  setActiveDay: (dayId) => set(() => ({ activeDayId: dayId })),

  addPlace: (dayId, place) =>
    set((s) => ({
      days: s.days.map((d) =>
        d.id === dayId
          ? { ...d, places: d.places.some((p) => p.placeId === place.placeId) ? d.places : [...d.places, place] }
          : d
      ),
      routeVersion: s.routeVersion + 1,
      lastAddedPlace: place,
    })),

  removePlace: (dayId, placeId) =>
    set((s) => ({
      days: s.days.map((d) =>
        d.id === dayId ? { ...d, places: d.places.filter((p) => p.placeId !== placeId) } : d
      ),
      routes: s.routes.filter((r) => r.from !== placeId && r.to !== placeId),
      routeVersion: s.routeVersion + 1,
    })),

  reorderPlaces: (dayId, fromIndex, toIndex) =>
    set((s) => ({
      days: s.days.map((d) => {
        if (d.id !== dayId) return d;
        const places = [...d.places];
        const [moved] = places.splice(fromIndex, 1);
        places.splice(toIndex, 0, moved);
        return { ...d, places };
      }),
      routeVersion: s.routeVersion + 1,
    })),

  movePlaceBetweenDays: (fromDayId, toDayId, placeId, toIndex) =>
    set((s) => {
      const fromDay = s.days.find((d) => d.id === fromDayId);
      const place = fromDay?.places.find((p) => p.placeId === placeId);
      if (!place) return s;
      return {
        days: s.days.map((d) => {
          if (d.id === fromDayId) return { ...d, places: d.places.filter((p) => p.placeId !== placeId) };
          if (d.id === toDayId) {
            const places = [...d.places];
            places.splice(toIndex, 0, place);
            return { ...d, places };
          }
          return d;
        }),
        // Invalidate routes involving the moved place
        routes: s.routes.filter((r) => r.from !== placeId && r.to !== placeId),
        routeVersion: s.routeVersion + 1,
      };
    }),

  setTransportMode: (mode) =>
    set((s) => ({
      transportMode: mode,
      // Keep stale routes visible until new ones arrive — just bump version to trigger re-fetch
      routeVersion: s.routeVersion + 1,
    })),

  setRoutes: (routes) => set(() => ({ routes })),

  upsertRoute: (route) =>
    set((s) => {
      const filtered = s.routes.filter((r) => !(r.from === route.from && r.to === route.to));
      return { routes: [...filtered, route] };
    }),

  invalidateRoutes: () =>
    set((s) => ({ routes: [], routeVersion: s.routeVersion + 1 })),

  initDays: (count) =>
    set(() => {
      const days = Array.from({ length: count }, (_, i) => ({
        id: `day-${i + 1}`,
        label: `Day ${i + 1}`,
        places: [] as Place[],
      }));
      return { days, activeDayId: days[0].id, routes: [], routeVersion: 0 };
    }),
}));
