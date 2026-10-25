package com.talentiq.entity;

import com.talentiq.enums.AtsAnalysisStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ats_analyses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AtsAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_version_id", nullable = false)
    private ResumeVersion resumeVersion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id")
    private Job job;

    @Column(name = "overall_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal overallScore;

    @Column(name = "keyword_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal keywordScore;

    @Column(name = "format_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal formatScore;

    @Column(name = "completeness_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal completenessScore;

    @Column(name = "relevance_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal relevanceScore;

    @Column(name = "matched_skills_json", columnDefinition = "LONGTEXT")
    private String matchedSkillsJson;

    @Column(name = "missing_skills_json", columnDefinition = "LONGTEXT")
    private String missingSkillsJson;

    @Column(name = "supporting_evidence_json", columnDefinition = "LONGTEXT")
    private String supportingEvidenceJson;

    @Column(name = "suggestions_json", columnDefinition = "LONGTEXT")
    private String suggestionsJson;

    @Column(name = "scoring_policy_json", columnDefinition = "LONGTEXT")
    private String scoringPolicyJson;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "analysis_status", nullable = false, length = 50)
    private AtsAnalysisStatus analysisStatus = AtsAnalysisStatus.COMPLETED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by", nullable = false)
    private User requestedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
