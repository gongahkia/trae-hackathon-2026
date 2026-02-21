"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useSessionStore } from "@/store/session";
import { KnowledgeGraphResponse } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ForceGraph2D = dynamic(() => import("react-force-graph-2d") as any, { ssr: false });

const NODE_COLORS: Record<string, string> = {
  concept: "#3b82f6",
  person: "#8b5cf6",
  tool: "#10b981",
  event: "#f59e0b",
};

export default function GraphPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const { setHighlightedPosts, geminiApiKey, minimaxApiKey } = useSessionStore();
  const [graphData, setGraphData] = useState<KnowledgeGraphResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    setDimensions({ width: window.innerWidth, height: window.innerHeight - 57 });
  }, []);

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const apiKeys = { geminiApiKey: geminiApiKey || undefined, minimaxApiKey: minimaxApiKey || undefined };
        const data = await api.generateKnowledgeGraph(sessionId, apiKeys);
        setGraphData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate graph");
      } finally {
        setLoading(false);
      }
    };
    fetchGraph();
  }, [sessionId, geminiApiKey, minimaxApiKey]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleNodeClick = (node: any) => {
    if (node.post_ids?.length) {
      setHighlightedPosts(node.post_ids);
      router.push(`/feed/${sessionId}`);
    }
  };

  const fgData = graphData
    ? {
        nodes: graphData.nodes.map((n) => ({ ...n, color: NODE_COLORS[n.type] || "#6b7280" })),
        links: graphData.edges.map((e) => ({ source: e.source, target: e.target, label: e.relationship })),
      }
    : { nodes: [], links: [] };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="sticky top-0 bg-gray-900 border-b border-gray-800 z-10">
        <div className="max-w-[900px] mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/feed/${sessionId}`)}>
            <ArrowLeft size={18} />
          </Button>
          <h1 className="font-bold text-lg">Knowledge Graph</h1>
          <div className="ml-auto flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />concept</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />person</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />tool</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />event</span>
          </div>
        </div>
      </header>
      <main className="w-full" style={{ height: dimensions.height }}>
        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p>Building knowledge graph...</p>
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-red-400">
            <p>{error}</p>
            <Button variant="outline" onClick={() => router.back()}>Go back</Button>
          </div>
        )}
        {!loading && !error && graphData && (
          <ForceGraph2D
            graphData={fgData}
            nodeLabel="label"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            nodeColor={(node: any) => node.color}
            linkLabel="label"
            backgroundColor="#030712"
            width={dimensions.width}
            height={dimensions.height}
            onNodeClick={handleNodeClick}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
              const label = node.label as string;
              const fontSize = 12 / globalScale;
              ctx.font = `${fontSize}px Sans-Serif`;
              ctx.fillStyle = node.color;
              ctx.beginPath();
              ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI);
              ctx.fill();
              ctx.fillStyle = "rgba(255,255,255,0.85)";
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              ctx.fillText(label, node.x, node.y + 8);
            }}
          />
        )}
      </main>
    </div>
  );
}
