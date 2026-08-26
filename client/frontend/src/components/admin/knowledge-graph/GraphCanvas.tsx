import React, { useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { GraphNodeData, GraphEdgeData } from "./GraphEntityDetailsSidebar";

export interface CanvasNode extends GraphNodeData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

export interface CanvasEdge extends GraphEdgeData {
  sourceNode?: CanvasNode;
  targetNode?: CanvasNode;
}

export interface GraphCanvasRef {
  zoomIn: () => void;
  zoomOut: () => void;
  fitToScreen: () => void;
  resetLayout: () => void;
}

interface GraphCanvasProps {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  selectedNode: GraphNodeData | null;
  selectedEdge: GraphEdgeData | null;
  searchQuery: string;
  hideUnrelated: boolean;
  onSelectNode: (node: GraphNodeData | null) => void;
  onSelectEdge: (edge: GraphEdgeData | null) => void;
}

const TYPE_COLORS: Record<string, string> = {
  LIMIT: "#ef4444",      // Red
  RESOURCE: "#3b82f6",   // Blue
  PROCESS: "#10b981",    // Green
  POLICY: "#f59e0b",     // Amber
  DOCUMENT: "#8b5cf6",   // Purple
  ENTITY: "#06b6d4",     // Cyan
  TOPIC: "#ec4899",      // Pink
};

export const GraphCanvas = forwardRef<GraphCanvasRef, GraphCanvasProps>(({
  nodes,
  edges,
  selectedNode,
  selectedEdge,
  searchQuery,
  hideUnrelated,
  onSelectNode,
  onSelectEdge,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Layout simulation & transform states
  const nodesRef = useRef<CanvasNode[]>([]);
  const edgesRef = useRef<CanvasEdge[]>([]);
  const transformRef = useRef({ scale: 1, x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragNodeRef = useRef<CanvasNode | null>(null);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef<number | null>(null);

  // Initialize node physics positions
  useEffect(() => {
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;

    const existingMap = new Map(nodesRef.current.map((n) => [n.id, n]));

    const canvasNodes: CanvasNode[] = nodes.map((node, i) => {
      const existing = existingMap.get(node.id);
      const angle = (i / Math.max(nodes.length, 1)) * 2 * Math.PI;
      const radiusDist = 120 + (i % 5) * 35;

      const typeUpper = (node.type || "RESOURCE").toUpperCase();
      const color = TYPE_COLORS[typeUpper] || "#3b82f6";

      return {
        ...node,
        x: existing ? existing.x : width / 2 + Math.cos(angle) * radiusDist + (Math.random() - 0.5) * 40,
        y: existing ? existing.y : height / 2 + Math.sin(angle) * radiusDist + (Math.random() - 0.5) * 40,
        vx: 0,
        vy: 0,
        radius: 20,
        color,
      };
    });

    nodesRef.current = canvasNodes;

    const nodeMap = new Map(canvasNodes.map((n) => [n.id, n]));
    const nameMap = new Map(canvasNodes.map((n) => [n.name, n]));

    edgesRef.current = edges.map((e) => ({
      ...e,
      sourceNode: nodeMap.get(e.source) || nameMap.get(e.sourceName || e.source),
      targetNode: nodeMap.get(e.target) || nameMap.get(e.targetName || e.target),
    }));

    // Trigger simulation warm up
    simulateStep(40);
  }, [nodes, edges]);

  // Run simulation iterations
  const simulateStep = useCallback((iterations = 1) => {
    const canvasNodes = nodesRef.current;
    const canvasEdges = edgesRef.current;
    if (canvasNodes.length === 0) return;

    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;
    const cx = width / 2;
    const cy = height / 2;

    const repulsionConstant = 4500;
    const springLength = 130;
    const springStiffness = 0.05;
    const damping = 0.82;

    for (let iter = 0; iter < iterations; iter++) {
      // Repulsion between all pairs
      for (let i = 0; i < canvasNodes.length; i++) {
        for (let j = i + 1; j < canvasNodes.length; j++) {
          const n1 = canvasNodes[i];
          const n2 = canvasNodes[j];
          let dx = n2.x - n1.x;
          let dy = n2.y - n1.y;
          let dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist > 500) continue;

          let force = repulsionConstant / (dist * dist);
          let fx = (dx / dist) * force;
          let fy = (dy / dist) * force;

          if (n1 !== dragNodeRef.current) {
            n1.vx -= fx;
            n1.vy -= fy;
          }
          if (n2 !== dragNodeRef.current) {
            n2.vx += fx;
            n2.vy += fy;
          }
        }
      }

      // Spring attraction along edges
      canvasEdges.forEach((edge) => {
        const { sourceNode, targetNode } = edge;
        if (!sourceNode || !targetNode) return;

        let dx = targetNode.x - sourceNode.x;
        let dy = targetNode.y - sourceNode.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;

        let force = (dist - springLength) * springStiffness;
        let fx = (dx / dist) * force;
        let fy = (dy / dist) * force;

        if (sourceNode !== dragNodeRef.current) {
          sourceNode.vx += fx;
          sourceNode.vy += fy;
        }
        if (targetNode !== dragNodeRef.current) {
          targetNode.vx -= fx;
          targetNode.vy -= fy;
        }
      });

      // Gravity towards center & velocity dampening
      canvasNodes.forEach((node) => {
        if (node === dragNodeRef.current) return;
        node.vx += (cx - node.x) * 0.005;
        node.vy += (cy - node.y) * 0.005;

        node.vx *= damping;
        node.vy *= damping;

        node.x += node.vx;
        node.y += node.vy;
      });
    }
  }, []);

  // Main draw loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const isDark = document.documentElement.classList.contains("dark");

    ctx.clearRect(0, 0, width, height);

    // Canvas background
    ctx.fillStyle = isDark ? "#0f172a" : "#f8fafc";
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    const { scale, x, y } = transformRef.current;
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const canvasNodes = nodesRef.current;
    const canvasEdges = edgesRef.current;

    // Set of connected node IDs if a node is selected
    const connectedNodeIds = new Set<string>();
    const connectedEdgeIds = new Set<string>();

    if (selectedNode) {
      connectedNodeIds.add(selectedNode.id);
      canvasEdges.forEach((e) => {
        if (e.source === selectedNode.id || e.sourceName === selectedNode.name || e.target === selectedNode.id || e.targetName === selectedNode.name) {
          connectedEdgeIds.add(e.id);
          if (e.sourceNode) connectedNodeIds.add(e.sourceNode.id);
          if (e.targetNode) connectedNodeIds.add(e.targetNode.id);
        }
      });
    }

    const query = searchQuery.trim().toLowerCase();

    // 1. Draw Edges
    canvasEdges.forEach((edge) => {
      const { sourceNode, targetNode } = edge;
      if (!sourceNode || !targetNode) return;

      const isEdgeSelected = selectedEdge?.id === edge.id;
      const isConnectedToSelection = selectedNode ? connectedEdgeIds.has(edge.id) : true;

      if (hideUnrelated && selectedNode && !isConnectedToSelection) return;

      ctx.beginPath();
      ctx.moveTo(sourceNode.x, sourceNode.y);
      ctx.lineTo(targetNode.x, targetNode.y);

      if (isEdgeSelected) {
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 3 / scale;
      } else if (isConnectedToSelection) {
        ctx.strokeStyle = isDark ? "rgba(148, 163, 184, 0.4)" : "rgba(100, 116, 139, 0.4)";
        ctx.lineWidth = 1.5 / scale;
      } else {
        ctx.strokeStyle = isDark ? "rgba(148, 163, 184, 0.1)" : "rgba(100, 116, 139, 0.1)";
        ctx.lineWidth = 1 / scale;
      }
      ctx.stroke();

      // Draw arrow head
      const angle = Math.atan2(targetNode.y - sourceNode.y, targetNode.x - sourceNode.x);
      const arrowDist = targetNode.radius + 6;
      const arrowX = targetNode.x - Math.cos(angle) * arrowDist;
      const arrowY = targetNode.y - Math.sin(angle) * arrowDist;

      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(arrowX - 8 * Math.cos(angle - Math.PI / 6), arrowY - 8 * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(arrowX - 8 * Math.cos(angle + Math.PI / 6), arrowY - 8 * Math.sin(angle + Math.PI / 6));
      ctx.fillStyle = isEdgeSelected ? "#f59e0b" : isDark ? "rgba(148, 163, 184, 0.6)" : "rgba(100, 116, 139, 0.6)";
      ctx.fill();

      // Draw relationship label at mid point if scale > 0.7
      if (scale > 0.65 && edge.relationship) {
        const midX = (sourceNode.x + targetNode.x) / 2;
        const midY = (sourceNode.y + targetNode.y) / 2;

        ctx.font = `${Math.max(9, 10 / scale)}px sans-serif`;
        ctx.fillStyle = isDark ? "#cbd5e1" : "#475569";
        ctx.textAlign = "center";
        ctx.fillText(edge.relationship, midX, midY - 4);
      }
    });

    // 2. Draw Nodes
    canvasNodes.forEach((node) => {
      const isSelected = selectedNode?.id === node.id || selectedNode?.name === node.name;
      const isConnected = selectedNode ? connectedNodeIds.has(node.id) : true;
      const matchesSearch = query ? node.name.toLowerCase().includes(query) : true;

      if (hideUnrelated && selectedNode && !isConnected) return;

      const alpha = matchesSearch && (isConnected || !selectedNode) ? 1 : 0.25;

      ctx.save();
      ctx.globalAlpha = alpha;

      // Draw outer halo for selection / search match
      if (isSelected || (query && matchesSearch)) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 6, 0, 2 * Math.PI);
        ctx.fillStyle = isSelected ? "rgba(59, 130, 246, 0.3)" : "rgba(245, 158, 11, 0.3)";
        ctx.fill();
      }

      // Draw Node Circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();
      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.strokeStyle = isSelected ? "#ffffff" : isDark ? "#1e293b" : "#ffffff";
      ctx.stroke();

      // Draw Node Label
      ctx.font = `${isSelected ? "bold " : ""}${Math.max(10, 12 / scale)}px sans-serif`;
      ctx.fillStyle = isDark ? "#f8fafc" : "#0f172a";
      ctx.textAlign = "center";
      ctx.fillText(node.label || node.name, node.x, node.y + node.radius + 14);

      // Draw Type Badge
      ctx.font = `${Math.max(8, 9 / scale)}px sans-serif`;
      ctx.fillStyle = isDark ? "#94a3b8" : "#64748b";
      ctx.fillText(`[${node.type}]`, node.x, node.y + node.radius + 26);

      ctx.restore();
    });

    ctx.restore();
  }, [selectedNode, selectedEdge, searchQuery, hideUnrelated]);

  // Animation Loop
  useEffect(() => {
    const loop = () => {
      simulateStep(1);
      draw();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [simulateStep, draw]);

  // Handle Canvas Resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
        draw();
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [draw]);

  // Imperative Actions (Zoom / Fit / Reset)
  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      transformRef.current.scale = Math.min(transformRef.current.scale * 1.25, 3);
      draw();
    },
    zoomOut: () => {
      transformRef.current.scale = Math.max(transformRef.current.scale / 1.25, 0.3);
      draw();
    },
    fitToScreen: () => {
      const width = containerRef.current?.clientWidth || 800;
      const height = containerRef.current?.clientHeight || 600;
      const canvasNodes = nodesRef.current;
      if (canvasNodes.length === 0) return;

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      canvasNodes.forEach((n) => {
        if (n.x < minX) minX = n.x;
        if (n.x > maxX) maxX = n.x;
        if (n.y < minY) minY = n.y;
        if (n.y > maxY) maxY = n.y;
      });

      const graphW = maxX - minX || 1;
      const graphH = maxY - minY || 1;
      const scaleX = (width * 0.8) / graphW;
      const scaleY = (height * 0.8) / graphH;
      const scale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.4), 1.5);

      const midX = (minX + maxX) / 2;
      const midY = (minY + maxY) / 2;

      transformRef.current = {
        scale,
        x: width / 2 - midX * scale,
        y: height / 2 - midY * scale,
      };
      draw();
    },
    resetLayout: () => {
      transformRef.current = { scale: 1, x: 0, y: 0 };
      simulateStep(50);
      draw();
    },
  }));

  // Pointer Interaction Handlers
  const getCanvasCoords = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const { scale, x, y } = transformRef.current;
    return {
      x: (mouseX - x) / scale,
      y: (mouseY - y) / scale,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    // Check hit node
    const hitNode = nodesRef.current.find((n) => {
      const dx = coords.x - n.x;
      const dy = coords.y - n.y;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 4;
    });

    if (hitNode) {
      dragNodeRef.current = hitNode;
      isDraggingRef.current = true;
      onSelectNode(hitNode);
      onSelectEdge(null);
      return;
    }

    // Check hit edge
    const hitEdge = edgesRef.current.find((edge) => {
      const { sourceNode, targetNode } = edge;
      if (!sourceNode || !targetNode) return false;
      const dx = targetNode.x - sourceNode.x;
      const dy = targetNode.y - sourceNode.y;
      const length = Math.sqrt(dx * dx + dy * dy) || 1;
      const dot = ((coords.x - sourceNode.x) * dx + (coords.y - sourceNode.y) * dy) / (length * length);
      if (dot < 0 || dot > 1) return false;
      const projX = sourceNode.x + dot * dx;
      const projY = sourceNode.y + dot * dy;
      const dist = Math.sqrt((coords.x - projX) ** 2 + (coords.y - projY) ** 2);
      return dist <= 8;
    });

    if (hitEdge) {
      onSelectEdge(hitEdge);
      onSelectNode(null);
      return;
    }

    // Drag canvas background
    isDraggingRef.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    if (dragNodeRef.current) {
      const { scale } = transformRef.current;
      dragNodeRef.current.x += dx / scale;
      dragNodeRef.current.y += dy / scale;
    } else {
      transformRef.current.x += dx;
      transformRef.current.y += dy;
    }
    draw();
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    dragNodeRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.min(Math.max(transformRef.current.scale * zoomFactor, 0.3), 3);

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    transformRef.current.x = mouseX - (mouseX - transformRef.current.x) * (newScale / transformRef.current.scale);
    transformRef.current.y = mouseY - (mouseY - transformRef.current.y) * (newScale / transformRef.current.scale);
    transformRef.current.scale = newScale;

    draw();
  };

  return (
    <div ref={containerRef} className="w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full block"
      />
    </div>
  );
});

export default GraphCanvas;
