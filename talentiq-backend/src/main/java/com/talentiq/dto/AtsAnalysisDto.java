package com.talentiq.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AtsAnalysisDto {
    private Long id;
    private Long resumeVersionId;
    private Long jobId;
    private String jobTitle;
    private BigDecimal overallScore;
    private BigDecimal keywordScore;
    private BigDecimal formatScore;
    private BigDecimal completenessScore;
    private BigDecimal relevanceScore;
    private List<String> matchedSkills;
    private List<String> missingSkills;
    private List<Map<String, Object>> supportingEvidence;
    private List<Map<String, Object>> suggestions;
    private Map<String, Object> scoringPolicy;
    private String limitationsNote;
    private LocalDateTime completedAt;
}
