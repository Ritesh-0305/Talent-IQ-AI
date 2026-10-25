package com.talentiq.repository;

import com.talentiq.entity.ParsedResumeData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ParsedResumeDataRepository extends JpaRepository<ParsedResumeData, Long> {
    Optional<ParsedResumeData> findByResumeVersionId(Long resumeVersionId);
}
