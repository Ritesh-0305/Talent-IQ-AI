package com.talentiq.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentiq.dto.ParsedResumeDto;
import com.talentiq.dto.ResumeVersionDto;
import com.talentiq.dto.UpdateParsedResumeRequest;
import com.talentiq.entity.*;
import com.talentiq.enums.ParseStatus;
import com.talentiq.exception.BadRequestException;
import com.talentiq.exception.ForbiddenException;
import com.talentiq.exception.ResourceNotFoundException;
import com.talentiq.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final ResumeVersionRepository resumeVersionRepository;
    private final ParsedResumeDataRepository parsedResumeDataRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final ApplicationRepository applicationRepository;
    private final FileStorageService fileStorageService;
    private final ObjectMapper objectMapper;

    @Transactional
    public ResumeVersionDto uploadAndProcessResume(User candidateUser, MultipartFile file, String label) {
        CandidateProfile candidate = candidateProfileRepository.findByUserId(candidateUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Candidate profile not found for user: " + candidateUser.getId()));

        Resume resume = resumeRepository.findByCandidateIdAndDeletedFalse(candidate.getId())
                .orElseGet(() -> resumeRepository.save(Resume.builder()
                        .candidate(candidate)
                        .deleted(false)
                        .build()));

        Integer maxVersion = resumeVersionRepository.findMaxVersionNumberByResumeId(resume.getId());
        int nextVersion = (maxVersion == null ? 0 : maxVersion) + 1;

        // Store file securely
        String storedPath = fileStorageService.storeFile(file);

        // Deactivate older active versions
        List<ResumeVersion> existingVersions = resumeVersionRepository.findByResumeIdOrderByVersionNumberDesc(resume.getId());
        for (ResumeVersion v : existingVersions) {
            v.setActive(false);
            resumeVersionRepository.save(v);
        }

        ResumeVersion version = ResumeVersion.builder()
                .resume(resume)
                .versionNumber(nextVersion)
                .label(label != null && !label.trim().isEmpty() ? label.trim() : "Version " + nextVersion)
                .storagePath(storedPath)
                .originalFilename(file.getOriginalFilename())
                .fileSizeBytes(file.getSize())
                .mimeType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                .active(true)
                .uploadTimestamp(LocalDateTime.now())
                .build();

        version = resumeVersionRepository.save(version);
        resume.setActiveVersionId(version.getId());
        resumeRepository.save(resume);

        // Execute parsing via Python extraction engine
        parseAndStoreResumeData(version, storedPath);

        return toVersionDto(version);
    }

    private void parseAndStoreResumeData(ResumeVersion version, String storedFilePath) {
        File cliScript = resolveCliScript();
        
        try {
            ProcessBuilder pb = new ProcessBuilder("python", cliScript.getAbsolutePath(), storedFilePath);
            pb.redirectErrorStream(false);
            Process process = pb.start();

            String stdout;
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                stdout = reader.lines().collect(Collectors.joining("\n"));
            }

            String stderr;
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getErrorStream(), StandardCharsets.UTF_8))) {
                stderr = reader.lines().collect(Collectors.joining("\n"));
            }

            int exitCode = process.waitFor();

            if (exitCode != 0) {
                log.warn("Resume extraction process exited with code {}: {}", exitCode, stderr);
                ParseStatus status = ParseStatus.FAILED;
                if (stderr.contains("empty") || stderr.contains("corrupted") || stderr.contains("header")) {
                    throw new BadRequestException("Document extraction failed: " + stderr);
                }

                ParsedResumeData failedData = ParsedResumeData.builder()
                        .resumeVersion(version)
                        .parseStatus(status)
                        .parsedAt(LocalDateTime.now())
                        .summaryText("Extraction failed: " + stderr)
                        .build();
                parsedResumeDataRepository.save(failedData);
                return;
            }

            // Parse JSON output
            Map<String, Object> outputMap = objectMapper.readValue(stdout, new TypeReference<>() {});
            String parseStatusStr = (String) outputMap.getOrDefault("parse_status", "COMPLETED");
            ParseStatus status = ParseStatus.COMPLETED;
            if ("LOW_TEXT_WARNING".equalsIgnoreCase(parseStatusStr)) {
                status = ParseStatus.LOW_TEXT_WARNING;
            }

            ParsedResumeData parsedData = ParsedResumeData.builder()
                    .resumeVersion(version)
                    .rawText((String) outputMap.get("raw_text"))
                    .contactJson(objectMapper.writeValueAsString(outputMap.get("contact")))
                    .skillsJson(objectMapper.writeValueAsString(outputMap.get("skills")))
                    .educationJson(objectMapper.writeValueAsString(outputMap.get("education")))
                    .experienceJson(objectMapper.writeValueAsString(outputMap.get("experience")))
                    .projectsJson(objectMapper.writeValueAsString(outputMap.get("projects")))
                    .certificationsJson(objectMapper.writeValueAsString(outputMap.get("certifications")))
                    .summaryText((String) outputMap.get("summary"))
                    .parseStatus(status)
                    .parsedAt(LocalDateTime.now())
                    .build();

            parsedResumeDataRepository.save(parsedData);
            version.setParsedAt(LocalDateTime.now());
            resumeVersionRepository.save(version);

        } catch (BadRequestException bre) {
            throw bre;
        } catch (Exception e) {
            log.error("Failed to parse resume via extraction engine", e);
            ParsedResumeData errorData = ParsedResumeData.builder()
                    .resumeVersion(version)
                    .parseStatus(ParseStatus.FAILED)
                    .parsedAt(LocalDateTime.now())
                    .summaryText("Extraction error: " + e.getMessage())
                    .build();
            parsedResumeDataRepository.save(errorData);
        }
    }

    private File resolveCliScript() {
        File f1 = new File("talentiq-ai/extract_cli.py");
        if (f1.exists()) return f1;
        File f2 = new File("../talentiq-ai/extract_cli.py");
        if (f2.exists()) return f2;
        File f3 = new File("../../talentiq-ai/extract_cli.py");
        if (f3.exists()) return f3;
        throw new RuntimeException("Could not locate talentiq-ai/extract_cli.py script");
    }

    @Transactional(readOnly = true)
    public List<ResumeVersionDto> getCandidateResumeVersions(User candidateUser) {
        CandidateProfile candidate = candidateProfileRepository.findByUserId(candidateUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Candidate profile not found"));

        Optional<Resume> resumeOpt = resumeRepository.findByCandidateIdAndDeletedFalse(candidate.getId());
        if (resumeOpt.isEmpty()) {
            return Collections.emptyList();
        }

        List<ResumeVersion> versions = resumeVersionRepository.findByResumeIdOrderByVersionNumberDesc(resumeOpt.get().getId());
        return versions.stream().map(this::toVersionDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ParsedResumeDto getParsedResume(User user, Long versionId, boolean anonymized) {
        ResumeVersion version = resumeVersionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume version not found with ID: " + versionId));

        validateAccessToResumeVersion(user, version);

        ParsedResumeData data = parsedResumeDataRepository.findByResumeVersionId(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("Parsed data not found for resume version ID: " + versionId));

        return toParsedDto(data, anonymized);
    }

    @Transactional
    public ParsedResumeDto updateParsedResume(User candidateUser, Long versionId, UpdateParsedResumeRequest req) {
        ResumeVersion version = resumeVersionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume version not found with ID: " + versionId));

        CandidateProfile candidate = candidateProfileRepository.findByUserId(candidateUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Candidate profile not found"));

        if (!version.getResume().getCandidate().getId().equals(candidate.getId())) {
            throw new ForbiddenException("You are not authorized to update another candidate's parsed resume.");
        }

        ParsedResumeData data = parsedResumeDataRepository.findByResumeVersionId(versionId)
                .orElseGet(() -> ParsedResumeData.builder().resumeVersion(version).build());

        try {
            if (req.getContact() != null) data.setContactJson(objectMapper.writeValueAsString(req.getContact()));
            if (req.getSkills() != null) data.setSkillsJson(objectMapper.writeValueAsString(req.getSkills()));
            if (req.getEducation() != null) data.setEducationJson(objectMapper.writeValueAsString(req.getEducation()));
            if (req.getExperience() != null) data.setExperienceJson(objectMapper.writeValueAsString(req.getExperience()));
            if (req.getProjects() != null) data.setProjectsJson(objectMapper.writeValueAsString(req.getProjects()));
            if (req.getCertifications() != null) data.setCertificationsJson(objectMapper.writeValueAsString(req.getCertifications()));
            if (req.getSummary() != null) data.setSummaryText(req.getSummary());

            data.setParseStatus(ParseStatus.COMPLETED);
            data = parsedResumeDataRepository.save(data);
            return toParsedDto(data, false);
        } catch (Exception e) {
            throw new BadRequestException("Failed to update parsed fields: " + e.getMessage());
        }
    }

    @Transactional
    public ResumeVersionDto setActiveVersion(User candidateUser, Long versionId) {
        ResumeVersion targetVersion = resumeVersionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume version not found"));

        CandidateProfile candidate = candidateProfileRepository.findByUserId(candidateUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Candidate profile not found"));

        if (!targetVersion.getResume().getCandidate().getId().equals(candidate.getId())) {
            throw new ForbiddenException("You cannot activate a resume version that does not belong to you.");
        }

        Resume resume = targetVersion.getResume();
        List<ResumeVersion> versions = resumeVersionRepository.findByResumeIdOrderByVersionNumberDesc(resume.getId());
        for (ResumeVersion v : versions) {
            v.setActive(v.getId().equals(targetVersion.getId()));
            resumeVersionRepository.save(v);
        }

        resume.setActiveVersionId(targetVersion.getId());
        resumeRepository.save(resume);

        return toVersionDto(targetVersion);
    }

    @Transactional
    public void deleteResumeVersion(User candidateUser, Long versionId) {
        ResumeVersion version = resumeVersionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume version not found"));

        CandidateProfile candidate = candidateProfileRepository.findByUserId(candidateUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Candidate profile not found"));

        if (!version.getResume().getCandidate().getId().equals(candidate.getId())) {
            throw new ForbiddenException("You cannot delete a resume version that does not belong to you.");
        }

        fileStorageService.deleteFileIfExists(version.getStoragePath());
        resumeVersionRepository.delete(version);
    }

    public Resource getResumeFileForDownload(User user, Long versionId) {
        ResumeVersion version = resumeVersionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume version not found with ID: " + versionId));

        validateAccessToResumeVersion(user, version);
        return fileStorageService.loadFileAsResource(version.getStoragePath());
    }

    public ResumeVersion getResumeVersionEntity(Long versionId) {
        return resumeVersionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume version not found"));
    }

    public void validateAccessToResumeVersion(User user, ResumeVersion version) {
        boolean isCandidateOwner = candidateProfileRepository.findByUserId(user.getId())
                .map(cp -> cp.getId().equals(version.getResume().getCandidate().getId()))
                .orElse(false);

        if (isCandidateOwner) {
            return;
        }

        // Recruiter check: recruiter must own a job where this resume version was submitted
        boolean isAuthorizedRecruiter = applicationRepository.findAll().stream()
                .anyMatch(app -> app.getResumeVersion() != null
                        && app.getResumeVersion().getId().equals(version.getId())
                        && app.getJob().getPostedBy().getUser().getId().equals(user.getId()));

        if (isAuthorizedRecruiter) {
            return;
        }

        // Admin check
        boolean isAdmin = user.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
        if (isAdmin) {
            return;
        }

        throw new ForbiddenException("Access denied: You are not authorized to view or download this resume document.");
    }

    private ResumeVersionDto toVersionDto(ResumeVersion version) {
        String parseStatus = "PENDING";
        if (version.getParsedData() != null) {
            parseStatus = version.getParsedData().getParseStatus().name();
        } else {
            Optional<ParsedResumeData> opt = parsedResumeDataRepository.findByResumeVersionId(version.getId());
            if (opt.isPresent()) {
                parseStatus = opt.get().getParseStatus().name();
            }
        }

        return ResumeVersionDto.builder()
                .id(version.getId())
                .resumeId(version.getResume().getId())
                .versionNumber(version.getVersionNumber())
                .label(version.getLabel())
                .originalFilename(version.getOriginalFilename())
                .fileSizeBytes(version.getFileSizeBytes())
                .mimeType(version.getMimeType())
                .active(version.isActive())
                .uploadTimestamp(version.getUploadTimestamp())
                .parseStatus(parseStatus)
                .build();
    }

    private ParsedResumeDto toParsedDto(ParsedResumeData data, boolean anonymized) {
        Map<String, Object> contact = deserializeMap(data.getContactJson());
        List<String> skills = deserializeList(data.getSkillsJson());
        List<Map<String, Object>> education = deserializeMapList(data.getEducationJson());
        List<Map<String, Object>> experience = deserializeMapList(data.getExperienceJson());
        List<Map<String, Object>> projects = deserializeMapList(data.getProjectsJson());
        List<Map<String, Object>> certifications = deserializeMapList(data.getCertificationsJson());

        if (anonymized) {
            contact = new HashMap<>();
            contact.put("name", "Anonymized Candidate");
            contact.put("email", "candidate-protected@talentiq.internal");
            contact.put("phone", "***-***-****");
            contact.put("location", "Undisclosed Location");
            contact.put("linkedin", null);
            contact.put("github", null);
        }

        return ParsedResumeDto.builder()
                .resumeVersionId(data.getResumeVersion().getId())
                .parseStatus(data.getParseStatus().name())
                .contact(contact)
                .skills(skills)
                .education(education)
                .experience(experience)
                .projects(projects)
                .certifications(certifications)
                .summary(data.getSummaryText())
                .rawText(anonymized ? null : data.getRawText())
                .build();
    }

    private Map<String, Object> deserializeMap(String json) {
        if (json == null || json.trim().isEmpty()) return new HashMap<>();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    private List<String> deserializeList(String json) {
        if (json == null || json.trim().isEmpty()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private List<Map<String, Object>> deserializeMapList(String json) {
        if (json == null || json.trim().isEmpty()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }
}
