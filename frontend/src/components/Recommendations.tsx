"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecommendationsProps {
  recommendations: string[];
  loading: boolean;
  onExplore: (prompt: string) => void;
}

export function Recommendations({
  recommendations,
  loading,
  onExplore,
}: RecommendationsProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading recommendations...
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-sm text-gray-500">No recommendations yet.</div>
    );
  }

  return (
    <div className="grid gap-3">
      {recommendations.map((rec) => (
        <div
          key={rec}
          className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4"
        >
          <p className="text-sm text-gray-700">{rec}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExplore(rec)}
          >
            Explore →
          </Button>
        </div>
      ))}
    </div>
  );
}
