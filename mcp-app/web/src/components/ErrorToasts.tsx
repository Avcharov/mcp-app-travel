import { useEffect, useRef } from "react";
import { useTravelStore } from "@/store/travelStore.js";

export function ErrorToasts() {
  const errors = useTravelStore((s) => s.errors);
  const dismissError = useTravelStore((s) => s.dismissError);

  return (
    <div style={containerStyle}>
      {errors.map((err) => (
        <Toast key={err.id} id={err.id} message={err.message} onDismiss={dismissError} />
      ))}
    </div>
  );
}

function Toast({ id, message, onDismiss }: { id: string; message: string; onDismiss: (id: string) => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(id), 8000);
    return () => clearTimeout(timerRef.current);
  }, [id, onDismiss]);

  return (
    <div style={toastStyle}>
      <span style={msgStyle}>{message}</span>
      <button onClick={() => onDismiss(id)} style={closeStyle} aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  position: "fixed",
  bottom: 16,
  right: 16,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  zIndex: 9999,
  maxWidth: 420,
};

const toastStyle: React.CSSProperties = {
  background: "#d32f2f",
  color: "#fff",
  padding: "10px 14px",
  borderRadius: 8,
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  fontSize: 13,
  lineHeight: 1.4,
  wordBreak: "break-word",
};

const msgStyle: React.CSSProperties = { flex: 1 };

const closeStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#fff",
  cursor: "pointer",
  fontSize: 14,
  padding: 0,
  lineHeight: 1,
  flexShrink: 0,
};
