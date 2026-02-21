export interface Comment {
  id: string;
  author_handle: string;
  body: string;
  upvotes: number;
  citations: string[];
}

export interface Post {
  id: string;
  platform: "reddit" | "twitter";
  post_type: "question" | "creator" | "rant" | "listicle";
  title: string;
  body: string;
  author_handle: string;
  upvotes: number;
  timestamp: string;
  citations: string[];
  comments: Comment[];
}

export interface Session {
  session_id: string;
  source_text: string;
  platform: string;
  generated_posts: Post[];
  created_at: string;
}

export interface TextIngestResponse {
  session_id: string;
  source_text: string;
}

export interface PdfIngestResponse {
  session_id: string;
  source_text: string;
  page_count: number;
}

export interface UrlIngestResponse {
  session_id: string;
  source_text: string;
}

export interface FeedGenerateResponse {
  session_id: string;
  posts: Post[];
  platform: string;
}

export interface RecommendationsResponse {
  recommendations: string[];
}

export interface HealthResponse {
  status: "ok";
  providers: string[];
}

export interface GraphNode { id: string; label: string; type: string; post_ids: string[]; }
export interface GraphEdge { source: string; target: string; relationship: string; }
export interface KnowledgeGraphResponse { nodes: GraphNode[]; edges: GraphEdge[]; }
