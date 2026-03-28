import "@/index.css";

import { useEffect } from "react";
import { mountWidget, useDisplayMode } from "skybridge/web";
import { useToolInfo } from "@/helpers.js";
import { useTravelStore } from "@/store/travelStore.js";
import { AppLayout } from "@/components/Layout/AppLayout.js";
import { Sidebar } from "@/components/Sidebar/Sidebar.js";
import { TravelMap } from "@/components/Map/TravelMap.js";

function PlanTravel() {
  const { input, responseMetadata } = useToolInfo<"plan-travel">();
  const [, setDisplayMode] = useDisplayMode();
  const days = useTravelStore((s) => s.days);
  const initDays = useTravelStore((s) => s.initDays);

  const apiKey = (responseMetadata as { googleMapsApiKey?: string } | null)?.googleMapsApiKey ?? "";

  // Go fullscreen immediately and initialise days from input
  useEffect(() => {
    setDisplayMode("fullscreen");
    initDays(input?.days ?? 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // LLM-visible summary of the full itinerary
  const itinerarySummary = days
    .map(
      (d) =>
        `${d.label}: ${d.places.length > 0 ? d.places.map((p) => p.name).join(" → ") : "empty"}`,
    )
    .join("; ");

  return (
    <div
      data-llm={`Travel planner. Itinerary: ${itinerarySummary}`}
      style={{ height: "100%", width: "100%" }}
    >
      <AppLayout
        sidebar={<Sidebar />}
        map={<TravelMap apiKey={apiKey} />}
      />
    </div>
  );
}

export default PlanTravel;

mountWidget(<PlanTravel />);
