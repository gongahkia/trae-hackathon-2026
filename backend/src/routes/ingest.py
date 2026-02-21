import uuid
import logging
import pdfplumber
import httpx
from bs4 import BeautifulSoup
from fastapi import APIRouter, UploadFile, File, HTTPException
from src.models.schemas import (
    TextIngestRequest, TextIngestResponse,
    PdfIngestResponse, UrlIngestRequest, UrlIngestResponse
)
from src.services.session import create_session, get_session

logger = logging.getLogger(__name__)
router = APIRouter()

MAX_PDF_SIZE = 10 * 1024 * 1024
MAX_TEXT_LENGTH = 12000


def truncate_text(text: str) -> str:
    if len(text) > MAX_TEXT_LENGTH:
        return text[:MAX_TEXT_LENGTH] + "\n\n[Document truncated for context]"
    return text


@router.post("/api/ingest/text", response_model=TextIngestResponse)
async def ingest_text(request: TextIngestRequest, platform: str = "reddit"):
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")
    
    session_id = str(uuid.uuid4())
    source_text = truncate_text(request.prompt)
    create_session(session_id, source_text, platform)
    
    return TextIngestResponse(session_id=session_id, source_text=source_text)


@router.post("/api/ingest/pdf", response_model=PdfIngestResponse)
async def ingest_pdf(file: UploadFile = File(...), platform: str = "reddit"):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    contents = await file.read()
    if len(contents) > MAX_PDF_SIZE:
        raise HTTPException(status_code=400, detail="PDF file size must be under 10MB")
    
    try:
        import io
        with pdfplumber.open(io.BytesIO(contents)) as pdf:
            text_parts = []
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    text_parts.append(text)
            full_text = "\n\n".join(text_parts)
            page_count = len(pdf.pages)
    except Exception as e:
        logger.error(f"PDF extraction failed: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to extract text from PDF: {str(e)}")
    
    session_id = str(uuid.uuid4())
    source_text = truncate_text(full_text)
    create_session(session_id, source_text, platform)
    
    return PdfIngestResponse(session_id=session_id, source_text=source_text, page_count=page_count)


@router.post("/api/ingest/url", response_model=UrlIngestResponse)
async def ingest_url(request: UrlIngestRequest, platform: str = "reddit"):
    url = request.url
    try:
        async with httpx.AsyncClient() as client:
            head_response = await client.head(url, timeout=10)
            if head_response.status_code >= 400:
                raise HTTPException(status_code=422, detail=f"URL is not reachable: {url}")
            
            response = await client.get(url, timeout=30)
            response.raise_for_status()
    except httpx.RequestError as e:
        raise HTTPException(status_code=422, detail=f"Failed to fetch URL: {str(e)}")
    
    soup = BeautifulSoup(response.text, 'lxml')
    
    for tag in soup(['script', 'style', 'nav', 'footer', 'header', 'aside', 'form', 'iframe']):
        tag.decompose()
    
    main_content = soup.find('article') or soup.find('main') or soup.find('div', class_=lambda x: x and 'content' in x.lower()) or soup.body
    
    if main_content:
        text = main_content.get_text(separator='\n', strip=True)
    else:
        text = soup.get_text(separator='\n', strip=True)
    
    text = '\n'.join(line for line in text.split('\n') if line.strip())
    
    if not request.restrict_to_document:
        text += "\n\n[Note: The LLM may supplement with general knowledge beyond this document.]"
    
    session_id = str(uuid.uuid4())
    source_text = truncate_text(text)
    create_session(session_id, source_text, platform)
    
    return UrlIngestResponse(session_id=session_id, source_text=source_text)


@router.get("/api/session/{session_id}")
async def get_session_endpoint(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session
