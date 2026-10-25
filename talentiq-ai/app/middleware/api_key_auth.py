from fastapi import Request, HTTPException, status
import os

INTERNAL_API_KEY = os.getenv("AI_INTERNAL_API_KEY", "talentiq-internal-ai-key-secret-2026")

async def verify_internal_api_key(request: Request):
    # Allow public access to /health and docs
    if request.url.path in ["/health", "/docs", "/openapi.json", "/redoc"]:
        return

    api_key = request.headers.get("X-Internal-Api-Key")
    if not api_key or api_key != INTERNAL_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Invalid or missing X-Internal-Api-Key header",
        )
