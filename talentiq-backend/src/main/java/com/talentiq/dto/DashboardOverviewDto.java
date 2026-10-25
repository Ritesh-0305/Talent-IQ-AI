package com.talentiq.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardOverviewDto {
    private String role;
    private String welcomeName;
    private long totalApplications;
    private long activeJobs;
    private long totalInterviews;
    private long totalUsers; // for admin
    private List<String> recentActivity;
}
