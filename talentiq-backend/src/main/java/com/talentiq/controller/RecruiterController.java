package com.talentiq.controller;

import com.talentiq.dto.DashboardOverviewDto;
import com.talentiq.dto.RecruiterProfileDto;
import com.talentiq.entity.Job;
import com.talentiq.entity.RecruiterProfile;
import com.talentiq.enums.JobStatus;
import com.talentiq.repository.ApplicationRepository;
import com.talentiq.repository.JobRepository;
import com.talentiq.repository.RecruiterProfileRepository;
import com.talentiq.security.UserPrincipal;
import com.talentiq.service.RecruiterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/v1/recruiter")
@RequiredArgsConstructor
@PreAuthorize("hasRole('RECRUITER')")
public class RecruiterController {

    private final RecruiterService recruiterService;
    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;
    private final RecruiterProfileRepository recruiterProfileRepository;

    @GetMapping("/me")
    public ResponseEntity<RecruiterProfileDto> getProfile(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        RecruiterProfileDto profile = recruiterService.getProfile(userPrincipal.getId());
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/me")
    public ResponseEntity<RecruiterProfileDto> updateProfile(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody RecruiterProfileDto dto
    ) {
        RecruiterProfileDto updated = recruiterService.updateProfile(userPrincipal.getId(), dto);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardOverviewDto> getDashboardOverview(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        RecruiterProfile recruiter = recruiterProfileRepository.findByUserId(userPrincipal.getId())
                .orElse(null);

        long activeJobs = 0;
        long totalApplicants = 0;

        if (recruiter != null) {
            activeJobs = jobRepository.countByPostedByAndStatus(recruiter, JobStatus.PUBLISHED);
            List<Job> myJobs = jobRepository.findByPostedBy(recruiter);
            for (Job j : myJobs) {
                totalApplicants += applicationRepository.countByJob(j);
            }
        }

        DashboardOverviewDto overview = DashboardOverviewDto.builder()
                .role("RECRUITER")
                .welcomeName(recruiter != null ? (recruiter.getFirstName() + " " + recruiter.getLastName()) : "Recruiter")
                .totalApplications(totalApplicants)
                .activeJobs(activeJobs)
                .totalInterviews(0)
                .recentActivity(Collections.emptyList())
                .build();
        return ResponseEntity.ok(overview);
    }
}
