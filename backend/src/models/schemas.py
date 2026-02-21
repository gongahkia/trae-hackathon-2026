from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class CommentSchema(BaseModel):
    id: str
    author_handle: str
    body: str
    upvotes: int
    citations: List[str] = []


class PostSchema(BaseModel):
    id: str
    platform: str
    post_type: str
    title: str
    body: str
    author_handle: str
    upvotes: int
    timestamp: str
    citations: List[str] = []
    comments: List[CommentSchema] = []


class Session(BaseModel):
    session_id: str
    source_text: str
    platform: str
    generated_posts: List[PostSchema] = []
    created_at: datetime = datetime.now()


class TextIngestRequest(BaseModel):
    prompt: str


class TextIngestResponse(BaseModel):
    session_id: str
    source_text: str


class PdfIngestResponse(BaseModel):
    session_id: str
    source_text: str
    page_count: int


class UrlIngestRequest(BaseModel):
    url: str
    restrict_to_document: bool = True


class UrlIngestResponse(BaseModel):
    session_id: str
    source_text: str


class FeedGenerateRequest(BaseModel):
    session_id: str
    platform: str
    post_count: int = 10


class FeedGenerateResponse(BaseModel):
    session_id: str
    posts: List[PostSchema]
    platform: str


class RecommendationsRequest(BaseModel):
    session_id: str


class RecommendationsResponse(BaseModel):
    recommendations: List[str]


class ErrorResponse(BaseModel):
    error: str
    detail: str = ""

class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # "concept" | "person" | "tool" | "event"
    post_ids: List[str]

class GraphEdge(BaseModel):
    source: str
    target: str
    relationship: str

class KnowledgeGraphRequest(BaseModel):
    session_id: str

class KnowledgeGraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
