package com.talentiq.service;

import com.talentiq.dto.AddNoteRequest;
import com.talentiq.dto.ApplicationDto;
import com.talentiq.dto.UpdateApplicationStatusRequest;
import com.talentiq.entity.*;
import com.talentiq.enums.ApplicationStatus;
import com.talentiq.enums.JobStatus;
import com.talentiq.enums.NotificationType;
import com.talentiq.exception.BadRequestException;
import com.talentiq.exception.ForbiddenException;
import com.talentiq.exception.ResourceNotFoundException;
import com.talentiq.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final ApplicationStatusHistoryRepository statusHistoryRepository;
    private final RecruiterNoteRepository recruiterNoteRepository;
    private final JobRepository jobRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final RecruiterProfileRepository recruiterProfileRepository;
    private final NotificationService notificationService;

    @Transactional
    public ApplicationDto applyForJob(Long candidateUserId, Long jobId, String coverLetter) {
        CandidateProfile candidate = candidateProfileRepository.findByUserId(candidateUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate profile not found for user: " + candidateUserId));

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found with ID: " + jobId));

        if (job.getStatus() != JobStatus.PUBLISHED) {
            throw new BadRequestException("Applications can only be submitted for PUBLISHED job openings.");
        }

        if (applicationRepository.existsByCandidateAndJob(candidate, job)) {
            throw new BadRequestException("You have already submitted an application for this position.");
        }

        Application application = Application.builder()
                .job(job)
                .candidate(candidate)
                .coverLetterText(coverLetter)
                .status(ApplicationStatus.SUBMITTED)
                .shortlisted(false)
                .build();

        application = applicationRepository.save(application);

        // Record Initial History
        ApplicationStatusHistory history = ApplicationStatusHistory.builder()
                .application(application)
                .fromStatus(null)
                .toStatus(ApplicationStatus.SUBMITTED)
                .changedBy(candidate.getUser())
                .note("Application submitted by candidate")
                .build();
        statusHistoryRepository.save(history);

        // Notify Recruiter
        notificationService.createNotification(
                job.getPostedBy().getUser(),
                NotificationType.APPLICATION_SUBMITTED,
                "New Applicant Received",
                candidate.getFirstName() + " " + candidate.getLastName() + " applied for " + job.getTitle(),
                "JOB",
                job.getId()
        );

        return toDto(application, false);
    }

    @Transactional(readOnly = true)
    public Page<ApplicationDto> getCandidateApplications(Long candidateUserId, Pageable pageable) {
        CandidateProfile candidate = candidateProfileRepository.findByUserId(candidateUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate profile not found: " + candidateUserId));

        return applicationRepository.findByCandidateOrderByAppliedAtDesc(candidate, pageable)
                .map(app -> toDto(app, false));
    }

    @Transactional
    public ApplicationDto withdrawApplication(Long candidateUserId, Long applicationId) {
        CandidateProfile candidate = candidateProfileRepository.findByUserId(candidateUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate profile not found: " + candidateUserId));

        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found: " + applicationId));

        if (!application.getCandidate().getId().equals(candidate.getId())) {
            throw new ForbiddenException("Unauthorized: You do not own this application.");
        }

        if (application.getStatus() == ApplicationStatus.OFFERED || application.getStatus() == ApplicationStatus.REJECTED) {
            throw new BadRequestException("Applications that are already OFFERED or REJECTED cannot be withdrawn.");
        }

        ApplicationStatus fromStatus = application.getStatus();
        application.setStatus(ApplicationStatus.WITHDRAWN);
        application = applicationRepository.save(application);

        ApplicationStatusHistory history = ApplicationStatusHistory.builder()
                .application(application)
                .fromStatus(fromStatus)
                .toStatus(ApplicationStatus.WITHDRAWN)
                .changedBy(candidate.getUser())
                .note("Withdrawn by candidate")
                .build();
        statusHistoryRepository.save(history);

        notificationService.createNotification(
                application.getJob().getPostedBy().getUser(),
                NotificationType.APPLICATION_WITHDRAWN,
                "Application Withdrawn",
                candidate.getFirstName() + " " + candidate.getLastName() + " withdrew application for " + application.getJob().getTitle(),
                "APPLICATION",
                application.getId()
        );

        return toDto(application, false);
    }

    @Transactional(readOnly = true)
    public Page<ApplicationDto> getJobApplicants(Long recruiterUserId, Long jobId, String statusFilter, Pageable pageable) {
        RecruiterProfile recruiter = recruiterProfileRepository.findByUserId(recruiterUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Recruiter profile not found: " + recruiterUserId));

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found: " + jobId));

        if (!job.getPostedBy().getId().equals(recruiter.getId())) {
            throw new ForbiddenException("Unauthorized: You do not own this job posting.");
        }

        if (statusFilter != null && !statusFilter.trim().isEmpty()) {
            ApplicationStatus status = ApplicationStatus.valueOf(statusFilter.trim().toUpperCase());
            return applicationRepository.findByJobAndStatusOrderByAppliedAtDesc(job, status, pageable)
                    .map(app -> toDto(app, true));
        }

        return applicationRepository.findByJobOrderByAppliedAtDesc(job, pageable)
                .map(app -> toDto(app, true));
    }

    @Transactional
    public ApplicationDto updateStatus(Long recruiterUserId, Long applicationId, UpdateApplicationStatusRequest request) {
        RecruiterProfile recruiter = recruiterProfileRepository.findByUserId(recruiterUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Recruiter profile not found: " + recruiterUserId));

        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found: " + applicationId));

        if (!application.getJob().getPostedBy().getId().equals(recruiter.getId())) {
            throw new ForbiddenException("Unauthorized: You do not own the job posting for this application.");
        }

        ApplicationStatus targetStatus = ApplicationStatus.valueOf(request.getStatus().trim().toUpperCase());
        ApplicationStatus previousStatus = application.getStatus();

        if (previousStatus == ApplicationStatus.WITHDRAWN) {
            throw new BadRequestException("Cannot update status of an application that was withdrawn by the candidate.");
        }

        application.setStatus(targetStatus);
        if (targetStatus == ApplicationStatus.SHORTLISTED) {
            application.setShortlisted(true);
        }
        application = applicationRepository.save(application);

        ApplicationStatusHistory history = ApplicationStatusHistory.builder()
                .application(application)
                .fromStatus(previousStatus)
                .toStatus(targetStatus)
                .changedBy(recruiter.getUser())
                .note(request.getNote())
                .build();
        statusHistoryRepository.save(history);

        // Notify Candidate of status change
        notificationService.createNotification(
                application.getCandidate().getUser(),
                NotificationType.APPLICATION_STATUS_UPDATED,
                "Application Status Updated",
                "Your application for " + application.getJob().getTitle() + " has been updated to: " + targetStatus.name(),
                "APPLICATION",
                application.getId()
        );

        return toDto(application, true);
    }

    @Transactional
    public ApplicationDto toggleShortlist(Long recruiterUserId, Long applicationId) {
        RecruiterProfile recruiter = recruiterProfileRepository.findByUserId(recruiterUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Recruiter profile not found: " + recruiterUserId));

        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found: " + applicationId));

        if (!application.getJob().getPostedBy().getId().equals(recruiter.getId())) {
            throw new ForbiddenException("Unauthorized: You do not own the job posting for this application.");
        }

        application.setShortlisted(!application.isShortlisted());
        application = applicationRepository.save(application);
        return toDto(application, true);
    }

    @Transactional
    public ApplicationDto addRecruiterNote(Long recruiterUserId, Long applicationId, AddNoteRequest request) {
        RecruiterProfile recruiter = recruiterProfileRepository.findByUserId(recruiterUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Recruiter profile not found: " + recruiterUserId));

        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found: " + applicationId));

        if (!application.getJob().getPostedBy().getId().equals(recruiter.getId())) {
            throw new ForbiddenException("Unauthorized: You do not own the job posting for this application.");
        }

        RecruiterNote note = RecruiterNote.builder()
                .application(application)
                .recruiter(recruiter)
                .noteText(request.getNoteText())
                .build();
        recruiterNoteRepository.save(note);

        return toDto(application, true);
    }

    public ApplicationDto toDto(Application app, boolean isRecruiterView) {
        List<ApplicationDto.StatusHistoryDto> history = statusHistoryRepository.findByApplicationOrderByChangedAtAsc(app)
                .stream()
                .map(h -> ApplicationDto.StatusHistoryDto.builder()
                        .fromStatus(h.getFromStatus() != null ? h.getFromStatus().name() : null)
                        .toStatus(h.getToStatus().name())
                        .changedByName(h.getChangedBy().getEmail())
                        .note(h.getNote())
                        .changedAt(h.getChangedAt())
                        .build())
                .collect(Collectors.toList());

        List<ApplicationDto.NoteDto> notes = null;
        if (isRecruiterView) {
            notes = recruiterNoteRepository.findByApplicationOrderByCreatedAtDesc(app)
                    .stream()
                    .map(n -> ApplicationDto.NoteDto.builder()
                            .id(n.getId())
                            .recruiterName(n.getRecruiter().getFirstName() + " " + n.getRecruiter().getLastName())
                            .noteText(n.getNoteText())
                            .createdAt(n.getCreatedAt())
                            .build())
                    .collect(Collectors.toList());
        }

        return ApplicationDto.builder()
                .id(app.getId())
                .jobId(app.getJob().getId())
                .jobTitle(app.getJob().getTitle())
                .companyName(app.getJob().getCompany().getName())
                .jobLocation(app.getJob().getLocation())
                .candidateId(app.getCandidate().getId())
                .candidateName(app.getCandidate().getFirstName() + " " + app.getCandidate().getLastName())
                .candidateEmail(app.getCandidate().getUser().getEmail())
                .candidateHeadline(app.getCandidate().getHeadline())
                .coverLetterText(app.getCoverLetterText())
                .status(app.getStatus().name())
                .shortlisted(app.isShortlisted())
                .appliedAt(app.getAppliedAt())
                .updatedAt(app.getUpdatedAt())
                .history(history)
                .recruiterNotes(notes) // Never exposed to candidate view!
                .build();
    }
}
