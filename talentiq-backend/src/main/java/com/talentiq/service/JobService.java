package com.talentiq.service;

import com.talentiq.dto.JobDto;
import com.talentiq.entity.*;
import com.talentiq.enums.JobStatus;
import com.talentiq.exception.BadRequestException;
import com.talentiq.exception.ForbiddenException;
import com.talentiq.exception.ResourceNotFoundException;
import com.talentiq.repository.ApplicationRepository;
import com.talentiq.repository.CompanyRepository;
import com.talentiq.repository.JobRepository;
import com.talentiq.repository.RecruiterProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final RecruiterProfileRepository recruiterProfileRepository;
    private final CompanyRepository companyRepository;
    private final ApplicationRepository applicationRepository;

    @Transactional
    public JobDto createJob(Long recruiterUserId, JobDto dto) {
        RecruiterProfile recruiter = recruiterProfileRepository.findByUserId(recruiterUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Recruiter profile not found for user: " + recruiterUserId));

        if (recruiter.getCompany() == null) {
            throw new BadRequestException("Recruiter must be associated with a company before posting jobs");
        }

        Job job = Job.builder()
                .company(recruiter.getCompany())
                .postedBy(recruiter)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .location(dto.getLocation())
                .jobType(dto.getJobType() != null ? dto.getJobType() : "FULL_TIME")
                .salaryMin(dto.getSalaryMin())
                .salaryMax(dto.getSalaryMax())
                .salaryCurrency(dto.getSalaryCurrency() != null ? dto.getSalaryCurrency() : "INR")
                .remote(dto.isRemote())
                .status(JobStatus.DRAFT)
                .build();

        if (dto.getRequirements() != null) {
            for (JobDto.JobRequirementDto reqDto : dto.getRequirements()) {
                job.addRequirement(JobRequirement.builder()
                        .requirement(reqDto.getRequirement())
                        .required(reqDto.isRequired())
                        .build());
            }
        }

        if (dto.getSkills() != null) {
            for (JobDto.JobSkillDto skillDto : dto.getSkills()) {
                job.addSkill(JobSkill.builder()
                        .skillName(skillDto.getSkillName())
                        .required(skillDto.isRequired())
                        .build());
            }
        }

        job = jobRepository.save(job);
        return toDto(job);
    }

    @Transactional
    public JobDto updateJob(Long recruiterUserId, Long jobId, JobDto dto) {
        Job job = getOwnedJob(recruiterUserId, jobId);

        job.setTitle(dto.getTitle());
        job.setDescription(dto.getDescription());
        job.setLocation(dto.getLocation());
        job.setJobType(dto.getJobType() != null ? dto.getJobType() : "FULL_TIME");
        job.setSalaryMin(dto.getSalaryMin());
        job.setSalaryMax(dto.getSalaryMax());
        job.setSalaryCurrency(dto.getSalaryCurrency() != null ? dto.getSalaryCurrency() : "INR");
        job.setRemote(dto.isRemote());

        if (dto.getRequirements() != null) {
            job.clearRequirements();
            for (JobDto.JobRequirementDto reqDto : dto.getRequirements()) {
                job.addRequirement(JobRequirement.builder()
                        .requirement(reqDto.getRequirement())
                        .required(reqDto.isRequired())
                        .build());
            }
        }

        if (dto.getSkills() != null) {
            job.clearSkills();
            for (JobDto.JobSkillDto skillDto : dto.getSkills()) {
                job.addSkill(JobSkill.builder()
                        .skillName(skillDto.getSkillName())
                        .required(skillDto.isRequired())
                        .build());
            }
        }

        job = jobRepository.save(job);
        return toDto(job);
    }

    @Transactional
    public JobDto publishJob(Long recruiterUserId, Long jobId) {
        Job job = getOwnedJob(recruiterUserId, jobId);
        if (job.getStatus() == JobStatus.CLOSED) {
            throw new BadRequestException("Closed jobs cannot be republished directly. Please create a new listing.");
        }

        job.setStatus(JobStatus.PUBLISHED);
        job.setPublishedAt(LocalDateTime.now());
        job = jobRepository.save(job);
        return toDto(job);
    }

    @Transactional
    public JobDto closeJob(Long recruiterUserId, Long jobId) {
        Job job = getOwnedJob(recruiterUserId, jobId);
        job.setStatus(JobStatus.CLOSED);
        job.setClosedAt(LocalDateTime.now());
        job = jobRepository.save(job);
        return toDto(job);
    }

    @Transactional(readOnly = true)
    public Page<JobDto> getRecruiterJobs(Long recruiterUserId, Pageable pageable) {
        RecruiterProfile recruiter = recruiterProfileRepository.findByUserId(recruiterUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Recruiter profile not found for user: " + recruiterUserId));

        return jobRepository.findByPostedBy(recruiter, pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public JobDto getJobById(Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job posting not found with ID: " + jobId));
        return toDto(job);
    }

    @Transactional(readOnly = true)
    public Page<JobDto> searchPublishedJobs(String keyword, String location, String jobType, Boolean isRemote, Pageable pageable) {
        String cleanKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        String cleanLocation = (location != null && !location.trim().isEmpty()) ? location.trim() : null;
        String cleanType = (jobType != null && !jobType.trim().isEmpty()) ? jobType.trim() : null;

        return jobRepository.searchPublishedJobs(cleanKeyword, cleanLocation, cleanType, isRemote, pageable)
                .map(this::toDto);
    }

    private Job getOwnedJob(Long recruiterUserId, Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job posting not found: " + jobId));

        if (!job.getPostedBy().getUser().getId().equals(recruiterUserId)) {
            throw new ForbiddenException("Unauthorized: You do not own this job posting.");
        }
        return job;
    }

    public JobDto toDto(Job job) {
        List<JobDto.JobRequirementDto> reqDtos = job.getRequirements().stream()
                .map(r -> JobDto.JobRequirementDto.builder()
                        .id(r.getId())
                        .requirement(r.getRequirement())
                        .required(r.isRequired())
                        .build())
                .collect(Collectors.toList());

        List<JobDto.JobSkillDto> skillDtos = job.getSkills().stream()
                .map(s -> JobDto.JobSkillDto.builder()
                        .id(s.getId())
                        .skillName(s.getSkillName())
                        .required(s.isRequired())
                        .build())
                .collect(Collectors.toList());

        long applicationCount = applicationRepository.countByJob(job);

        return JobDto.builder()
                .id(job.getId())
                .companyId(job.getCompany().getId())
                .companyName(job.getCompany().getName())
                .companyLogoUrl(job.getCompany().getLogoUrl())
                .postedById(job.getPostedBy().getId())
                .recruiterName(job.getPostedBy().getFirstName() + " " + job.getPostedBy().getLastName())
                .title(job.getTitle())
                .description(job.getDescription())
                .location(job.getLocation())
                .jobType(job.getJobType())
                .salaryMin(job.getSalaryMin())
                .salaryMax(job.getSalaryMax())
                .salaryCurrency(job.getSalaryCurrency())
                .remote(job.isRemote())
                .status(job.getStatus().name())
                .publishedAt(job.getPublishedAt())
                .closedAt(job.getClosedAt())
                .createdAt(job.getCreatedAt())
                .requirements(reqDtos)
                .skills(skillDtos)
                .applicationCount(applicationCount)
                .build();
    }
}
