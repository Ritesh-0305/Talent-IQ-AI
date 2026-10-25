package com.talentiq.controller;

import com.talentiq.dto.DashboardOverviewDto;
import com.talentiq.entity.User;
import com.talentiq.repository.CompanyRepository;
import com.talentiq.repository.UserRepository;
import com.talentiq.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardOverviewDto> getDashboardOverview(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        long totalUsers = userRepository.count();
        DashboardOverviewDto overview = DashboardOverviewDto.builder()
                .role("ADMIN")
                .welcomeName("Administrator (" + userPrincipal.getEmail() + ")")
                .totalUsers(totalUsers)
                .totalApplications(0)
                .activeJobs(0)
                .totalInterviews(0)
                .recentActivity(Collections.singletonList("System operating normally - Database backed metrics"))
                .build();
        return ResponseEntity.ok(overview);
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }
}
