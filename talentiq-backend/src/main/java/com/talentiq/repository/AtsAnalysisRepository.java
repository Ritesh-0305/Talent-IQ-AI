package com.talentiq.repository;

import com.talentiq.entity.AtsAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AtsAnalysisRepository extends JpaRepository<AtsAnalysis, Long> {
    List<AtsAnalysis> findByResumeVersionIdOrderByCreatedAtDesc(Long resumeVersionId);
    Optional<AtsAnalysis> findTopByResumeVersionIdOrderByCreatedAtDesc(Long resumeVersionId);
    Optional<AtsAnalysis> findTopByResumeVersionIdAndJobIdOrderByCreatedAtDesc(Long resumeVersionId, Long jobId);
}
