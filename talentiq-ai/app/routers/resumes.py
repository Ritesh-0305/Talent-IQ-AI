import os
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from typing import Optional, List
from pydantic import BaseModel, Field

from app.services.extractor import extract_resume_text, ExtractionError
from app.services.parser import parse_resume_content, ParsedResumeSchema
from app.services.ats_scorer import evaluate_ats, AtsAnalysisResult

router = APIRouter(prefix="/ai", tags=["Resumes & ATS"])

class AtsCalculationRequest(BaseModel):
    parsed_resume: dict
    raw_text: str
    job_title: Optional[str] = None
    job_description: Optional[str] = None
    job_required_skills: Optional[List[str]] = Field(default_factory=list)
    job_preferred_skills: Optional[List[str]] = Field(default_factory=list)

@router.post("/resumes/extract-and-parse", response_model=ParsedResumeSchema)
async def extract_and_parse_resume(
    file: UploadFile = File(...)
):
    """
    Extracts text using PyMuPDF (PDF) or python-docx (DOCX) and produces structured parsed data.
    """
    filename = file.filename or "unknown.pdf"
    content = await file.read()
    
    if not content or len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes)."
        )

    try:
        raw_text, metadata = extract_resume_text(filename, content)
        parsed = parse_resume_content(raw_text, metadata)
        return parsed
    except ExtractionError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal extraction error: {str(e)}"
        )


@router.post("/ats/calculate", response_model=AtsAnalysisResult)
async def calculate_ats(req: AtsCalculationRequest):
    """
    Calculates deterministic ATS score and delivers breakdown and actionable recommendations.
    """
    try:
        result = evaluate_ats(
            parsed_resume=req.parsed_resume,
            raw_text=req.raw_text,
            job_title=req.job_title,
            job_description=req.job_description,
            job_required_skills=req.job_required_skills,
            job_preferred_skills=req.job_preferred_skills
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ATS calculation failure: {str(e)}"
        )
