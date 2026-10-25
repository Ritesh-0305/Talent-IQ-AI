package com.talentiq.controller;

import com.talentiq.dto.CandidateProfileDto;
import com.talentiq.dto.DashboardOverviewDto;
import com.talentiq.entity.CandidateProfile;
import com.talentiq.enums.JobStatus;
import com.talentiq.repository.ApplicationRepository;
import com.talentiq.repository.CandidateProfileRepository;
import com.talentiq.repository.JobRepository;
import com.talentiq.security.UserPrincipal;
import com.talentiq.service.CandidateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;

@RestController
@RequestMapping("/api/v1/candidates")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CANDIDATE')")
public class CandidateController {

    private final CandidateService candidateService;
    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final CandidateProfileRepository candidateProfileRepository;

    @GetMapping("/me")
    public ResponseEntity<CandidateProfileDto> getProfile(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        CandidateProfileDto profile = candidateService.getProfile(userPrincipal.getId());
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/me")
    public ResponseEntity<CandidateProfileDto> updateProfile(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody CandidateProfileDto dto
    ) {
        CandidateProfileDto updated = candidateService.updateProfile(userPrincipal.getId(), dto);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardOverviewDto> getDashboardOverview(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        CandidateProfile profile = candidateProfileRepository.findByUserId(userPrincipal.getId())
                .orElse(null);

        long totalApps = 0;
        if (profile != null) {
            totalApps = applicationRepository.countByCandidate(profile);
        }
        long activePublishedJobs = jobRepository.countByStatus(JobStatus.PUBLISHED);

        DashboardOverviewDto overview = DashboardOverviewDto.builder()
                .role("CANDIDATE")
                .welcomeName(profile != null ? (profile.getFirstName() + " " + profile.getLastName()) : "Candidate")
                .totalApplications(totalApps)
                .activeJobs(activePublishedJobs)
                .totalInterviews(0)
                .recentActivity(Collections.emptyList())
                .build();
        return ResponseEntity.ok(overview);
    }
}
