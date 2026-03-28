import type { TransportMode } from "@/types.js";
import { useTravelStore } from "@/store/travelStore.js";

const MODES: { mode: TransportMode; icon: string; label: string }[] = [
  { mode: "WALK", icon: "🚶", label: "Walk" },
  { mode: "BICYCLE", icon: "🚲", label: "Bicycle" },
  { mode: "TRANSIT", icon: "🚌", label: "Transit" },
  { mode: "DRIVE", icon: "🚗", label: "Drive" },
];

function formatDuration(raw: string): string {
  const match = raw.match(/(\d+)/);
  if (!match) return raw;
  const totalMin = Math.round(Number(match[1]) / 60);
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

interface Props {
  fromPlaceId: string;
  toPlaceId: string;
}

export function SegmentModePicker({ fromPlaceId, toPlaceId }: Props) {
  const segmentKey = `${fromPlaceId}::${toPlaceId}`;
  const globalMode = useTravelStore((s) => s.transportMode);
  const activeMode = useTravelStore((s) => s.segmentModes[segmentKey]) ?? globalMode;
  const setSegmentMode = useTravelStore((s) => s.setSegmentMode);
  const routes = useTravelStore((s) => s.routes);

  const route = routes.find((r) => r.from === fromPlaceId && r.to === toPlaceId);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "2px 12px 2px 40px",
      }}
    >
      {/* Connector line */}
      <div
        style={{
          position: "relative",
          width: "2px",
          height: "24px",
          background: "var(--color-border)",
          marginLeft: "-24px",
          marginRight: "6px",
          flexShrink: 0,
        }}
      />

      {/* Mode buttons */}
      <div style={{ display: "flex", gap: "2px" }}>
        {MODES.map(({ mode, icon, label }) => {
          const isActive = activeMode === mode;
          return (
            <button
              key={mode}
              onClick={() => setSegmentMode(fromPlaceId, toPlaceId, mode)}
              aria-pressed={isActive}
              title={label}
              style={{
                padding: "2px 5px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid",
                borderColor: isActive ? "var(--color-primary)" : "transparent",
                background: isActive ? "var(--color-primary)" : "transparent",
                color: isActive ? "#fff" : "var(--color-text-secondary)",
                fontSize: "12px",
                lineHeight: 1,
                cursor: "pointer",
                transition: "all 0.15s",
                opacity: isActive ? 1 : 0.6,
              }}
            >
              {icon}
            </button>
          );
        })}
      </div>

      {/* Duration/distance info */}
      {route && (
        <span
          style={{
            fontSize: "10px",
            color: "var(--color-text-secondary)",
            whiteSpace: "nowrap",
          }}
        >
          {formatDuration(route.duration)}{route.distance ? ` · ${route.distance}` : ""}
        </span>
      )}
    </div>
  );
}
