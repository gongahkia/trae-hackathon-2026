import {
  TextIngestResponse,
  PdfIngestResponse,
  UrlIngestResponse,
  FeedGenerateResponse,
  RecommendationsResponse,
  KnowledgeGraphResponse,
  HealthResponse,
  Session,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ApiKeys {
  geminiApiKey?: string;
  minimaxApiKey?: string;
}

function buildKeyHeaders(keys?: ApiKeys): Record<string, string> {
  const headers: Record<string, string> = {};
  if (keys?.geminiApiKey) headers["X-Gemini-Api-Key"] = keys.geminiApiKey;
  if (keys?.minimaxApiKey) headers["X-Minimax-Api-Key"] = keys.minimaxApiKey;
  return headers;
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  health: () => fetchApi<HealthResponse>("/api/health"),

  ingestText: (prompt: string, platform: string = "reddit") =>
    fetchApi<TextIngestResponse>(`/api/ingest/text?platform=${platform}`, {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),

  ingestPdf: async (file: File, platform: string = "reddit") => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `${API_URL}/api/ingest/pdf?platform=${platform}`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json() as Promise<PdfIngestResponse>;
  },

  ingestUrl: (url: string, restrictToDocument: boolean = true, platform: string = "reddit") =>
    fetchApi<UrlIngestResponse>(`/api/ingest/url?platform=${platform}`, {
      method: "POST",
      body: JSON.stringify({ url, restrict_to_document: restrictToDocument }),
    }),

  generateFeed: (
    sessionId: string,
    platform: string,
    postCount: number = 10,
    keys?: ApiKeys,
    signal?: AbortSignal
  ) =>
    fetchApi<FeedGenerateResponse>("/api/generate/feed", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, platform, post_count: postCount }),
      headers: buildKeyHeaders(keys),
      signal,
    }),

  generateRecommendations: (sessionId: string, keys?: ApiKeys) =>
    fetchApi<RecommendationsResponse>("/api/generate/recommendations", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId }),
      headers: buildKeyHeaders(keys),
    }),

  generateKnowledgeGraph: (sessionId: string, keys?: ApiKeys) =>
    fetchApi<KnowledgeGraphResponse>("/api/generate/knowledge-graph", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId }),
      headers: buildKeyHeaders(keys),
    }),

  getSession: (sessionId: string) =>
    fetchApi<Session>(`/api/session/${sessionId}`),
};
