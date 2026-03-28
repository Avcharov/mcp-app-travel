import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Day } from "@/types.js";
import { useTravelStore } from "@/store/travelStore.js";
import { PlaceCard } from "./PlaceCard.js";
import { SegmentModePicker } from "./SegmentModePicker.js";

interface Props {
  day: Day;
  colorIndex: number;
  globalStartIndex: number;
  prevDay?: Day;
  nextDay?: Day;
}

export function DayPlan({ day, colorIndex, globalStartIndex, prevDay, nextDay }: Props) {
  const removePlace = useTravelStore((s) => s.removePlace);

  const prevLast = prevDay?.places.at(-1);
  const firstPlace = day.places[0];
  const lastPlace = day.places.at(-1);
  const nextFirst = nextDay?.places[0];

  return (
    <div
      style={{ padding: "8px" }}
      data-llm={`${day.label}: ${day.places.map((p) => p.name).join(", ") || "no places"}`}
    >
      {/* Places list */}
      {/* Incoming connection from previous day */}
      {prevLast && firstPlace && (
        <div style={{ padding: "0 4px 4px", opacity: 0.85 }}>
          <div style={{ fontSize: "10px", color: "var(--color-text-secondary)", marginBottom: "2px", textAlign: "center" }}>
            From {prevDay!.label}: {prevLast.name}
          </div>
          <SegmentModePicker fromPlaceId={prevLast.placeId} toPlaceId={firstPlace.placeId} />
        </div>
      )}

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
            <div key={place.placeId}>
              <PlaceCard
                place={place}
                dayId={day.id}
                index={globalStartIndex + i}
                dayColorIndex={colorIndex}
                onRemove={(id) => removePlace(day.id, id)}
              />
              {i < day.places.length - 1 && (
                <SegmentModePicker
                  fromPlaceId={place.placeId}
                  toPlaceId={day.places[i + 1].placeId}
                />
              )}
            </div>
          ))}
        </SortableContext>
      </div>

      {/* Outgoing connection to next day */}
      {lastPlace && nextFirst && (
        <div style={{ padding: "4px 4px 0", opacity: 0.85 }}>
          <SegmentModePicker fromPlaceId={lastPlace.placeId} toPlaceId={nextFirst.placeId} />
          <div style={{ fontSize: "10px", color: "var(--color-text-secondary)", marginTop: "2px", textAlign: "center" }}>
            To {nextDay!.label}: {nextFirst.name}
          </div>
        </div>
      )}

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
  );
}
