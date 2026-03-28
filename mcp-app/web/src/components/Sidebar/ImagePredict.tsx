import { useRef, useCallback, useState, useEffect } from "react";
import { useCallTool } from "@/helpers.js";
import { useTravelStore } from "@/store/travelStore.js";
import type { PredictionResult } from "@/types.js";

export function ImagePredict() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { callTool: predict, data } = useCallTool("predict-places");
  const [loading, setLoading] = useState(false);

  const activeDayId = useTravelStore((s) => s.activeDayId);
  const addPlace = useTravelStore((s) => s.addPlace);
  const upsertRoute = useTravelStore((s) => s.upsertRoute);
  const setBulkLoading = useTravelStore((s) => s.setBulkLoading);

  // Process prediction results when data arrives
  useEffect(() => {
    const predictions =
      (data?.structuredContent as { predictions?: PredictionResult[] } | undefined)
        ?.predictions ?? [];
    if (predictions.length === 0 || !activeDayId) return;

    setBulkLoading(true);
    for (const pred of predictions) {
      addPlace(activeDayId, pred.origin);
      if (pred.destination) {
        addPlace(activeDayId, pred.destination);
      }
      if (pred.route) {
        upsertRoute(pred.route);
      }
    }
    setBulkLoading(false);
    setLoading(false);
  }, [data, activeDayId, addPlace, upsertRoute, setBulkLoading]);

  const resizeAndEncode = (file: File, maxDim = 800, quality = 0.7): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl.split(",")[1] ?? dataUrl);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
      img.src = url;
    });

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || !activeDayId) return;

      setLoading(true);
      try {
        const images = await Promise.all(
          Array.from(files).map((f) => resizeAndEncode(f)),
        );
        await predict({ images });
      } catch {
        setLoading(false);
      }
      // Reset input so the same file(s) can be re-selected
      if (inputRef.current) inputRef.current.value = "";
    },
    [activeDayId, predict],
  );

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading || !activeDayId}
        title="Predict places from images"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          height: "28px",
          borderRadius: "var(--radius)",
          border: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          cursor: loading || !activeDayId ? "default" : "pointer",
          opacity: loading ? 0.5 : 1,
          transition: "background 0.15s",
          fontSize: "12px",
          lineHeight: 1,
          padding: "0 8px",
          color: "var(--color-text-secondary)",
          whiteSpace: "nowrap",
        }}
      >
        {loading ? (
          <span
            style={{
              display: "inline-block",
              width: "14px",
              height: "14px",
              border: "2px solid var(--color-border)",
              borderTopColor: "var(--color-text)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
        ) : (
          <span style={{ fontSize: "15px", lineHeight: 1 }}>📷</span>
        )}
        <span>{loading ? "Predicting…" : "Predict from photos"}</span>
      </button>
    </>
  );
}
