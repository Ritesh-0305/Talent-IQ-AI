package com.talentiq.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobDto {

    private Long id;
    private Long companyId;
    private String companyName;
    private String companyLogoUrl;
    private Long postedById;
    private String recruiterName;

    @NotBlank(message = "Job title is required")
    private String title;

    @NotBlank(message = "Job description is required")
    private String description;

    @NotBlank(message = "Job location is required")
    private String location;

    private String jobType;
    private BigDecimal salaryMin;
    private BigDecimal salaryMax;
    private String salaryCurrency;
    private boolean remote;
    private String status;
    private LocalDateTime publishedAt;
    private LocalDateTime closedAt;
    private LocalDateTime createdAt;

    private List<JobRequirementDto> requirements;
    private List<JobSkillDto> skills;
    private long applicationCount;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JobRequirementDto {
        private Long id;
        private String requirement;
        private boolean required;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JobSkillDto {
        private Long id;
        private String skillName;
        private boolean required;
    }
}
