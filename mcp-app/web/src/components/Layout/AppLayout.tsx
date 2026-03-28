import type { ReactNode } from "react";

interface Props {
  sidebar: ReactNode;
  map: ReactNode;
}

export function AppLayout({ sidebar, map }: Props) {
  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        width: "100%",
        overflow: "hidden",
        background: "var(--color-bg)",
      }}
    >
      <aside
        style={{
          width: "var(--sidebar-width)",
          minWidth: "var(--sidebar-width)",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid var(--color-border)",
          background: "var(--color-bg)",
          overflow: "hidden",
        }}
      >
        {sidebar}
      </aside>
      <main
        style={{
          flex: 1,
          height: "100%",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {map}
      </main>
    </div>
  );
}
