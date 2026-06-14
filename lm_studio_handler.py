import requests
import asyncio
from typing import Optional

class LMStudioHandler:
    def __init__(self, api_url: str = "http://localhost:1234/v1"):
        self.api_url = api_url
        self.model = "local-model"  # LM Studio uses this as model identifier
        self.session = None

    async def generate_response(self, prompt: str, max_tokens: int = 1024) -> Optional[str]:
        """Generate response from LM Studio API"""
        try:
            payload = {
                "model": self.model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
                "max_tokens": max_tokens,
                "top_p": 0.95,
            }

            response = requests.post(
                f"{self.api_url}/chat/completions",
                json=payload,
                timeout=60
            )
            response.raise_for_status()

            result = response.json()
            if "choices" in result and len(result["choices"]) > 0:
                return result["choices"][0]["message"]["content"]
            return None
        except requests.exceptions.ConnectionError:
            return "エラー: LM Studio に接続できません。サーバーが起動していることを確認してください。"
        except Exception as e:
            return f"エラーが発生しました: {str(e)}"

    async def generate_code(self, description: str, language: str = "python") -> Optional[str]:
        """Generate code based on description"""
        prompt = f"""以下の説明に基づいて、{language}のコードを生成してください。
説明: {description}

コードのみを出力してください。説明は不要です。"""
        return await self.generate_response(prompt, max_tokens=2048)

    async def process_text(self, text: str, task: str = "summarize") -> Optional[str]:
        """Process text for various tasks"""
        if task == "summarize":
            prompt = f"以下のテキストを簡潔に要約してください:\n\n{text}"
        elif task == "translate":
            prompt = f"以下のテキストを日本語に翻訳してください:\n\n{text}"
        else:
            prompt = text

        return await self.generate_response(prompt)

    async def check_connection(self) -> bool:
        """Check if LM Studio server is running"""
        try:
            response = requests.get(f"{self.api_url}/models", timeout=5)
            return response.status_code == 200
        except:
            return False
