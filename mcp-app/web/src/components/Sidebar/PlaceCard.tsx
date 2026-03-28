import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Place } from "@/types.js";

interface Props {
  place: Place;
  dayId: string;
  index: number;
  dayColorIndex: number;
  onRemove: (placeId: string) => void;
}

const DAY_COLORS = ["#1a73e8", "#e8710a", "#1e8e3e", "#a142f4", "#d93025", "#f29900"];

export function PlaceCard({ place, dayId, index, dayColorIndex, onRemove }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: place.placeId, data: { dayId, index } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const color = DAY_COLORS[dayColorIndex % DAY_COLORS.length];

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-llm={`Place ${index + 1}: ${place.name}, ${place.address}`}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 12px",
          background: "var(--color-surface)",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--color-border)",
          margin: "4px 0",
        }}
      >
        {/* Drag handle */}
        <span
          {...attributes}
          {...listeners}
          style={{
            cursor: "grab",
            color: "var(--color-text-secondary)",
            fontSize: "16px",
            lineHeight: 1,
            flexShrink: 0,
            userSelect: "none",
          }}
          aria-label="Drag to reorder"
        >
          ⠿
        </span>
        {/* Order badge */}
        <span
          style={{
            background: color,
            color: "#fff",
            borderRadius: "50%",
            width: "20px",
            height: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {index + 1}
        </span>
        {/* Name + address */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 500,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {place.name}
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "var(--color-text-secondary)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {place.address}
          </div>
        </div>
        {/* Remove button */}
        <button
          onClick={() => onRemove(place.placeId)}
          aria-label={`Remove ${place.name}`}
          style={{
            color: "var(--color-text-secondary)",
            fontSize: "14px",
            lineHeight: 1,
            padding: "2px 4px",
            borderRadius: "var(--radius-sm)",
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
