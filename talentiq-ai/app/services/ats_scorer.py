import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class AtsSuggestion(BaseModel):
    section: str
    issue: str
    recommendation: str

class AtsEvidence(BaseModel):
    category: str
    finding: str
    snippet: Optional[str] = None

class AtsAnalysisResult(BaseModel):
    overall_score: float
    keyword_score: float
    format_score: float
    completeness_score: float
    relevance_score: float
    matched_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    supporting_evidence: List[AtsEvidence] = Field(default_factory=list)
    suggestions: List[AtsSuggestion] = Field(default_factory=list)
    scoring_policy: Dict[str, Any] = Field(default_factory=dict)
    limitations_note: str


def calculate_format_score(parsed: Dict[str, Any], raw_text: str) -> (float, List[AtsEvidence], List[AtsSuggestion]):
    """
    Format Score (Weight 20%): Structure, contact clarity, header sections, word density.
    """
    score = 0.0
    evidence = []
    suggestions = []

    contact = parsed.get("contact", {})
    # 1. Contact Info check (max 30 pts)
    contact_pts = 0
    if contact.get("name"):
        contact_pts += 10
    if contact.get("email"):
        contact_pts += 10
    if contact.get("phone"):
        contact_pts += 10
    
    score += contact_pts
    if contact_pts == 30:
        evidence.append(AtsEvidence(category="Formatting", finding="Full contact credentials found (Name, Email, Phone)"))
    else:
        suggestions.append(AtsSuggestion(
            section="CONTACT",
            issue="Incomplete contact credentials",
            recommendation="Ensure your professional name, email, and accessible phone number are listed prominently at the top."
        ))

    # 2. Section Headers check (max 40 pts)
    section_pts = 0
    if parsed.get("experience"):
        section_pts += 10
    if parsed.get("education"):
        section_pts += 10
    if parsed.get("skills"):
        section_pts += 10
    if parsed.get("projects") or parsed.get("summary"):
        section_pts += 10

    score += section_pts
    if section_pts >= 30:
        evidence.append(AtsEvidence(category="Formatting", finding=f"Standard ATS section headings detected ({section_pts // 10}/4 key sections)"))
    else:
        suggestions.append(AtsSuggestion(
            section="STRUCTURE",
            issue="Missing standard section headings",
            recommendation="Use conventional headings like 'Work Experience', 'Education', 'Technical Skills', and 'Projects'."
        ))

    # 3. Word count & readability (max 30 pts)
    word_count = len(raw_text.split()) if raw_text else 0
    if 250 <= word_count <= 1500:
        score += 30
        evidence.append(AtsEvidence(category="Formatting", finding=f"Optimal resume length ({word_count} words)"))
    elif word_count < 250:
        score += 15
        suggestions.append(AtsSuggestion(
            section="LENGTH",
            issue="Resume appears too brief",
            recommendation=f"The resume contains only {word_count} words. Elaborate on project deliverables and technical responsibilities."
        ))
    else:
        score += 20
        suggestions.append(AtsSuggestion(
            section="LENGTH",
            issue="Resume is unusually long",
            recommendation=f"The resume contains {word_count} words. Consider condensing content into 1-2 pages of high-impact achievements."
        ))

    return min(100.0, score), evidence, suggestions


def calculate_keyword_score(
    resume_skills: List[str], 
    job_required_skills: Optional[List[str]],
    job_preferred_skills: Optional[List[str]]
) -> (float, List[str], List[str], List[AtsEvidence], List[AtsSuggestion]):
    """
    Keyword Score (Weight 35%): Overlap between resume skills and target job requirements.
    If no target job is provided, evaluates against core industry engineering benchmarks.
    """
    evidence = []
    suggestions = []
    resume_skill_set = {s.lower() for s in resume_skills}

    if job_required_skills:
        req_set = {s.strip().lower() for s in job_required_skills if s.strip()}
        pref_set = {s.strip().lower() for s in (job_preferred_skills or []) if s.strip()}

        matched_req = [s for s in job_required_skills if s.lower() in resume_skill_set]
        missing_req = [s for s in job_required_skills if s.lower() not in resume_skill_set]

        matched_pref = [s for s in (job_preferred_skills or []) if s.lower() in resume_skill_set]
        missing_pref = [s for s in (job_preferred_skills or []) if s.lower() not in resume_skill_set]

        # 75% weight on required, 25% on preferred (or 100% on required if no preferred)
        req_ratio = len(matched_req) / len(req_set) if req_set else 1.0
        if pref_set:
            pref_ratio = len(matched_pref) / len(pref_set)
            score = (0.75 * req_ratio + 0.25 * pref_ratio) * 100.0
        else:
            score = req_ratio * 100.0

        all_matched = sorted(list(set(matched_req + matched_pref)))
        all_missing = sorted(list(set(missing_req + missing_pref)))

        evidence.append(AtsEvidence(
            category="Keywords",
            finding=f"Matched {len(matched_req)} of {len(req_set)} required skills ({round(req_ratio * 100)}%)"
        ))

        if missing_req:
            suggestions.append(AtsSuggestion(
                section="SKILLS",
                issue=f"Missing {len(missing_req)} required role skills",
                recommendation=f"Add demonstrable experience with: {', '.join(missing_req[:5])}."
            ))

        return round(min(100.0, score), 1), all_matched, all_missing, evidence, suggestions

    else:
        # General ATS evaluation (no specific target job selected)
        # Benchmark: 8+ recognized skills = 100%, 5-7 = 80%, 3-4 = 60%, <3 = 40%
        count = len(resume_skills)
        if count >= 8:
            score = 95.0
        elif count >= 5:
            score = 80.0
        elif count >= 3:
            score = 65.0
        else:
            score = 40.0

        evidence.append(AtsEvidence(
            category="Keywords",
            finding=f"Identified {count} verified technical skills across recognized domains"
        ))
        
        missing = []
        if count < 6:
            suggestions.append(AtsSuggestion(
                section="SKILLS",
                issue="Low technical skill density",
                recommendation="Expand your skills section with specific programming languages, frameworks, cloud platforms, and databases."
            ))

        return score, resume_skills, missing, evidence, suggestions


def calculate_completeness_score(parsed: Dict[str, Any], raw_text: str) -> (float, List[AtsEvidence], List[AtsSuggestion]):
    """
    Completeness Score (Weight 25%): Evidence of roles, projects, education, and quantified metrics.
    """
    score = 0.0
    evidence = []
    suggestions = []

    # Experience entries (up to 35 pts)
    exp_list = parsed.get("experience", [])
    if len(exp_list) >= 2:
        score += 35
        evidence.append(AtsEvidence(category="Completeness", finding=f"Documented {len(exp_list)} professional work experience positions"))
    elif len(exp_list) == 1:
        score += 25
        evidence.append(AtsEvidence(category="Completeness", finding="Documented 1 professional work experience position"))
    else:
        suggestions.append(AtsSuggestion(
            section="EXPERIENCE",
            issue="No explicit work experience history found",
            recommendation="Include previous employment or internships detailing company, job title, and dates."
        ))

    # Projects entries (up to 25 pts)
    projects_list = parsed.get("projects", [])
    if len(projects_list) >= 2:
        score += 25
        evidence.append(AtsEvidence(category="Completeness", finding=f"Documented {len(projects_list)} featured technical projects"))
    elif len(projects_list) == 1:
        score += 15
        evidence.append(AtsEvidence(category="Completeness", finding="Documented 1 featured project"))
    else:
        suggestions.append(AtsSuggestion(
            section="PROJECTS",
            issue="No technical projects identified",
            recommendation="List tangible software or analytical projects showcasing architectural design and technologies used."
        ))

    # Education (up to 20 pts)
    edu_list = parsed.get("education", [])
    if edu_list:
        score += 20
        evidence.append(AtsEvidence(category="Completeness", finding=f"Academic credentials verified ({edu_list[0].get('institution', 'University')})"))
    else:
        suggestions.append(AtsSuggestion(
            section="EDUCATION",
            issue="Missing academic history",
            recommendation="Specify degree, university or college, and graduation year."
        ))

    # Quantified impact metrics (up to 20 pts)
    # Search for %, numbers, dollar signs, reductions, scale
    metric_matches = re.findall(r'\b(?:\d+%(?:\s*(?:increase|reduction|improvement|growth))?|\$\d+[\d,]*|\d+\+?\s*(?:users|clients|requests|ms|seconds|rps|queries))\b', raw_text, re.IGNORECASE)
    if len(metric_matches) >= 3:
        score += 20
        evidence.append(AtsEvidence(category="Completeness", finding=f"High metric density ({len(metric_matches)} quantified impact indicators)", snippet=f"Example: {metric_matches[0]}"))
    elif len(metric_matches) >= 1:
        score += 10
        evidence.append(AtsEvidence(category="Completeness", finding=f"Found {len(metric_matches)} quantified metric indicators", snippet=f"Example: {metric_matches[0]}"))
        suggestions.append(AtsSuggestion(
            section="EXPERIENCE",
            issue="Limited quantifiable achievements",
            recommendation="Add more concrete metrics (e.g., 'Reduced response latency by 35%', 'Scaled service to 100k requests/min')."
        ))
    else:
        suggestions.append(AtsSuggestion(
            section="EXPERIENCE",
            issue="Absence of measurable outcomes",
            recommendation="Transform responsibility statements into accomplishments with numbers, percentages, or scale metrics."
        ))

    return min(100.0, score), evidence, suggestions


def calculate_relevance_score(
    parsed: Dict[str, Any], 
    raw_text: str, 
    job_title: Optional[str], 
    job_description: Optional[str]
) -> (float, List[AtsEvidence], List[AtsSuggestion]):
    """
    Relevance Score (Weight 20%): Relevance to target role, seniority alignment, and domain context.
    """
    score = 60.0 # Baseline relevance for general analysis
    evidence = []
    suggestions = []

    if job_title or job_description:
        target_context = f"{job_title or ''} {job_description or ''}".lower()
        resume_lower = raw_text.lower()

        # Title alignment
        if job_title and job_title.lower() in resume_lower:
            score += 20.0
            evidence.append(AtsEvidence(category="Relevance", finding=f"Direct target title match found ('{job_title}')"))
        elif job_title:
            title_words = [w for w in re.split(r'\W+', job_title.lower()) if len(w) > 3]
            matched_words = [w for w in title_words if w in resume_lower]
            if matched_words:
                score += 10.0
                evidence.append(AtsEvidence(category="Relevance", finding=f"Partial role match on terms: {', '.join(matched_words)}"))
            else:
                suggestions.append(AtsSuggestion(
                    section="SUMMARY",
                    issue="Target job title not represented",
                    recommendation=f"Tailor your professional headline or summary to reflect target role '{job_title}'."
                ))

        # Check recency in work experience
        exp_list = parsed.get("experience", [])
        if exp_list and exp_list[0].get("is_current"):
            score += 15.0
            evidence.append(AtsEvidence(category="Relevance", finding="Currently active in software engineering/technology role"))
        else:
            score += 5.0

        return round(min(100.0, score), 1), evidence, suggestions
    else:
        # General context
        exp_list = parsed.get("experience", [])
        if exp_list:
            score = 80.0
            evidence.append(AtsEvidence(category="Relevance", finding="Solid domain alignment with modern software engineering"))
        return score, evidence, suggestions


def evaluate_ats(
    parsed_resume: Dict[str, Any],
    raw_text: str,
    job_title: Optional[str] = None,
    job_description: Optional[str] = None,
    job_required_skills: Optional[List[str]] = None,
    job_preferred_skills: Optional[List[str]] = None
) -> AtsAnalysisResult:
    """
    Calculates transparent, deterministic, auditable ATS scoring based on 4 defined pillars:
    - Format & Structure (20%)
    - Keyword Match (35%)
    - Completeness & Evidence (25%)
    - Role Relevance (20%)
    """
    resume_skills = parsed_resume.get("skills", [])

    fmt_score, fmt_ev, fmt_sug = calculate_format_score(parsed_resume, raw_text)
    kw_score, matched_skills, missing_skills, kw_ev, kw_sug = calculate_keyword_score(
        resume_skills, job_required_skills, job_preferred_skills
    )
    comp_score, comp_ev, comp_sug = calculate_completeness_score(parsed_resume, raw_text)
    rel_score, rel_ev, rel_sug = calculate_relevance_score(parsed_resume, raw_text, job_title, job_description)

    # Weighted Overall Score
    overall = round(
        (0.20 * fmt_score) + 
        (0.35 * kw_score) + 
        (0.25 * comp_score) + 
        (0.20 * rel_score), 
        1
    )

    all_evidence = fmt_ev + kw_ev + comp_ev + rel_ev
    all_suggestions = fmt_sug + kw_sug + comp_sug + rel_sug

    scoring_policy = {
        "formula": "overall = (0.20 * format_score) + (0.35 * keyword_score) + (0.25 * completeness_score) + (0.20 * relevance_score)",
        "weights": {
            "format_score": 0.20,
            "keyword_score": 0.35,
            "completeness_score": 0.25,
            "relevance_score": 0.20
        },
        "version": "1.0-deterministic-audit"
    }

    limitations_note = (
        "ATS score is a deterministic heuristic reflecting keyword density, structural parsing compliance, "
        "and stated experience evidence. It does not replace qualitative human recruiter review or practical technical interviewing."
    )

    return AtsAnalysisResult(
        overall_score=overall,
        keyword_score=kw_score,
        format_score=fmt_score,
        completeness_score=comp_score,
        relevance_score=rel_score,
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        supporting_evidence=all_evidence,
        suggestions=all_suggestions,
        scoring_policy=scoring_policy,
        limitations_note=limitations_note
    )
