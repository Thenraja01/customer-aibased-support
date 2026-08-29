import React from "react";
import { X, ArrowUpRight, ArrowDownLeft, Network } from "lucide-react";

export interface GraphNodeData {
  id: string;
  name: string;
  label: string;
  type: string;
  metadata?: {
    entityId?: string;
    type?: string;
    label?: string;
    sourceDocumentId?: string;
    sourceDocumentTitle?: string;
    sourceChunkId?: string;
    properties?: Record<string, any>;
  };
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  sourceName?: string;
  targetName?: string;
  relationship: string;
  type?: string;
  confidence?: number;
  documentId?: string;
  documentTitle?: string;
}

interface GraphEntityDetailsSidebarProps {
  selectedNode: GraphNodeData | null;
  selectedEdge: GraphEdgeData | null;
  topicName?: string;
  allEdges: GraphEdgeData[];
  allNodes: GraphNodeData[];
  onSelectNode: (node: GraphNodeData) => void;
  onClose: () => void;
}

export const GraphEntityDetailsSidebar: React.FC<GraphEntityDetailsSidebarProps> = ({
  selectedNode,
  selectedEdge,
  topicName,
  allEdges,
  allNodes,
  onSelectNode,
  onClose,
}) => {
  if (!selectedNode && !selectedEdge) return null;

  // Incoming and outgoing edges for selectedNode
  const incoming = selectedNode
    ? allEdges.filter((e) => e.target === selectedNode.id || e.targetName === selectedNode.name)
    : [];
  const outgoing = selectedNode
    ? allEdges.filter((e) => e.source === selectedNode.id || e.sourceName === selectedNode.name)
    : [];

  const getBadgeColor = (type: string) => {
    switch (type?.toUpperCase()) {
      case "LIMIT": return "bg-red-500/10 text-red-600 border-red-500/20";
      case "RESOURCE": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "PROCESS": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "POLICY": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "DOCUMENT": return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";
      default: return "bg-primary/10 text-primary border-primary/20";
    }
  };

  return (
    <div className="w-80 border-l border-border bg-card/95 backdrop-blur-md h-full flex flex-col shadow-xl z-20 overflow-y-auto">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30 shrink-0">
        <div className="flex items-center gap-2">
          <Network size={18} className="text-primary" />
          <h3 className="font-semibold text-sm">
            {selectedNode ? "Entity Details" : "Relationship Details"}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Close details panel"
        >
          <X size={16} />
        </button>
      </div>

      {/* Sidebar Content */}
      <div className="p-4 space-y-5 text-xs flex-1">
        {selectedNode && (
          <>
            {/* Entity Badge & Title */}
            <div>
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border mb-2 uppercase ${getBadgeColor(
                  selectedNode.type
                )}`}
              >
                {selectedNode.type}
              </span>
              <h2 className="text-base font-bold text-foreground break-words">{selectedNode.label || selectedNode.name}</h2>
            </div>

            {/* Properties */}
            <div className="space-y-2.5 rounded-lg border border-border p-3 bg-muted/10">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Entity Name:</span>
                <span className="font-medium text-foreground">{selectedNode.name}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Type:</span>
                <span className="font-medium text-foreground">{selectedNode.type}</span>
              </div>
              {topicName && (
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Topic:</span>
                  <span className="font-medium text-foreground">{topicName}</span>
                </div>
              )}
              {selectedNode.metadata?.sourceDocumentTitle && (
                <div className="flex justify-between items-start gap-2 text-muted-foreground">
                  <span className="shrink-0">Document:</span>
                  <span className="font-medium text-foreground text-right truncate" title={selectedNode.metadata.sourceDocumentTitle}>
                    {selectedNode.metadata.sourceDocumentTitle}
                  </span>
                </div>
              )}
              {selectedNode.metadata?.sourceChunkId && (
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Source Chunk:</span>
                  <span className="font-mono text-[10px] text-foreground">{selectedNode.metadata.sourceChunkId}</span>
                </div>
              )}
            </div>

            {/* Connections */}
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground uppercase tracking-wider text-[10px] text-muted-foreground">
                Connections ({incoming.length + outgoing.length})
              </h4>

              {/* Incoming Edges */}
              {incoming.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <ArrowDownLeft size={13} className="text-emerald-500" /> Incoming ({incoming.length})
                  </p>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {incoming.map((edge) => {
                      const sourceObj = allNodes.find((n) => n.id === edge.source || n.name === edge.sourceName);
                      return (
                        <button
                          key={edge.id}
                          onClick={() => sourceObj && onSelectNode(sourceObj)}
                          className="w-full text-left p-2 rounded-md border border-border hover:bg-accent/50 transition-colors flex items-center justify-between text-[11px]"
                        >
                          <span className="font-medium truncate">{edge.sourceName || sourceObj?.name || edge.source}</span>
                          <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[9px] uppercase">
                            {edge.relationship}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Outgoing Edges */}
              {outgoing.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <ArrowUpRight size={13} className="text-blue-500" /> Outgoing ({outgoing.length})
                  </p>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {outgoing.map((edge) => {
                      const targetObj = allNodes.find((n) => n.id === edge.target || n.name === edge.targetName);
                      return (
                        <button
                          key={edge.id}
                          onClick={() => targetObj && onSelectNode(targetObj)}
                          className="w-full text-left p-2 rounded-md border border-border hover:bg-accent/50 transition-colors flex items-center justify-between text-[11px]"
                        >
                          <span className="font-medium truncate">{edge.targetName || targetObj?.name || edge.target}</span>
                          <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[9px] uppercase">
                            {edge.relationship}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {selectedEdge && (
          <>
            <div>
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border mb-2 uppercase bg-amber-500/10 text-amber-600 border-amber-500/20">
                {selectedEdge.relationship || selectedEdge.type}
              </span>
              <h2 className="text-sm font-bold text-foreground">
                {selectedEdge.sourceName || selectedEdge.source} → {selectedEdge.targetName || selectedEdge.target}
              </h2>
            </div>

            <div className="space-y-2.5 rounded-lg border border-border p-3 bg-muted/10">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Source Node:</span>
                <span className="font-medium text-foreground">{selectedEdge.sourceName || selectedEdge.source}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Target Node:</span>
                <span className="font-medium text-foreground">{selectedEdge.targetName || selectedEdge.target}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Relationship:</span>
                <span className="font-medium text-foreground uppercase">{selectedEdge.relationship || selectedEdge.type}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Confidence:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {((selectedEdge.confidence || 0.9) * 100).toFixed(0)}%
                </span>
              </div>
              {selectedEdge.documentTitle && (
                <div className="flex justify-between items-start gap-2 text-muted-foreground">
                  <span className="shrink-0">Source Document:</span>
                  <span className="font-medium text-foreground text-right truncate" title={selectedEdge.documentTitle}>
                    {selectedEdge.documentTitle}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GraphEntityDetailsSidebar;
