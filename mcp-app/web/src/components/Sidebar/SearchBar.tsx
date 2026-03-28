import { useState, useEffect, useRef } from "react";
import { useCallTool } from "@/helpers.js";
import type { Place } from "@/types.js";

interface Props {
  onResults: (places: Place[]) => void;
}

export function SearchBar({ onResults }: Props) {
  const { callTool: search, data } = useCallTool("search-places");
  const [query, setQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const places = (data?.structuredContent as { places?: Place[] } | undefined)?.places ?? [];
    onResults(places);
  }, [data, onResults]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) {
      onResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => search({ query: val }), 400);
  };

  return (
    <div
      style={{
        padding: "12px",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <input
        type="search"
        value={query}
        onChange={handleChange}
        placeholder="Search places…"
        aria-label="Search places"
        style={{
          width: "100%",
          padding: "8px 12px",
          borderRadius: "var(--radius)",
          border: "1px solid var(--color-border)",
          background: "var(--color-bg-secondary)",
          outline: "none",
          fontSize: "14px",
        }}
      />
    </div>
  );
}
