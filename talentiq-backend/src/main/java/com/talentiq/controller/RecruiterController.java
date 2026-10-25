package com.talentiq.controller;

import com.talentiq.dto.DashboardOverviewDto;
import com.talentiq.dto.RecruiterProfileDto;
import com.talentiq.security.UserPrincipal;
import com.talentiq.service.RecruiterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;

@RestController
@RequestMapping("/api/v1/recruiter")
@RequiredArgsConstructor
@PreAuthorize("hasRole('RECRUITER')")
public class RecruiterController {

    private final RecruiterService recruiterService;

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
        RecruiterProfileDto profile = recruiterService.getProfile(userPrincipal.getId());
        DashboardOverviewDto overview = DashboardOverviewDto.builder()
                .role("RECRUITER")
                .welcomeName(profile.getFirstName() + " " + profile.getLastName())
                .totalApplications(0)
                .activeJobs(0)
                .totalInterviews(0)
                .recentActivity(Collections.emptyList())
                .build();
        return ResponseEntity.ok(overview);
    }
}
