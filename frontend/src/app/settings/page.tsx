"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useSessionStore } from "@/store/session";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const { geminiApiKey, minimaxApiKey, setGeminiApiKey, setMinimaxApiKey } = useSessionStore();

  const [geminiInput, setGeminiInput] = useState(geminiApiKey);
  const [minimaxInput, setMinimaxInput] = useState(minimaxApiKey);
  const [showGemini, setShowGemini] = useState(false);
  const [showMinimax, setShowMinimax] = useState(false);
  const [saved, setSaved] = useState(false);
  const [healthStatus, setHealthStatus] = useState<"idle" | "checking" | "ok" | "error">("idle");

  const handleSave = () => {
    setGeminiApiKey(geminiInput.trim());
    setMinimaxApiKey(minimaxInput.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCheckHealth = async () => {
    setHealthStatus("checking");
    try {
      await api.health();
      setHealthStatus("ok");
    } catch {
      setHealthStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b z-10">
        <div className="max-w-[600px] mx-auto px-4 py-3 flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <h1 className="font-bold text-xl">Settings</h1>
        </div>
      </header>

      <main className="max-w-[600px] mx-auto px-4 py-6 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <h2 className="font-semibold">API Keys</h2>
            <p className="text-sm text-gray-500">
              Keys are stored locally in your browser and sent directly to the backend. At least one key is required to generate feeds.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Gemini API Key
                <span className="ml-2 text-xs text-gray-400 font-normal">
                  (google.ai/app — free tier)
                </span>
              </label>
              <div className="relative">
                <Input
                  type={showGemini ? "text" : "password"}
                  placeholder="AIza..."
                  value={geminiInput}
                  onChange={(e) => setGeminiInput(e.target.value)}
                  className="pr-10 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowGemini(!showGemini)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showGemini ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {geminiApiKey && (
                <p className="text-xs text-green-600 mt-1">Key saved</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Minimax API Key
                <span className="ml-2 text-xs text-gray-400 font-normal">
                  (fallback provider)
                </span>
              </label>
              <div className="relative">
                <Input
                  type={showMinimax ? "text" : "password"}
                  placeholder="eyJ..."
                  value={minimaxInput}
                  onChange={(e) => setMinimaxInput(e.target.value)}
                  className="pr-10 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowMinimax(!showMinimax)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showMinimax ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {minimaxApiKey && (
                <p className="text-xs text-green-600 mt-1">Key saved</p>
              )}
            </div>

            <Button onClick={handleSave} className="w-full">
              {saved ? "Saved!" : "Save Keys"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h2 className="font-semibold">Backend Status</h2>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleCheckHealth} disabled={healthStatus === "checking"}>
              {healthStatus === "checking" ? "Checking..." : "Check Connection"}
            </Button>
            {healthStatus === "ok" && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle size={16} /> Backend reachable
              </span>
            )}
            {healthStatus === "error" && (
              <span className="flex items-center gap-1 text-sm text-red-500">
                <AlertCircle size={16} /> Cannot reach backend at {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}
              </span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h2 className="font-semibold">Provider Priority</h2>
          </CardHeader>
          <CardContent>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Gemini (gemini-1.5-flash) — primary, tried first</li>
              <li>Minimax (abab6.5s-chat) — fallback if Gemini fails or is unset</li>
            </ol>
            <p className="text-xs text-gray-400 mt-3">
              Keys set here take precedence over any server-side environment variables.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
