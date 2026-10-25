import pytest
import io
import fitz # PyMuPDF
from docx import Document

from app.services.extractor import extract_text_from_pdf, extract_text_from_docx, extract_resume_text, ExtractionError
from app.services.parser import parse_resume_content
from app.services.ats_scorer import evaluate_ats

def create_sample_pdf(text: str) -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 72), text)
    pdf_bytes = doc.write()
    doc.close()
    return pdf_bytes

def create_sample_docx(text: str) -> bytes:
    doc = Document()
    for paragraph in text.split("\n"):
        if paragraph.strip():
            doc.add_paragraph(paragraph.strip())
    buffer = io.BytesIO()
    doc.save(buffer)
    return buffer.getvalue()

SAMPLE_RESUME_TEXT = """
Jane Doe
jane.doe@example.com | (555) 123-4567 | San Francisco, CA
https://linkedin.com/in/janedoe | https://github.com/janedoe

PROFESSIONAL SUMMARY
Senior Backend Engineer with 6+ years of experience designing high-throughput microservices using Java, Spring Boot, and MySQL.

TECHNICAL SKILLS
Java, Spring Boot, Python, MySQL, PostgreSQL, Docker, Kubernetes, AWS, Redis, Microservices, RESTful APIs, Git

WORK EXPERIENCE
Senior Software Engineer | Tech Innovators Inc.
Jan 2021 - Present
• Architected scalable microservices handling 25,000 requests/sec with Spring Boot and AWS.
• Reduced database query latency by 45% through Redis caching and PostgreSQL query optimization.
• Mentored 4 junior developers and led CI/CD automation with GitHub Actions.

Software Engineer | Alpha Solutions
Jul 2018 - Dec 2020
• Developed REST APIs for financial analytics processing $50M in daily transactions.
• Increased system reliability to 99.99% uptime with Docker and Prometheus monitoring.

PROJECTS
TalentIQ Recruitment Platform
• Built an intelligent hiring platform with Java, Spring Boot, MySQL, and React.
• Implemented automated ATS resume parsing and keyword gap analysis.

EDUCATION
University of California, Berkeley
Bachelor of Science in Computer Science
2014 - 2018
"""

def test_pdf_extraction_and_parsing():
    pdf_bytes = create_sample_pdf(SAMPLE_RESUME_TEXT)
    text, meta = extract_text_from_pdf(pdf_bytes)
    assert len(text) > 100
    assert meta["page_count"] == 1
    assert not meta["low_text_warning"]

    parsed = parse_resume_content(text, meta)
    assert parsed.parse_status == "COMPLETED"
    assert parsed.contact.email == "jane.doe@example.com"
    assert "Java" in parsed.skills
    assert "Spring Boot" in parsed.skills
    assert "Docker" in parsed.skills
    assert len(parsed.experience) >= 1
    assert len(parsed.education) >= 1

def test_docx_extraction_and_parsing():
    docx_bytes = create_sample_docx(SAMPLE_RESUME_TEXT)
    text, meta = extract_text_from_docx(docx_bytes)
    assert len(text) > 100
    assert not meta["low_text_warning"]

    parsed = parse_resume_content(text, meta)
    assert parsed.parse_status == "COMPLETED"
    assert parsed.contact.name is not None
    assert "MySQL" in parsed.skills

def test_empty_document_rejection():
    with pytest.raises(ExtractionError, match="empty document"):
        extract_resume_text("resume.pdf", b"")

def test_malformed_pdf_rejection():
    with pytest.raises(ExtractionError, match="header does not match"):
        extract_text_from_pdf(b"This is not a real PDF file")

def test_malformed_docx_rejection():
    with pytest.raises(ExtractionError, match="missing standard ZIP"):
        extract_text_from_docx(b"Not a real docx zip archive")

def test_low_text_warning_detection():
    # PDF with almost no text (e.g. scanned placeholder)
    sparse_pdf = create_sample_pdf("Hi")
    text, meta = extract_text_from_pdf(sparse_pdf)
    assert meta["low_text_warning"] is True
    assert "OCR" in meta["warning_message"]

    parsed = parse_resume_content(text, meta)
    assert parsed.parse_status == "LOW_TEXT_WARNING"
    assert len(parsed.parse_warnings) > 0

def test_ats_scoring_calculation():
    pdf_bytes = create_sample_pdf(SAMPLE_RESUME_TEXT)
    text, meta = extract_text_from_pdf(pdf_bytes)
    parsed = parse_resume_content(text, meta)

    # Test with target job
    job_req_skills = ["Java", "Spring Boot", "MySQL", "Kafka"]
    job_pref_skills = ["AWS", "Kubernetes"]

    ats = evaluate_ats(
        parsed_resume=parsed.model_dump(),
        raw_text=text,
        job_title="Senior Backend Engineer",
        job_description="Seeking a Senior Backend Engineer skilled in Java, Spring Boot, MySQL, and Kafka.",
        job_required_skills=job_req_skills,
        job_preferred_skills=job_pref_skills
    )

    assert ats.overall_score > 60.0
    assert ats.format_score >= 80.0
    assert ats.completeness_score >= 70.0
    assert "Java" in ats.matched_skills
    assert "Spring Boot" in ats.matched_skills
    # Kafka was missing in resume
    assert "Kafka" in ats.missing_skills
    assert len(ats.supporting_evidence) > 0
    assert len(ats.suggestions) > 0
    # Formula check
    expected = round((0.20 * ats.format_score) + (0.35 * ats.keyword_score) + (0.25 * ats.completeness_score) + (0.20 * ats.relevance_score), 1)
    assert ats.overall_score == expected
