/**
 * ResizableHandle Component (island)
 * Self-contained draggable separator. Reads/writes shared panel width
 * through the layout store so the task list island reacts independently.
 */

import { useEffect, useRef } from "react";
import { useStore } from "@nanostores/react";
import {
  $isResizing,
  $areasIsResizing,
  $leftPanelWidth,
  $areasPanelWidth,
  loadLeftPanelWidth,
  loadAreasPanelWidth,
  setLeftPanelWidth,
  setAreasPanelWidth,
  saveLeftPanelWidth,
  saveAreasPanelWidth,
  setIsResizing,
  setAreasIsResizing,
  MIN_LEFT_WIDTH,
  MAX_LEFT_WIDTH,
  MIN_AREAS_PANEL_WIDTH,
  MAX_AREAS_PANEL_WIDTH,
} from "../../stores/layoutStore";
import { GripVertical } from "lucide-react";

export function ResizableHandle({ area = false }: { area?: boolean }) {
  const isResizing = useStore(area ? $areasIsResizing : $isResizing);
  const panelWidth = useStore(area ? $areasPanelWidth : $leftPanelWidth);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const bodyClassesApplied = useRef(false);

  // Restore the user's preferred width on mount
  useEffect(() => {
    if (area) loadAreasPanelWidth();
    else loadLeftPanelWidth();
  }, [area]);

  // Toggle body resize helpers
  useEffect(() => {
    if (isResizing) {
      document.body.classList.add("resize-cursor-active", "resize-no-select");
      bodyClassesApplied.current = true;
    } else if (bodyClassesApplied.current) {
      document.body.classList.remove(
        "resize-cursor-active",
        "resize-no-select",
      );
      bodyClassesApplied.current = false;
    }
  }, [isResizing]);

  // Drag listeners while resizing
  useEffect(() => {
    if (!isResizing) return;

    const onMove = (e: MouseEvent) => {
      const nextWidth = startWidth.current + (e.clientX - startX.current);
      if (area) setAreasPanelWidth(nextWidth);
      else setLeftPanelWidth(nextWidth);
    };
    const onUp = () => {
      if (area) saveAreasPanelWidth();
      else saveLeftPanelWidth();
      if (area) setAreasIsResizing(false);
      else setIsResizing(false);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [area, isResizing]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startX.current = e.clientX;
    startWidth.current = panelWidth;
    if (area) setAreasIsResizing(true);
    else setIsResizing(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const current = panelWidth;
    const minWidth = area ? MIN_AREAS_PANEL_WIDTH : MIN_LEFT_WIDTH;
    const maxWidth = area ? MAX_AREAS_PANEL_WIDTH : MAX_LEFT_WIDTH;
    let next: number | null = null;

    if (e.key === "ArrowLeft") next = current - 10;
    else if (e.key === "ArrowRight") next = current + 10;
    else if (e.key === "Home") next = minWidth;
    else if (e.key === "End") next = maxWidth;

    if (next !== null) {
      e.preventDefault();
      if (area) {
        setAreasPanelWidth(next);
        saveAreasPanelWidth();
      } else {
        setLeftPanelWidth(next);
        saveLeftPanelWidth();
      }
    }
  };

  return (
    <div
      className={`
        relative flex items-center justify-center group cursor-col-resize shrink-0 w-[18px] bg-theme-border
        transition-colors duration-200
        focus-visible:ring-2 focus-visible:ring-theme-accent focus-visible:ring-offset-2
        ${isResizing ? "bg-theme-accent/25" : "hover:bg-theme-accent/20"}
      `}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="separator"
      aria-orientation="vertical"
      aria-label="Redimensionar painéis - use setas do teclado ou arraste"
      title="Arraste para redimensionar os painéis ou use as setas do teclado"
    >
      {/* Invisible hit area for easier grabbing */}
      <div className="absolute inset-y-0 -left-2 -right-2 cursor-col-resize" />

      {/* Visual grip indicator (stays inside the fixed-width strip) */}
      <div
        className={`
          absolute inset-y-0 flex items-center justify-center
          transition-opacity duration-200
          ${isResizing ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
        `}
      >
        <GripVertical
          className={`
            w-4 h-4 transition-colors duration-200
            ${isResizing ? "text-theme-accent" : "text-theme-muted/60 group-hover:text-theme-accent/80"}
          `}
        />
      </div>

      {/* Focus indicator */}
      <div
        className={`
          absolute inset-0 rounded-sm transition-all duration-200
        `}
      />
    </div>
  );
}
