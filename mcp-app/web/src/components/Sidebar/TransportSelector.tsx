import type { TransportMode } from "@/types.js";
import { useTravelStore } from "@/store/travelStore.js";

const MODES: { mode: TransportMode; label: string; icon: string }[] = [
  { mode: "WALK", label: "Walk", icon: "🚶" },
  { mode: "BICYCLE", label: "Bicycle", icon: "🚲" },
  { mode: "TRANSIT", label: "Transit", icon: "🚌" },
  { mode: "DRIVE", label: "Drive", icon: "🚗" },
  { mode: "TWO_WHEELER", label: "Moto", icon: "🛵" },
];

export function TransportSelector() {
  const transportMode = useTravelStore((s) => s.transportMode);
  const setTransportMode = useTravelStore((s) => s.setTransportMode);

  return (
    <div
      style={{
        display: "flex",
        gap: "4px",
        padding: "8px 12px",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {MODES.map(({ mode, label, icon }) => (
        <button
          key={mode}
          onClick={() => setTransportMode(mode)}
          aria-pressed={transportMode === mode}
          title={label}
          style={{
            flex: 1,
            padding: "6px 4px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--color-border)",
            background: transportMode === mode ? "var(--color-primary)" : "var(--color-bg-secondary)",
            color: transportMode === mode ? "#fff" : "var(--color-text)",
            fontSize: "13px",
            fontWeight: transportMode === mode ? 600 : 400,
            transition: "all 0.15s",
          }}
        >
          {icon} {label}
        </button>
      ))}
    </div>
  );
}
