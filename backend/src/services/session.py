from typing import Dict
from datetime import datetime
from src.models.schemas import Session


sessions: Dict[str, Session] = {}


def create_session(session_id: str, source_text: str, platform: str) -> Session:
    session = Session(
        session_id=session_id,
        source_text=source_text,
        platform=platform,
        generated_posts=[],
        created_at=datetime.now()
    )
    sessions[session_id] = session
    return session


def get_session(session_id: str) -> Session | None:
    return sessions.get(session_id)


def update_session_posts(session_id: str, posts: list) -> None:
    if session_id in sessions:
        sessions[session_id].generated_posts = posts
