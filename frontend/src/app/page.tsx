"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import { FileText, Link as LinkIcon, MessageSquare, Loader2, Upload, Bookmark, Clock, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useSessionStore } from "@/store/session";

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("topic");
  const [platform, setPlatform] = useState<"reddit" | "twitter">("reddit");
  const [topic, setTopic] = useState("");
  const [url, setUrl] = useState("");
  const [restrictToDocument, setRestrictToDocument] = useState(true);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generationError, setGenerationError] = useState("");
  const [loadingStage, setLoadingStage] = useState<"idle" | "ingesting" | "generating">("idle");
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const { setSession, addToHistory, geminiApiKey, minimaxApiKey } = useSessionStore();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const prompt = params.get("prompt");
    if (prompt) {
      setActiveTab("topic");
      setTopic(prompt);
    }
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setPdfFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setGenerationError("");

    let stage: "ingesting" | "generating" = "ingesting";
    setLoadingStage(stage);

    try {
      let sessionId: string;
      let sourceText: string;

      if (activeTab === "topic") {
        if (!topic.trim()) {
          setError("Please enter a topic");
          setLoading(false);
          return;
        }
        const response = await api.ingestText(topic, platform);
        sessionId = response.session_id;
        sourceText = response.source_text;
      } else if (activeTab === "url") {
        if (!url.trim()) {
          setError("Please enter a URL");
          setLoading(false);
          return;
        }
        const response = await api.ingestUrl(url, restrictToDocument, platform);
        sessionId = response.session_id;
        sourceText = response.source_text;
      } else {
        if (!pdfFile) {
          setError("Please upload a PDF");
          setLoading(false);
          return;
        }
        const response = await api.ingestPdf(pdfFile, platform);
        sessionId = response.session_id;
        sourceText = response.source_text;
      }

      stage = "generating";
      setLoadingStage(stage);
      const controller = new AbortController();
      setAbortController(controller);
      const apiKeys = { geminiApiKey: geminiApiKey || undefined, minimaxApiKey: minimaxApiKey || undefined };
      const feedResponse = await api.generateFeed(sessionId, platform, 10, apiKeys, controller.signal);

      setSession(sessionId, sourceText, platform, feedResponse.posts);
      addToHistory({
        sessionId,
        sourceText,
        platform,
        posts: feedResponse.posts,
        createdAt: new Date().toISOString(),
      });

      router.push(`/feed/${sessionId}`);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      const message = err instanceof Error ? err.message : "An error occurred";
      if (stage === "generating") {
        setGenerationError(message);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
      setLoadingStage("idle");
      setAbortController(null);
    }
  };

  const handleCancelGeneration = () => {
    abortController?.abort();
    setLoading(false);
    setLoadingStage("idle");
    setAbortController(null);
  };

  if (generationError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Generation failed</h1>
          <p className="text-sm text-gray-500 mb-6">{generationError}</p>
          <Button onClick={handleSubmit} className="w-full">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">DoomLearn</h1>
          <p className="text-gray-600">Transform any content into engaging social feeds</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Link href="/history">
              <Button variant="ghost" size="sm" className="gap-2">
                <Clock size={16} />
                History
              </Button>
            </Link>
            <Link href="/saved">
              <Button variant="ghost" size="sm" className="gap-2">
                <Bookmark size={16} />
                Saved
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="gap-2">
                <Settings size={16} />
                Settings
              </Button>
            </Link>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Choose Platform</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPlatform("reddit")}
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                    platform === "reddit"
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-orange-500" fill="currentColor">
                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                  </svg>
                  <span className="font-medium">Reddit</span>
                </button>
                <button
                  onClick={() => setPlatform("twitter")}
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                    platform === "twitter"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-blue-500" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span className="font-medium">Twitter/X</span>
                </button>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="topic" className="flex items-center gap-2">
                  <MessageSquare size={16} />
                  Topic
                </TabsTrigger>
                <TabsTrigger value="pdf" className="flex items-center gap-2">
                  <FileText size={16} />
                  PDF
                </TabsTrigger>
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <LinkIcon size={16} />
                  URL
                </TabsTrigger>
              </TabsList>

              <TabsContent value="topic">
                <Textarea
                  placeholder="e.g. Beginner's guide to vinyl record player audio setup"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="min-h-[120px]"
                />
              </TabsContent>

              <TabsContent value="pdf">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <input {...getInputProps()} />
                  {pdfFile ? (
                    <div>
                      <FileText className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="font-medium">{pdfFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <p className="text-sm text-blue-500 mt-2">Click to replace</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-600">Drag & drop a PDF file here</p>
                      <p className="text-sm text-gray-500">or click to browse</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="url">
                <div className="space-y-4">
                  <Input
                    type="url"
                    placeholder="https://example.com/article"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={restrictToDocument}
                      onChange={(e) => setRestrictToDocument(e.target.checked)}
                      className="rounded"
                    />
                    Only use content from this page
                  </label>
                </div>
              </TabsContent>
            </Tabs>

            {error && (
              <p className="text-red-500 text-sm mt-4">{error}</p>
            )}

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full mt-4"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {loadingStage === "ingesting" ? "Ingesting content..." : "Generating your feed..."}
                </>
              ) : (
                "Generate Feed"
              )}
            </Button>
            {loadingStage === "generating" && (
              <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                <span>Hang tight, we are crafting posts</span>
                <Button variant="outline" size="sm" onClick={handleCancelGeneration}>
                  Stop generation
                </Button>
              </div>
            )}
            {loadingStage === "generating" && (
              <div className="mt-6 space-y-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="rounded-lg border border-gray-200 bg-white p-4 animate-pulse">
                    <div className="h-4 w-1/3 bg-gray-200 rounded" />
                    <div className="mt-3 h-3 w-full bg-gray-200 rounded" />
                    <div className="mt-2 h-3 w-5/6 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
