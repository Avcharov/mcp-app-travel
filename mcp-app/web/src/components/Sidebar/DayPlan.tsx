import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Day } from "@/types.js";
import { useTravelStore } from "@/store/travelStore.js";
import { PlaceCard } from "./PlaceCard.js";

interface Props {
  day: Day;
  colorIndex: number;
}

export function DayPlan({ day, colorIndex }: Props) {
  const removePlace = useTravelStore((s) => s.removePlace);

  return (
    <div
      style={{ padding: "8px" }}
      data-llm={`${day.label}: ${day.places.map((p) => p.name).join(", ") || "no places"}`}
    >
      {/* Places list */}
      <div
        style={{
          minHeight: "40px",
        }}
      >
        <SortableContext
          items={day.places.map((p) => p.placeId)}
          strategy={verticalListSortingStrategy}
        >
          {day.places.map((place, i) => (
            <PlaceCard
              key={place.placeId}
              place={place}
              dayId={day.id}
              index={i}
              dayColorIndex={colorIndex}
              onRemove={(id) => removePlace(day.id, id)}
            />
          ))}
        </SortableContext>
        {day.places.length === 0 && (
          <div
            style={{
              padding: "20px 8px",
              textAlign: "center",
              color: "var(--color-text-secondary)",
              fontSize: "12px",
              border: "1px dashed var(--color-border)",
              borderRadius: "var(--radius-sm)",
              margin: "4px 0",
            }}
          >
            <div style={{ fontSize: "22px", marginBottom: "6px" }}>📍</div>
            <div style={{ fontWeight: 500, marginBottom: "2px" }}>No places yet</div>
            <div style={{ opacity: 0.7 }}>Use the search bar above to find and add places</div>
          </div>
        )}
      </div>
    </div>
  );
}
