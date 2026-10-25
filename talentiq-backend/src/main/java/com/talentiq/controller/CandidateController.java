package com.talentiq.controller;

import com.talentiq.dto.CandidateProfileDto;
import com.talentiq.dto.DashboardOverviewDto;
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
        CandidateProfileDto profile = candidateService.getProfile(userPrincipal.getId());
        DashboardOverviewDto overview = DashboardOverviewDto.builder()
                .role("CANDIDATE")
                .welcomeName(profile.getFirstName() + " " + profile.getLastName())
                .totalApplications(0)
                .activeJobs(0)
                .totalInterviews(0)
                .recentActivity(Collections.emptyList())
                .build();
        return ResponseEntity.ok(overview);
    }
}
