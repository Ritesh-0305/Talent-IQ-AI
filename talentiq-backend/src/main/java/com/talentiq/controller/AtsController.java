package com.talentiq.controller;

import com.talentiq.dto.AtsAnalysisDto;
import com.talentiq.dto.AtsAnalysisRequest;
import com.talentiq.entity.User;
import com.talentiq.exception.ResourceNotFoundException;
import com.talentiq.repository.UserRepository;
import com.talentiq.security.UserPrincipal;
import com.talentiq.service.AtsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ats")
@RequiredArgsConstructor
public class AtsController {

    private final AtsService atsService;
    private final UserRepository userRepository;

    @PostMapping("/analyze")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AtsAnalysisDto> analyzeResume(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody AtsAnalysisRequest request
    ) {
        User user = getUser(userPrincipal);
        AtsAnalysisDto dto = atsService.analyzeResumeAts(user, request);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/analyses/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AtsAnalysisDto> getAnalysis(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id
    ) {
        User user = getUser(userPrincipal);
        AtsAnalysisDto dto = atsService.getAtsAnalysisById(user, id);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/analyses/resume/{versionId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AtsAnalysisDto>> getAnalysesForResume(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long versionId
    ) {
        User user = getUser(userPrincipal);
        List<AtsAnalysisDto> list = atsService.getAnalysesForResumeVersion(user, versionId);
        return ResponseEntity.ok(list);
    }

    private User getUser(UserPrincipal principal) {
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + principal.getId()));
    }
}
