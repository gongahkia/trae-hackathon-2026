from abc import ABC, abstractmethod
from typing import Optional
import os
import logging
import requests
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class LLMProvider(ABC):
    @abstractmethod
    def generate(self, prompt: str) -> str:
        pass


class GeminiProvider(LLMProvider):
    def __init__(self, api_key: Optional[str] = None):
        api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not set")
        self.client = genai.Client(api_key=api_key)

    def generate(self, prompt: str) -> str:
        for attempt in range(2):
            try:
                response = self.client.models.generate_content(
                    model='gemini-2.0-flash',
                    contents=prompt
                )
                return response.text
            except Exception as e:
                logger.warning(f"Gemini attempt {attempt + 1} failed: {e}")
                if attempt == 1:
                    raise
        raise Exception("Gemini failed after retries")


class MinimaxProvider(LLMProvider):
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("MINIMAX_API_KEY")
        if not self.api_key:
            raise ValueError("MINIMAX_API_KEY not set")
        self.base_url = "https://api.minimaxi.chat/v1/text/chatcompletion_v2"

    def generate(self, prompt: str) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "abab6.5s-chat",
            "messages": [{"role": "user", "content": prompt}]
        }
        for attempt in range(2):
            try:
                response = requests.post(self.base_url, json=payload, headers=headers, timeout=30)
                response.raise_for_status()
                data = response.json()
                if "choices" not in data:
                    logger.error(f"Minimax response missing 'choices': {data}")
                    raise KeyError(f"'choices' not in response: {data}")
                return data["choices"][0]["message"]["content"]
            except Exception as e:
                logger.warning(f"Minimax attempt {attempt + 1} failed: {e}")
                if attempt == 1:
                    raise
        raise Exception("Minimax failed after retries")


class LLMManager:
    def __init__(self):
        self.gemini: Optional[LLMProvider] = None
        self.minimax: Optional[LLMProvider] = None
        self._init_providers()

    def _init_providers(self):
        try:
            self.gemini = GeminiProvider()
            logger.info("Gemini provider initialized")
        except Exception as e:
            logger.warning(f"Gemini provider unavailable: {e}")

        try:
            self.minimax = MinimaxProvider()
            logger.info("Minimax provider initialized")
        except Exception as e:
            logger.warning(f"Minimax provider unavailable: {e}")

    def generate(self, prompt: str, gemini_key: Optional[str] = None, minimax_key: Optional[str] = None) -> tuple[str, str]:
        active_gemini = self.gemini
        active_minimax = self.minimax
        if gemini_key:
            try:
                active_gemini = GeminiProvider(api_key=gemini_key)
            except Exception as e:
                logger.warning(f"Could not init Gemini with provided key: {e}")
        if minimax_key:
            try:
                active_minimax = MinimaxProvider(api_key=minimax_key)
            except Exception as e:
                logger.warning(f"Could not init Minimax with provided key: {e}")

        if active_gemini:
            try:
                result = active_gemini.generate(prompt)
                return result, "gemini"
            except Exception as e:
                logger.warning(f"Gemini failed, falling back to Minimax: {e}")

        if active_minimax:
            try:
                result = active_minimax.generate(prompt)
                return result, "minimax"
            except Exception as e:
                logger.error(f"Minimax also failed: {e}")
                raise Exception("All LLM providers failed")

        raise Exception("No LLM providers available")


llm_manager = LLMManager()
