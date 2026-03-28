import { useState, useCallback } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";

import { useTravelStore } from "@/store/travelStore.js";
import { SearchBar } from "./SearchBar.js";
import { SearchResults } from "./SearchResults.js";
import { DayPlan } from "./DayPlan.js";
import type { Place } from "@/types.js";

const DAY_COLORS = ["#4f8ef7", "#e06c4a", "#3bbf7a", "#c46bb5", "#e0a827", "#3bc6c6"];

export function Sidebar() {
  const days = useTravelStore((s) => s.days);
  const activeDayId = useTravelStore((s) => s.activeDayId);
  const addDay = useTravelStore((s) => s.addDay);
  const removeDay = useTravelStore((s) => s.removeDay);
  const setActiveDay = useTravelStore((s) => s.setActiveDay);
  const reorderPlaces = useTravelStore((s) => s.reorderPlaces);

  const [searchResults, setSearchResults] = useState<Place[]>([]);

  const handleSearchResults = useCallback((places: Place[]) => {
    setSearchResults(places);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchResults([]);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const dayId = active.data.current?.dayId as string | undefined;
    if (!dayId) return;
    const day = days.find((d) => d.id === dayId);
    if (!day) return;
    const oldIndex = day.places.findIndex((p) => p.placeId === active.id);
    const newIndex = day.places.findIndex((p) => p.placeId === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      reorderPlaces(dayId, oldIndex, newIndex);
    }
  };

  const activeDay = days.find((d) => d.id === activeDayId);
  const activeDayIndex = days.findIndex((d) => d.id === activeDayId);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        background: "var(--color-bg)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 14px 10px",
          borderBottom: "1px solid var(--color-border)",
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: "15px", color: "var(--color-text)" }}>
          Travel Planner
        </span>
      </div>

      {/* Day pills */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "10px 12px",
          overflowX: "auto",
          flexShrink: 0,
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        {days.map((day, i) => {
          const color = DAY_COLORS[i % DAY_COLORS.length];
          const isActive = day.id === activeDayId;
          return (
            <button
              key={day.id}
              onClick={() => setActiveDay(day.id)}
              style={{
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 10px 5px 14px",
                borderRadius: "999px",
                border: `2px solid ${color}`,
                background: isActive ? color : "transparent",
                color: isActive ? "#fff" : color,
                fontWeight: 600,
                fontSize: "12px",
                cursor: "pointer",
                transition: "background 0.15s, color 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {day.label}
              {days.length > 1 && (
                <span
                  role="button"
                  aria-label={`Remove ${day.label}`}
                  onClick={(e) => { e.stopPropagation(); removeDay(day.id); }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    background: isActive ? "rgba(255,255,255,0.35)" : `${color}33`,
                    color: isActive ? "#fff" : color,
                    fontSize: "10px",
                    lineHeight: 1,
                    cursor: "pointer",
                  }}
                >
                  ×
                </span>
              )}
            </button>
          );
        })}
        <button
          onClick={addDay}
          style={{
            flexShrink: 0,
            padding: "5px 12px",
            borderRadius: "999px",
            border: "2px dashed var(--color-border)",
            background: "transparent",
            color: "var(--color-text-secondary)",
            fontWeight: 600,
            fontSize: "12px",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          + Day
        </button>
      </div>

      {/* Search — always visible, adds to active day */}
      <div style={{ flexShrink: 0 }}>
        <SearchBar onResults={handleSearchResults} />
        <SearchResults results={searchResults} onClear={handleClearSearch} />
      </div>

      {/* Active day places */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {activeDay ? (
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <DayPlan day={activeDay} colorIndex={activeDayIndex} />
          </DndContext>
        ) : (
          <div style={{ padding: "24px", textAlign: "center", color: "var(--color-text-secondary)", fontSize: "13px" }}>
            Select a day to view places
          </div>
        )}
      </div>
    </div>
  );
}
