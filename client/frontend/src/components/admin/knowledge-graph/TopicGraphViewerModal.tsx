import React, { useState, useEffect, useRef, useMemo } from "react";
import { X, Network, RefreshCw, AlertCircle } from "lucide-react";
import AxiosInstance from "@/api/axiosInstance";
import GraphCanvas, { GraphCanvasRef } from "./GraphCanvas";
import GraphToolbar from "./GraphToolbar";
import GraphEntityDetailsSidebar, { GraphNodeData, GraphEdgeData } from "./GraphEntityDetailsSidebar";

interface TopicGraphViewerModalProps {
  topicId: string;
  topicName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const TopicGraphViewerModal: React.FC<TopicGraphViewerModalProps> = ({
  topicId,
  topicName,
  isOpen,
  onClose,
}) => {
  const canvasRef = useRef<GraphCanvasRef | null>(null);

  // Raw graph payload from API
  const [nodes, setNodes] = useState<GraphNodeData[]>([]);
  const [edges, setEdges] = useState<GraphEdgeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected elements
  const [selectedNode, setSelectedNode] = useState<GraphNodeData | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdgeData | null>(null);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntityType, setSelectedEntityType] = useState("");
  const [selectedRelType, setSelectedRelType] = useState("");
  const [hideUnrelated, setHideUnrelated] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const modalContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen && topicId) {
      loadGraphData();
    }
  }, [isOpen, topicId]);

  const loadGraphData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await AxiosInstance.get(`/topics/${topicId}/graph`);
      if (res.data.success) {
        const rawNodes = res.data.data.nodes || [];
        const rawEdges = res.data.data.edges || [];

        // If backend returned raw entities/relationships without nodes array, fallback construct
        if (rawNodes.length === 0 && res.data.data.entities?.length) {
          const constructedNodes: GraphNodeData[] = res.data.data.entities.map((e: any, idx: number) => ({
            id: `entity_${idx}`,
            name: e.name,
            label: e.name,
            type: e.type || "RESOURCE",
            metadata: { entityId: `entity_${idx}`, type: e.type, label: e.name },
          }));
          const constructedEdges: GraphEdgeData[] = res.data.data.relationships.map((r: any, idx: number) => ({
            id: `edge_${idx}`,
            source: r.source,
            target: r.target,
            sourceName: r.source,
            targetName: r.target,
            relationship: r.type || "RELATED_TO",
          }));
          setNodes(constructedNodes);
          setEdges(constructedEdges);
        } else {
          setNodes(rawNodes);
          setEdges(rawEdges);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load graph structure for topic");
    } finally {
      setLoading(false);
    }
  };

  // Filtered lists
  const availableEntityTypes = useMemo(() => {
    return [...new Set(nodes.map((n) => n.type).filter(Boolean))];
  }, [nodes]);

  const availableRelTypes = useMemo(() => {
    return [...new Set(edges.map((e) => (e.relationship || e.type) as string).filter(Boolean))];
  }, [edges]);

  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      if (selectedEntityType && node.type !== selectedEntityType) return false;
      return true;
    });
  }, [nodes, selectedEntityType]);

  const filteredEdges = useMemo(() => {
    return edges.filter((edge) => {
      if (selectedRelType && (edge.relationship || edge.type) !== selectedRelType) return false;
      return true;
    });
  }, [edges, selectedRelType]);

  const toggleFullscreen = () => {
    if (!modalContainerRef.current) return;
    if (!document.fullscreenElement) {
      modalContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => null);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
      <div
        ref={modalContainerRef}
        className="w-full max-w-7xl h-[90vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col relative"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Network size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                Knowledge Graph
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {topicName}
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Interactive entity-relationship visualization for GraphRAG
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadGraphData}
              className="p-2 rounded-lg border border-input hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Refresh Graph"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg border border-input hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Close Modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <GraphToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedEntityType={selectedEntityType}
          onEntityTypeChange={setSelectedEntityType}
          availableEntityTypes={availableEntityTypes}
          selectedRelType={selectedRelType}
          onRelTypeChange={setSelectedRelType}
          availableRelTypes={availableRelTypes}
          hideUnrelated={hideUnrelated}
          onToggleHideUnrelated={() => setHideUnrelated(!hideUnrelated)}
          onZoomIn={() => canvasRef.current?.zoomIn()}
          onZoomOut={() => canvasRef.current?.zoomOut()}
          onFitScreen={() => canvasRef.current?.fitToScreen()}
          onResetLayout={() => canvasRef.current?.resetLayout()}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          totalNodes={nodes.length}
          filteredNodesCount={filteredNodes.length}
        />

        {/* Main Workspace Body */}
        <div className="flex-1 flex relative overflow-hidden bg-background">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <RefreshCw className="animate-spin text-primary" size={32} />
              <p className="text-xs font-medium">Extracting graph structure for "{topicName}"...</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <AlertCircle className="text-destructive mb-2" size={36} />
              <p className="text-sm font-semibold text-foreground mb-1">Graph Load Error</p>
              <p className="text-xs text-muted-foreground max-w-md">{error}</p>
            </div>
          ) : nodes.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <Network className="text-muted-foreground/30 mb-3" size={48} />
              <p className="text-sm font-semibold text-foreground mb-1">No Graph Nodes Extracted</p>
              <p className="text-xs text-muted-foreground max-w-md">
                No entities or relationships have been indexed for this topic yet.
              </p>
            </div>
          ) : (
            <>
              {/* Canvas Renderer */}
              <div className="flex-1 h-full relative">
                <GraphCanvas
                  ref={canvasRef}
                  nodes={filteredNodes}
                  edges={filteredEdges}
                  selectedNode={selectedNode}
                  selectedEdge={selectedEdge}
                  searchQuery={searchQuery}
                  hideUnrelated={hideUnrelated}
                  onSelectNode={(node) => {
                    setSelectedNode(node);
                    if (node) setSelectedEdge(null);
                  }}
                  onSelectEdge={(edge) => {
                    setSelectedEdge(edge);
                    if (edge) setSelectedNode(null);
                  }}
                />
              </div>

              {/* Side Details Panel */}
              {(selectedNode || selectedEdge) && (
                <GraphEntityDetailsSidebar
                  selectedNode={selectedNode}
                  selectedEdge={selectedEdge}
                  topicName={topicName}
                  allNodes={nodes}
                  allEdges={edges}
                  onSelectNode={(n) => {
                    setSelectedNode(n);
                    setSelectedEdge(null);
                  }}
                  onClose={() => {
                    setSelectedNode(null);
                    setSelectedEdge(null);
                  }}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopicGraphViewerModal;
