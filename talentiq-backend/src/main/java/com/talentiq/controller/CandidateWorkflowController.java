package com.talentiq.controller;

import com.talentiq.dto.ApplicationDto;
import com.talentiq.dto.NotificationDto;
import com.talentiq.security.UserPrincipal;
import com.talentiq.service.ApplicationService;
import com.talentiq.service.NotificationService;
import lombok.Data;
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
@RequestMapping("/api/v1/candidates")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CANDIDATE')")
public class CandidateWorkflowController {

    private final ApplicationService applicationService;
    private final NotificationService notificationService;

    @Data
    public static class ApplyJobRequest {
        private String coverLetter;
        private Long resumeVersionId;
    }

    @PostMapping("/jobs/{jobId}/apply")
    public ResponseEntity<ApplicationDto> applyForJob(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long jobId,
            @RequestBody(required = false) ApplyJobRequest request
    ) {
        String coverLetter = request != null ? request.getCoverLetter() : null;
        Long resumeVerId = request != null ? request.getResumeVersionId() : null;
        ApplicationDto app = applicationService.applyForJob(userPrincipal.getId(), jobId, coverLetter, resumeVerId);
        return new ResponseEntity<>(app, HttpStatus.CREATED);
    }

    @GetMapping("/applications")
    public ResponseEntity<Page<ApplicationDto>> getApplications(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("appliedAt").descending());
        Page<ApplicationDto> applications = applicationService.getCandidateApplications(userPrincipal.getId(), pageRequest);
        return ResponseEntity.ok(applications);
    }

    @PatchMapping("/applications/{applicationId}/withdraw")
    public ResponseEntity<ApplicationDto> withdrawApplication(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long applicationId
    ) {
        ApplicationDto app = applicationService.withdrawApplication(userPrincipal.getId(), applicationId);
        return ResponseEntity.ok(app);
    }

    @GetMapping("/notifications")
    public ResponseEntity<Page<NotificationDto>> getNotifications(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<NotificationDto> notifications = notificationService.getUserNotifications(userPrincipal.getId(), pageRequest);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/notifications/unread-count")
    public ResponseEntity<Long> getUnreadNotificationCount(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        long count = notificationService.getUnreadCount(userPrincipal.getId());
        return ResponseEntity.ok(count);
    }

    @PatchMapping("/notifications/{id}/read")
    public ResponseEntity<Void> markNotificationAsRead(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long id
    ) {
        notificationService.markAsRead(userPrincipal.getId(), id);
        return ResponseEntity.ok().build();
    }
}
