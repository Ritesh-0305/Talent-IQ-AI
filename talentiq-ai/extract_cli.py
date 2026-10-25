import sys
import json
import os
import warnings
warnings.filterwarnings("ignore")

from app.services.extractor import extract_resume_text, ExtractionError
from app.services.parser import parse_resume_content
from app.services.ats_scorer import evaluate_ats

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing file path argument"}), file=sys.stderr)
        sys.exit(1)

    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(json.dumps({"error": f"File not found: {file_path}"}), file=sys.stderr)
        sys.exit(1)

    with open(file_path, "rb") as f:
        file_bytes = f.read()

    filename = os.path.basename(file_path)

    # Optional mode: ats calculation
    if len(sys.argv) >= 3 and sys.argv[2] == "--ats":
        # Argument 3 is a path to JSON payload containing target job info and parsed data
        payload_path = sys.argv[3]
        with open(payload_path, "r", encoding="utf-8") as f:
            payload = json.load(f)

        parsed_data = payload.get("parsed_resume", {})
        raw_text = payload.get("raw_text", "")
        job_title = payload.get("job_title")
        job_desc = payload.get("job_description")
        req_skills = payload.get("job_required_skills", [])
        pref_skills = payload.get("job_preferred_skills", [])

        result = evaluate_ats(
            parsed_resume=parsed_data,
            raw_text=raw_text,
            job_title=job_title,
            job_description=job_desc,
            job_required_skills=req_skills,
            job_preferred_skills=pref_skills
        )
        print(json.dumps(result.model_dump()))
        sys.exit(0)

    try:
        raw_text, metadata = extract_resume_text(filename, file_bytes)
        parsed = parse_resume_content(raw_text, metadata)
        print(json.dumps(parsed.model_dump()))
    except ExtractionError as e:
        print(json.dumps({"error": str(e), "parse_status": "FAILED"}), file=sys.stderr)
        sys.exit(2)
    except Exception as e:
        print(json.dumps({"error": f"Extraction error: {str(e)}", "parse_status": "FAILED"}), file=sys.stderr)
        sys.exit(3)

if __name__ == "__main__":
    main()
