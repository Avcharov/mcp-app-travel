import { useTravelStore } from "@/store/travelStore.js";
import type { Place } from "@/types.js";

interface Props {
  results: Place[];
  onClear: () => void;
}

export function SearchResults({ results, onClear }: Props) {
  const activeDayId = useTravelStore((s) => s.activeDayId);
  const addPlace = useTravelStore((s) => s.addPlace);

  if (results.length === 0) return null;

  return (
    <div
      style={{
        borderBottom: "1px solid var(--color-border)",
        maxHeight: "240px",
        overflowY: "auto",
      }}
      data-llm={`Search results: ${results.length} places found`}
    >
      {results.map((place) => (
        <button
          key={place.placeId}
          onClick={() => {
            if (activeDayId) {
              addPlace(activeDayId, place);
              onClear();
            }
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            padding: "10px 12px",
            textAlign: "left",
            borderBottom: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "var(--color-bg-secondary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "var(--color-surface)";
          }}
        >
          <span style={{ fontWeight: 500 }}>{place.name}</span>
          <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
            {place.address}
          </span>

        </button>
      ))}
    </div>
  );
}
