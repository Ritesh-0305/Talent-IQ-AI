from fastapi import FastAPI, Depends
from app.middleware.api_key_auth import verify_internal_api_key

app = FastAPI(
    title="TalentIQ AI Service",
    description="Decoupled AI engine for resume parsing, NLP extraction, semantic matching, and interview simulations.",
    version="1.0.0",
    dependencies=[Depends(verify_internal_api_key)]
)

@app.get("/health")
def health_check():
    return {
        "status": "UP",
        "service": "talentiq-ai",
        "version": "1.0.0"
    }

@app.get("/")
def root():
    return {
        "message": "TalentIQ AI internal service is online"
    }
