import json
import uuid
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Header
from src.models.schemas import (
    FeedGenerateRequest, FeedGenerateResponse,
    RecommendationsRequest, RecommendationsResponse
)
from src.services.session import get_session, update_session_posts
from src.providers.llm import llm_manager

logger = logging.getLogger(__name__)
router = APIRouter()

FEED_SYSTEM_PROMPT = """You are a social feed generator. Generate exactly 10 posts based on the source material provided.

Output format: JSON array of posts with this exact structure:
[
  {
    "id": "unique-id",
    "platform": "reddit" or "twitter",
    "post_type": "question" | "creator" | "rant" | "listicle",
    "title": "post title",
    "body": "post body text",
    "author_handle": "u/snake_case for reddit, @CamelCase for twitter",
    "upvotes": number between X-Y based on post_type,
    "timestamp": "relative time like '2 hours ago' or '3 days ago'",
    "citations": ["Source: title or domain"],
    "comments": [
      {
        "id": "comment-id",
        "author_handle": "u/snake_case or @CamelCase",
        "body": "comment text",
        "upvotes": number,
        "citations": ["optional citation"]
      }
    ]
  }
]

Post type diversity requirements:
- At minimum: 2 question posts, 2 creator posts, 1 rant post, 1 listicle, rest randomized

For question posts: Generate 3-5 comments with answer revealed progressively (first sets up context, subsequent deepen explanation)
For non-question posts: Generate 2-3 comments with tangential insights or debate

Citation format: "Source: [document title or domain]"
Upvote ranges: questions 500-5000, rants 1000-20000, listicles 2000-15000, creator posts 300-3000

Generate realistic author handles: Reddit u/snake_case, Twitter @CamelCase
Generate plausible timestamps in relative format.

Respond ONLY with valid JSON, no markdown, no explanation."""


@router.post("/api/generate/feed", response_model=FeedGenerateResponse)
async def generate_feed(
    request: FeedGenerateRequest,
    x_gemini_api_key: Optional[str] = Header(None),
    x_minimax_api_key: Optional[str] = Header(None),
):
    session = get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    source_text = session.source_text
    platform = request.platform

    prompt = f"{FEED_SYSTEM_PROMPT}\n\nPlatform: {platform}\n\nSource material:\n{source_text}"

    try:
        response_text, provider = llm_manager.generate(prompt, gemini_key=x_gemini_api_key, minimax_key=x_minimax_api_key)
        logger.info(f"Feed generated using {provider}")
    except Exception as e:
        logger.error(f"Feed generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")
    
    try:
        json_match = response_text.strip()
        if json_match.startswith("```json"):
            json_match = json_match[7:]
        elif json_match.startswith("```"):
            json_match = json_match[3:]
        if json_match.endswith("```"):
            json_match = json_match[:-3]
        json_match = json_match.strip()
        
        posts = json.loads(json_match)
    except json.JSONDecodeError as e:
        logger.warning(f"JSON parse failed, retrying: {e}")
        try:
            response_text, _ = llm_manager.generate(prompt, gemini_key=x_gemini_api_key, minimax_key=x_minimax_api_key)
            json_match = response_text.strip()
            if "```" in json_match:
                json_match = json_match.split("```")[1]
                if json_match.startswith("json"):
                    json_match = json_match[4:]
            posts = json.loads(json_match.strip())
        except Exception as retry_error:
            raise HTTPException(status_code=500, detail=f"Failed to parse LLM response: {str(retry_error)}")
    
    for post in posts:
        if "id" not in post or not post["id"]:
            post["id"] = str(uuid.uuid4())
        if "platform" not in post:
            post["platform"] = platform
    
    update_session_posts(request.session_id, posts)
    
    return FeedGenerateResponse(session_id=request.session_id, posts=posts, platform=platform)


@router.post("/api/generate/recommendations", response_model=RecommendationsResponse)
async def generate_recommendations(
    request: RecommendationsRequest,
    x_gemini_api_key: Optional[str] = Header(None),
    x_minimax_api_key: Optional[str] = Header(None),
):
    session = get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    source_text = session.source_text
    
    prompt = f"""Based on the following source material, generate 5 follow-up single-text-prompt suggestions for further exploration.

The suggestions should be ready-to-use prompts that explore related topics, deeper dive into concepts, or tangential areas.

Source material:
{source_text}

Output as JSON array of strings, each being a complete prompt. Example:
["How does analog audio signal chain work?", "What are the best practices for audio recording?", "Compare vinyl vs digital audio quality", "Best budget turntable recommendations", "How to maintain vinyl records properly"]

Respond ONLY with valid JSON array, no explanation, no markdown."""
    
    try:
        response_text, provider = llm_manager.generate(prompt, gemini_key=x_gemini_api_key, minimax_key=x_minimax_api_key)
        logger.info(f"Recommendations generated using {provider}")
    except Exception as e:
        logger.error(f"Recommendations generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")
    
    try:
        json_match = response_text.strip()
        if "```" in json_match:
            json_match = json_match.split("```")[1]
            if json_match.startswith("json"):
                json_match = json_match[4:]
        recommendations = json.loads(json_match.strip())
    except json.JSONDecodeError as e:
        logger.warning(f"Recommendations JSON parse failed: {e}")
        recommendations = []
    
    if not isinstance(recommendations, list):
        recommendations = []
    
    recommendations = recommendations[:5]
    
    return RecommendationsResponse(recommendations=recommendations)
