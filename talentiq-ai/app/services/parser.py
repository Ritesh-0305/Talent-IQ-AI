import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class ContactInfo(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    website: Optional[str] = None

class EducationItem(BaseModel):
    institution: str
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    year: Optional[str] = None
    gpa: Optional[str] = None

class ExperienceItem(BaseModel):
    company: str
    title: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_current: bool = False
    location: Optional[str] = None
    description: Optional[str] = None
    bullet_points: List[str] = Field(default_factory=list)

class ProjectItem(BaseModel):
    name: str
    description: Optional[str] = None
    technologies: List[str] = Field(default_factory=list)
    link: Optional[str] = None

class CertificationItem(BaseModel):
    name: str
    issuer: Optional[str] = None
    year: Optional[str] = None

class ParsedResumeSchema(BaseModel):
    contact: ContactInfo = Field(default_factory=ContactInfo)
    skills: List[str] = Field(default_factory=list)
    education: List[EducationItem] = Field(default_factory=list)
    experience: List[ExperienceItem] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    certifications: List[CertificationItem] = Field(default_factory=list)
    summary: Optional[str] = None
    raw_text: Optional[str] = None
    parse_status: str = "COMPLETED"
    parse_warnings: List[str] = Field(default_factory=list)


# Comprehensive skill bank across Software Engineering, Cloud, Data, and AI
KNOWN_SKILLS = [
    # Languages
    "Java", "Python", "JavaScript", "TypeScript", "C++", "C#", "Go", "Golang", "Rust", "Kotlin", "Swift",
    "PHP", "Ruby", "Scala", "R", "SQL", "HTML", "CSS", "Bash", "Shell",
    # Backend & Frameworks
    "Spring", "Spring Boot", "Spring MVC", "Hibernate", "JPA", "Node.js", "Express", "NestJS", "FastAPI",
    "Django", "Flask", ".NET", ".NET Core", "ASP.NET", "Ruby on Rails", "GraphQL", "REST", "RESTful APIs",
    "gRPC", "Microservices", "Kafka", "RabbitMQ", "Apache Spark", "Airflow",
    # Frontend
    "React", "React.js", "Next.js", "Vue", "Vue.js", "Angular", "Redux", "Tailwind CSS", "Bootstrap",
    "HTML5", "CSS3", "Webpack", "Vite", "Material UI",
    # Databases & Storage
    "MySQL", "PostgreSQL", "Postgres", "MongoDB", "Redis", "Elasticsearch", "Cassandra", "Oracle",
    "SQLite", "Firebase", "Firestore", "DynamoDB", "BigQuery", "Snowflake",
    # Cloud & DevOps
    "AWS", "Amazon Web Services", "Azure", "GCP", "Google Cloud", "Docker", "Kubernetes", "K8s",
    "Terraform", "CI/CD", "Jenkins", "GitHub Actions", "GitLab CI", "Linux", "Git", "Nginx",
    "Prometheus", "Grafana",
    # AI / ML
    "Machine Learning", "Deep Learning", "NLP", "Computer Vision", "TensorFlow", "PyTorch",
    "Scikit-Learn", "Hugging Face", "spaCy", "NLTK", "OpenAI", "Gemini", "Pandas", "NumPy"
]

EMAIL_REGEX = re.compile(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+')
PHONE_REGEX = re.compile(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}')
LINKEDIN_REGEX = re.compile(r'linkedin\.com/in/[a-zA-Z0-9_-]+', re.IGNORECASE)
GITHUB_REGEX = re.compile(r'github\.com/[a-zA-Z0-9_-]+', re.IGNORECASE)

SECTION_HEADERS = {
    "experience": ["work experience", "experience", "employment history", "professional experience", "work history"],
    "education": ["education", "academic background", "qualifications", "academics"],
    "skills": ["skills", "technical skills", "technologies", "core competencies", "skills & tools", "tools & technologies"],
    "projects": ["projects", "personal projects", "academic projects", "key projects"],
    "certifications": ["certifications", "licenses & certifications", "certificates", "credentials"],
    "summary": ["professional summary", "summary", "profile", "about me", "objective", "career objective"]
}

def extract_contact_info(text: str) -> ContactInfo:
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    contact = ContactInfo()

    # Name heuristic: typically top lines that don't match email, phone, or url
    for line in lines[:5]:
        if not EMAIL_REGEX.search(line) and not PHONE_REGEX.search(line) and not "http" in line.lower() and not "github" in line.lower() and len(line.split()) <= 4 and re.match(r'^[A-Za-z\s.\'-]+$', line):
            contact.name = line.strip()
            break

    # Email
    email_match = EMAIL_REGEX.search(text)
    if email_match:
        contact.email = email_match.group(0)

    # Phone
    phone_match = PHONE_REGEX.search(text)
    if phone_match:
        contact.phone = phone_match.group(0)

    # LinkedIn
    linkedin_match = LINKEDIN_REGEX.search(text)
    if linkedin_match:
        contact.linkedin = "https://" + linkedin_match.group(0)

    # GitHub
    github_match = GITHUB_REGEX.search(text)
    if github_match:
        contact.github = "https://" + github_match.group(0)

    # Location heuristic (e.g. "San Francisco, CA" or "Bangalore, India" or "Remote")
    loc_match = re.search(r'\b([A-Z][a-zA-Z\s]+,\s*[A-Z]{2}|[A-Z][a-zA-Z]+,\s*[A-Z][a-zA-Z]+)\b', text)
    if loc_match:
        contact.location = loc_match.group(0)

    return contact


def extract_skills(text: str) -> List[str]:
    found_skills = set()
    text_lower = f" {text.lower()} "

    for skill in KNOWN_SKILLS:
        # Match as word boundary or exact token
        escaped_skill = re.escape(skill.lower())
        pattern = rf'(?:^|[\s,;/()•\-])({escaped_skill})(?:$|[\s,;/()•\-])'
        if re.search(pattern, text_lower):
            found_skills.add(skill)

    # Preserve consistent sorting
    return sorted(list(found_skills))


def segment_sections(text: str) -> Dict[str, str]:
    """
    Partitions the raw text into sections based on recognized headers.
    """
    lines = text.split("\n")
    sections: Dict[str, List[str]] = {}
    current_section = "header"
    sections[current_section] = []

    for line in lines:
        cleaned = line.strip().lower().rstrip(":")
        matched_section = None
        for sec_name, headers in SECTION_HEADERS.items():
            if cleaned in headers or any(cleaned == h for h in headers):
                matched_section = sec_name
                break
        
        if matched_section:
            current_section = matched_section
            if current_section not in sections:
                sections[current_section] = []
        else:
            if current_section not in sections:
                sections[current_section] = []
            sections[current_section].append(line)

    return {sec: "\n".join(content).strip() for sec, content in sections.items() if content}


def parse_education(sec_text: str) -> List[EducationItem]:
    if not sec_text:
        return []
    
    items: List[EducationItem] = []
    lines = [l.strip() for l in sec_text.split("\n") if l.strip()]
    
    current_inst = None
    current_degree = None
    current_year = None

    for line in lines:
        # Check for year (e.g. 2018 - 2022 or 2020)
        year_match = re.search(r'\b(20\d\d|19\d\d)(?:\s*[-–]\s*(20\d\d|Present))?\b', line, re.IGNORECASE)
        # Check for degree keywords
        deg_match = re.search(r'\b(Bachelor|Master|B\.S\.|M\.S\.|B\.Tech|M\.Tech|Ph\.D\.|B\.E\.|Associate|Diploma)\b.*', line, re.IGNORECASE)
        
        if any(edu_term in line.lower() for edu_term in ["university", "college", "institute", "school", "academy", "polytechnic"]):
            if current_inst:
                items.append(EducationItem(
                    institution=current_inst,
                    degree=current_degree,
                    year=current_year
                ))
                current_degree = None
                current_year = None
            current_inst = line
        elif deg_match:
            current_degree = line
        
        if year_match and not current_year:
            current_year = year_match.group(0)

    if current_inst:
        items.append(EducationItem(
            institution=current_inst,
            degree=current_degree,
            year=current_year
        ))
    elif lines:
        # Fallback if no specific university keyword
        items.append(EducationItem(
            institution=lines[0],
            degree=lines[1] if len(lines) > 1 else None,
            year=current_year
        ))

    return items


def parse_experience(sec_text: str) -> List[ExperienceItem]:
    if not sec_text:
        return []

    items: List[ExperienceItem] = []
    blocks = re.split(r'\n(?=[A-Z0-9][A-Za-z0-9\s,\-–|]{3,50}\s*(?:20\d\d|19\d\d|Present))', sec_text)
    
    if len(blocks) <= 1:
        # Split by empty lines
        blocks = [b.strip() for b in sec_text.split("\n\n") if b.strip()]

    for block in blocks:
        lines = [l.strip() for l in block.split("\n") if l.strip()]
        if not lines:
            continue
        
        header_line = lines[0]
        # Look for dates
        date_match = re.search(r'\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)?\s*(?:19\d\d|20\d\d)\s*[-–]\s*(?:Present|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)?\s*(?:19\d\d|20\d\d)))\b', header_line, re.IGNORECASE)
        
        start_date = None
        end_date = None
        is_current = False
        
        if date_match:
            date_str = date_match.group(1)
            parts = re.split(r'[-–]', date_str)
            if len(parts) == 2:
                start_date = parts[0].strip()
                end_date = parts[1].strip()
                if "present" in end_date.lower():
                    is_current = True
        
        # Company and title guessing
        company = header_line
        title = "Software Professional"
        if len(lines) > 1 and not lines[1].startswith(("•", "-", "*")):
            title = lines[1]
            bullet_start = 2
        else:
            bullet_start = 1

        bullets = [l.lstrip("•-* ").strip() for l in lines[bullet_start:] if l.strip()]

        items.append(ExperienceItem(
            company=company,
            title=title,
            start_date=start_date,
            end_date=end_date,
            is_current=is_current,
            bullet_points=bullets,
            description="\n".join(bullets)
        ))

    return items


def parse_projects(sec_text: str) -> List[ProjectItem]:
    if not sec_text:
        return []

    items: List[ProjectItem] = []
    lines = [l.strip() for l in sec_text.split("\n") if l.strip()]
    
    current_name = None
    current_bullets = []

    for line in lines:
        if line.startswith(("•", "-", "*")):
            current_bullets.append(line.lstrip("•-* "))
        else:
            if current_name:
                items.append(ProjectItem(
                    name=current_name,
                    description="; ".join(current_bullets),
                    technologies=[s for s in KNOWN_SKILLS if s.lower() in (current_name + " " + " ".join(current_bullets)).lower()]
                ))
                current_bullets = []
            current_name = line

    if current_name:
        items.append(ProjectItem(
            name=current_name,
            description="; ".join(current_bullets),
            technologies=[s for s in KNOWN_SKILLS if s.lower() in (current_name + " " + " ".join(current_bullets)).lower()]
        ))

    return items


def parse_certifications(sec_text: str) -> List[CertificationItem]:
    if not sec_text:
        return []
    
    items: List[CertificationItem] = []
    lines = [l.strip() for l in sec_text.split("\n") if l.strip()]
    for line in lines:
        cleaned = line.lstrip("•-* ")
        year_match = re.search(r'\b(20\d\d|19\d\d)\b', cleaned)
        year = year_match.group(0) if year_match else None
        items.append(CertificationItem(
            name=cleaned,
            year=year
        ))
    return items


def parse_resume_content(raw_text: str, metadata: Optional[Dict[str, Any]] = None) -> ParsedResumeSchema:
    """
    Parses plain extracted text into a structured, validated ParsedResumeSchema.
    """
    warnings = []
    if metadata and metadata.get("low_text_warning"):
        warnings.append(metadata.get("warning_message", "Low extractable text detected."))

    if not raw_text or len(raw_text.strip()) < 30:
        return ParsedResumeSchema(
            raw_text=raw_text,
            parse_status="LOW_TEXT_WARNING" if raw_text else "FAILED",
            parse_warnings=warnings if warnings else ["Document has minimal or unreadable text."]
        )

    sections = segment_sections(raw_text)
    
    contact = extract_contact_info(raw_text)
    skills = extract_skills(raw_text)
    education = parse_education(sections.get("education", ""))
    experience = parse_experience(sections.get("experience", ""))
    projects = parse_projects(sections.get("projects", ""))
    certifications = parse_certifications(sections.get("certifications", ""))
    summary = sections.get("summary")

    return ParsedResumeSchema(
        contact=contact,
        skills=skills,
        education=education,
        experience=experience,
        projects=projects,
        certifications=certifications,
        summary=summary,
        raw_text=raw_text,
        parse_status="COMPLETED",
        parse_warnings=warnings
    )
