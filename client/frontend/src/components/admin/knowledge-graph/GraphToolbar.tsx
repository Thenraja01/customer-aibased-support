import React from "react";
import { Search, ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw, EyeOff } from "lucide-react";

interface GraphToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedEntityType: string;
  onEntityTypeChange: (type: string) => void;
  availableEntityTypes: string[];
  selectedRelType: string;
  onRelTypeChange: (rel: string) => void;
  availableRelTypes: string[];
  hideUnrelated: boolean;
  onToggleHideUnrelated: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitScreen: () => void;
  onResetLayout: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  totalNodes: number;
  filteredNodesCount: number;
}

export const GraphToolbar: React.FC<GraphToolbarProps> = ({
  searchQuery,
  onSearchChange,
  selectedEntityType,
  onEntityTypeChange,
  availableEntityTypes,
  selectedRelType,
  onRelTypeChange,
  availableRelTypes,
  hideUnrelated,
  onToggleHideUnrelated,
  onZoomIn,
  onZoomOut,
  onFitScreen,
  onResetLayout,
  isFullscreen,
  onToggleFullscreen,
  totalNodes,
  filteredNodesCount,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-b border-border bg-card/90 backdrop-blur-md z-10 shrink-0 text-xs">
      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search entities..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Entity Type Filter */}
        <select
          value={selectedEntityType}
          onChange={(e) => onEntityTypeChange(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All Entity Types</option>
          {availableEntityTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {/* Relationship Type Filter */}
        <select
          value={selectedRelType}
          onChange={(e) => onRelTypeChange(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All Relations</option>
          {availableRelTypes.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        {/* Hide Unrelated Toggles */}
        <button
          type="button"
          onClick={onToggleHideUnrelated}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
            hideUnrelated
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-input hover:bg-muted text-muted-foreground"
          }`}
          title="Hide unconnected nodes when selecting"
        >
          <EyeOff size={13} />
          <span>Hide Unrelated</span>
        </button>

        <span className="text-[11px] text-muted-foreground ml-1 font-medium">
          Showing {filteredNodesCount} of {totalNodes} nodes
        </span>
      </div>

      {/* Viewport Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onZoomIn}
          className="p-1.5 rounded-lg border border-input bg-background hover:bg-muted text-foreground transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={onZoomOut}
          className="p-1.5 rounded-lg border border-input bg-background hover:bg-muted text-foreground transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={14} />
        </button>
        <button
          onClick={onFitScreen}
          className="px-2 py-1.5 rounded-lg border border-input bg-background hover:bg-muted text-foreground transition-colors text-[11px] font-medium"
          title="Fit graph to screen"
        >
          Fit Screen
        </button>
        <button
          onClick={onResetLayout}
          className="p-1.5 rounded-lg border border-input bg-background hover:bg-muted text-foreground transition-colors"
          title="Reset force layout"
        >
          <RotateCcw size={14} />
        </button>
        <button
          onClick={onToggleFullscreen}
          className="p-1.5 rounded-lg border border-input bg-background hover:bg-muted text-foreground transition-colors ml-1"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>
    </div>
  );
};

export default GraphToolbar;
