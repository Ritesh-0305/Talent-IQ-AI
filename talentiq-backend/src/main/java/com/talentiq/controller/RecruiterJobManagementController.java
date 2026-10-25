package com.talentiq.controller;

import com.talentiq.dto.AddNoteRequest;
import com.talentiq.dto.ApplicationDto;
import com.talentiq.dto.JobDto;
import com.talentiq.dto.UpdateApplicationStatusRequest;
import com.talentiq.security.UserPrincipal;
import com.talentiq.service.ApplicationService;
import com.talentiq.service.JobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/recruiter")
@RequiredArgsConstructor
@PreAuthorize("hasRole('RECRUITER')")
public class RecruiterJobManagementController {

    private final JobService jobService;
    private final ApplicationService applicationService;
    private final com.talentiq.service.ResumeService resumeService;
    private final com.talentiq.repository.UserRepository userRepository;

    @GetMapping("/applications/{applicationId}/resume")
    public ResponseEntity<com.talentiq.dto.ParsedResumeDto> getApplicantResume(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long applicationId,
            @RequestParam(defaultValue = "false") boolean anonymized
    ) {
        com.talentiq.entity.Application app = applicationService.getApplicationForRecruiter(userPrincipal.getId(), applicationId);
        if (app.getResumeVersion() == null) {
            throw new com.talentiq.exception.ResourceNotFoundException("No resume attached to this application.");
        }
        com.talentiq.entity.User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new com.talentiq.exception.ResourceNotFoundException("User not found"));
        com.talentiq.dto.ParsedResumeDto parsed = resumeService.getParsedResume(user, app.getResumeVersion().getId(), anonymized);
        return ResponseEntity.ok(parsed);
    }

    @PostMapping("/jobs")
    public ResponseEntity<JobDto> createJob(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody JobDto dto
    ) {
        JobDto created = jobService.createJob(userPrincipal.getId(), dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/jobs/{jobId}")
    public ResponseEntity<JobDto> updateJob(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long jobId,
            @Valid @RequestBody JobDto dto
    ) {
        JobDto updated = jobService.updateJob(userPrincipal.getId(), jobId, dto);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/jobs/{jobId}/publish")
    public ResponseEntity<JobDto> publishJob(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long jobId
    ) {
        JobDto published = jobService.publishJob(userPrincipal.getId(), jobId);
        return ResponseEntity.ok(published);
    }

    @PatchMapping("/jobs/{jobId}/close")
    public ResponseEntity<JobDto> closeJob(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long jobId
    ) {
        JobDto closed = jobService.closeJob(userPrincipal.getId(), jobId);
        return ResponseEntity.ok(closed);
    }

    @GetMapping("/jobs")
    public ResponseEntity<Page<JobDto>> getMyJobs(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<JobDto> jobs = jobService.getRecruiterJobs(userPrincipal.getId(), pageRequest);
        return ResponseEntity.ok(jobs);
    }

    @GetMapping("/jobs/{jobId}/applicants")
    public ResponseEntity<Page<ApplicationDto>> getJobApplicants(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long jobId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("appliedAt").descending());
        Page<ApplicationDto> applicants = applicationService.getJobApplicants(userPrincipal.getId(), jobId, status, pageRequest);
        return ResponseEntity.ok(applicants);
    }

    @PatchMapping("/applications/{applicationId}/status")
    public ResponseEntity<ApplicationDto> updateStatus(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long applicationId,
            @Valid @RequestBody UpdateApplicationStatusRequest request
    ) {
        ApplicationDto updated = applicationService.updateStatus(userPrincipal.getId(), applicationId, request);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/applications/{applicationId}/shortlist")
    public ResponseEntity<ApplicationDto> toggleShortlist(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long applicationId
    ) {
        ApplicationDto toggled = applicationService.toggleShortlist(userPrincipal.getId(), applicationId);
        return ResponseEntity.ok(toggled);
    }

    @PostMapping("/applications/{applicationId}/notes")
    public ResponseEntity<ApplicationDto> addRecruiterNote(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long applicationId,
            @Valid @RequestBody AddNoteRequest request
    ) {
        ApplicationDto updated = applicationService.addRecruiterNote(userPrincipal.getId(), applicationId, request);
        return ResponseEntity.ok(updated);
    }
}
