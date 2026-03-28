import "@/index.css";

import { useEffect, useRef } from "react";
import { mountWidget, useDisplayMode } from "skybridge/web";
import { useToolInfo, useCallTool } from "@/helpers.js";
import { useTravelStore } from "@/store/travelStore.js";
import { AppLayout } from "@/components/Layout/AppLayout.js";
import { Sidebar } from "@/components/Sidebar/Sidebar.js";
import { TravelMap } from "@/components/Map/TravelMap.js";
import type { Place } from "@/types.js";

function PlanTravel() {
  const { input, responseMetadata } = useToolInfo<"plan-travel">();
  const [, setDisplayMode] = useDisplayMode();
  const days = useTravelStore((s) => s.days);
  const initDays = useTravelStore((s) => s.initDays);
  const addPlace = useTravelStore((s) => s.addPlace);
  const setBulkLoading = useTravelStore((s) => s.setBulkLoading);
  const { callToolAsync } = useCallTool("search-places");

  const apiKey =
    (responseMetadata as { googleMapsApiKey?: string } | null)
      ?.googleMapsApiKey ?? "";

  const callToolRef = useRef(callToolAsync);
  callToolRef.current = callToolAsync;

  const resolvedRef = useRef(false);

  // Go fullscreen immediately and initialise days from input
  useEffect(() => {
    setDisplayMode("fullscreen");

    const placesPerDay = (input as { places?: string[][] | null })?.places;
    const dayCount = placesPerDay ? placesPerDay.length : (input?.days ?? 1);
    initDays(dayCount);

    // If the LLM provided places, resolve each and add to the correct day
    if (placesPerDay && !resolvedRef.current) {
      resolvedRef.current = true;
      resolvePlaces(placesPerDay);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function resolvePlaces(placesPerDay: string[][]) {
    // Wait briefly for initDays to flush so day IDs are available
    await new Promise((r) => setTimeout(r, 50));

    setBulkLoading(true);
    const dayIds = useTravelStore.getState().days.map((d) => d.id);

    for (let dayIdx = 0; dayIdx < placesPerDay.length; dayIdx++) {
      const dayId = dayIds[dayIdx];
      if (!dayId) continue;

      for (const placeName of placesPerDay[dayIdx]) {
        try {
          const result = await callToolRef.current({ query: placeName });
          const places =
            (result.structuredContent as { places?: Place[] } | undefined)
              ?.places ?? [];
          if (places.length > 0) {
            addPlace(dayId, places[0]);
          }
        } catch {
          // Skip unresolvable places
        }
      }
    }

    setBulkLoading(false);
  }

  // LLM-visible summary of the full itinerary
  const itinerarySummary = days
    .map(
      (d) =>
        `${d.label}: ${
          d.places.length > 0
            ? d.places.map((p) => p.name).join(" → ")
            : "empty"
        }`
    )
    .join("; ");

  return (
    <div
      data-llm={`Travel planner. Itinerary: ${itinerarySummary}`}
      style={{ height: "100%", width: "100%" }}
    >
      <AppLayout sidebar={<Sidebar />} map={<TravelMap apiKey={apiKey} />} />
    </div>
  );
}

export default PlanTravel;

mountWidget(<PlanTravel />);
