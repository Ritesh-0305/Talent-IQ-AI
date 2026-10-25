-- V6: Resumes, Resume Versions, Parsed Data, and ATS Analyses
CREATE TABLE IF NOT EXISTS resumes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    candidate_id BIGINT NOT NULL,
    active_version_id BIGINT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_resumes_candidate FOREIGN KEY (candidate_id) REFERENCES candidate_profiles (id) ON DELETE CASCADE,
    INDEX idx_resumes_candidate (candidate_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS resume_versions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    resume_id BIGINT NOT NULL,
    version_number INT NOT NULL,
    label VARCHAR(100) NULL,
    storage_path VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    upload_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    parsed_at TIMESTAMP NULL,
    CONSTRAINT fk_resume_versions_resume FOREIGN KEY (resume_id) REFERENCES resumes (id) ON DELETE CASCADE,
    INDEX idx_versions_resume (resume_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS parsed_resume_data (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    resume_version_id BIGINT NOT NULL UNIQUE,
    raw_text LONGTEXT NULL,
    contact_json JSON NULL,
    skills_json JSON NULL,
    education_json JSON NULL,
    experience_json JSON NULL,
    projects_json JSON NULL,
    certifications_json JSON NULL,
    summary_text TEXT NULL,
    parse_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    parsed_at TIMESTAMP NULL,
    CONSTRAINT fk_parsed_version FOREIGN KEY (resume_version_id) REFERENCES resume_versions (id) ON DELETE CASCADE,
    INDEX idx_parsed_status (parse_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ats_analyses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    resume_version_id BIGINT NOT NULL,
    job_id BIGINT NULL,
    overall_score DECIMAL(5,2) NOT NULL,
    keyword_score DECIMAL(5,2) NOT NULL,
    format_score DECIMAL(5,2) NOT NULL,
    completeness_score DECIMAL(5,2) NOT NULL,
    relevance_score DECIMAL(5,2) NOT NULL,
    matched_skills_json JSON NULL,
    missing_skills_json JSON NULL,
    supporting_evidence_json JSON NULL,
    suggestions_json JSON NULL,
    scoring_policy_json JSON NULL,
    analysis_status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    requested_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ats_version FOREIGN KEY (resume_version_id) REFERENCES resume_versions (id) ON DELETE CASCADE,
    CONSTRAINT fk_ats_job FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE SET NULL,
    CONSTRAINT fk_ats_user FOREIGN KEY (requested_by) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_ats_version (resume_version_id),
    INDEX idx_ats_job (job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add resume_version_id to applications
ALTER TABLE applications ADD COLUMN resume_version_id BIGINT NULL;
ALTER TABLE applications ADD CONSTRAINT fk_applications_resume_ver FOREIGN KEY (resume_version_id) REFERENCES resume_versions (id) ON DELETE SET NULL;
