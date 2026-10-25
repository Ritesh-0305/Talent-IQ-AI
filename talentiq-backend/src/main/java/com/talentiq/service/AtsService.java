package com.talentiq.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentiq.dto.AtsAnalysisDto;
import com.talentiq.dto.AtsAnalysisRequest;
import com.talentiq.entity.*;
import com.talentiq.enums.AtsAnalysisStatus;
import com.talentiq.exception.BadRequestException;
import com.talentiq.exception.ForbiddenException;
import com.talentiq.exception.ResourceNotFoundException;
import com.talentiq.repository.AtsAnalysisRepository;
import com.talentiq.repository.CandidateProfileRepository;
import com.talentiq.repository.JobRepository;
import com.talentiq.repository.ParsedResumeDataRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.*;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AtsService {

    private final AtsAnalysisRepository atsAnalysisRepository;
    private final ParsedResumeDataRepository parsedResumeDataRepository;
    private final JobRepository jobRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final ResumeService resumeService;
    private final ObjectMapper objectMapper;

    @Transactional
    public AtsAnalysisDto analyzeResumeAts(User user, AtsAnalysisRequest req) {
        ResumeVersion version = resumeService.getResumeVersionEntity(req.getResumeVersionId());
        resumeService.validateAccessToResumeVersion(user, version);

        ParsedResumeData parsedData = parsedResumeDataRepository.findByResumeVersionId(version.getId())
                .orElseThrow(() -> new BadRequestException("Resume must be parsed before requesting ATS analysis. Current status is unparsed."));

        Job targetJob = null;
        List<String> requiredSkills = new ArrayList<>();
        List<String> preferredSkills = new ArrayList<>();

        if (req.getJobId() != null) {
            targetJob = jobRepository.findById(req.getJobId())
                    .orElseThrow(() -> new ResourceNotFoundException("Target job not found with ID: " + req.getJobId()));
            
            for (JobSkill skill : targetJob.getSkills()) {
                if (skill.isRequired()) {
                    requiredSkills.add(skill.getSkillName());
                } else {
                    preferredSkills.add(skill.getSkillName());
                }
            }
        }

        Map<String, Object> cliPayload = new HashMap<>();
        cliPayload.put("parsed_resume", parseJsonToMap(parsedData));
        cliPayload.put("raw_text", parsedData.getRawText() != null ? parsedData.getRawText() : "");
        if (targetJob != null) {
            cliPayload.put("job_title", targetJob.getTitle());
            cliPayload.put("job_description", targetJob.getDescription());
            cliPayload.put("job_required_skills", requiredSkills);
            cliPayload.put("job_preferred_skills", preferredSkills);
        }

        AtsAnalysisDto analysisResult = executeAtsCalculation(version, targetJob, user, cliPayload);
        return analysisResult;
    }

    private AtsAnalysisDto executeAtsCalculation(ResumeVersion version, Job targetJob, User user, Map<String, Object> cliPayload) {
        File cliScript = resolveCliScript();
        File tempJsonFile = null;

        try {
            tempJsonFile = File.createTempFile("ats_payload_", ".json");
            objectMapper.writeValue(tempJsonFile, cliPayload);

            ProcessBuilder pb = new ProcessBuilder("python", cliScript.getAbsolutePath(), version.getStoragePath(), "--ats", tempJsonFile.getAbsolutePath());
            pb.redirectErrorStream(false);
            Process process = pb.start();

            String stdout;
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                stdout = reader.lines().collect(Collectors.joining("\n"));
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                log.error("ATS calculation process failed with exit code: {}", exitCode);
                throw new BadRequestException("ATS analysis execution failed.");
            }

            Map<String, Object> resultMap = objectMapper.readValue(stdout, new TypeReference<>() {});

            BigDecimal overall = BigDecimal.valueOf(((Number) resultMap.get("overall_score")).doubleValue());
            BigDecimal keyword = BigDecimal.valueOf(((Number) resultMap.get("keyword_score")).doubleValue());
            BigDecimal format = BigDecimal.valueOf(((Number) resultMap.get("format_score")).doubleValue());
            BigDecimal completeness = BigDecimal.valueOf(((Number) resultMap.get("completeness_score")).doubleValue());
            BigDecimal relevance = BigDecimal.valueOf(((Number) resultMap.get("relevance_score")).doubleValue());

            AtsAnalysis analysis = AtsAnalysis.builder()
                    .resumeVersion(version)
                    .job(targetJob)
                    .overallScore(overall)
                    .keywordScore(keyword)
                    .formatScore(format)
                    .completenessScore(completeness)
                    .relevanceScore(relevance)
                    .matchedSkillsJson(objectMapper.writeValueAsString(resultMap.get("matched_skills")))
                    .missingSkillsJson(objectMapper.writeValueAsString(resultMap.get("missing_skills")))
                    .supportingEvidenceJson(objectMapper.writeValueAsString(resultMap.get("supporting_evidence")))
                    .suggestionsJson(objectMapper.writeValueAsString(resultMap.get("suggestions")))
                    .scoringPolicyJson(objectMapper.writeValueAsString(resultMap.get("scoring_policy")))
                    .analysisStatus(AtsAnalysisStatus.COMPLETED)
                    .requestedBy(user)
                    .completedAt(LocalDateTime.now())
                    .build();

            analysis = atsAnalysisRepository.save(analysis);
            return toAtsDto(analysis, (String) resultMap.get("limitations_note"));

        } catch (Exception e) {
            log.error("Failed to run ATS scoring", e);
            throw new BadRequestException("Failed to calculate ATS score: " + e.getMessage());
        } finally {
            if (tempJsonFile != null) {
                try {
                    Files.deleteIfExists(tempJsonFile.toPath());
                } catch (IOException ignored) {}
            }
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

    private Map<String, Object> parseJsonToMap(ParsedResumeData data) {
        Map<String, Object> map = new HashMap<>();
        try {
            map.put("contact", data.getContactJson() != null ? objectMapper.readValue(data.getContactJson(), Object.class) : Collections.emptyMap());
            map.put("skills", data.getSkillsJson() != null ? objectMapper.readValue(data.getSkillsJson(), Object.class) : Collections.emptyList());
            map.put("education", data.getEducationJson() != null ? objectMapper.readValue(data.getEducationJson(), Object.class) : Collections.emptyList());
            map.put("experience", data.getExperienceJson() != null ? objectMapper.readValue(data.getExperienceJson(), Object.class) : Collections.emptyList());
            map.put("projects", data.getProjectsJson() != null ? objectMapper.readValue(data.getProjectsJson(), Object.class) : Collections.emptyList());
            map.put("certifications", data.getCertificationsJson() != null ? objectMapper.readValue(data.getCertificationsJson(), Object.class) : Collections.emptyList());
            map.put("summary", data.getSummaryText());
        } catch (Exception e) {
            log.warn("Error serializing parsed resume fields for ATS", e);
        }
        return map;
    }

    @Transactional(readOnly = true)
    public AtsAnalysisDto getAtsAnalysisById(User user, Long analysisId) {
        AtsAnalysis analysis = atsAnalysisRepository.findById(analysisId)
                .orElseThrow(() -> new ResourceNotFoundException("ATS analysis not found with ID: " + analysisId));

        resumeService.validateAccessToResumeVersion(user, analysis.getResumeVersion());
        return toAtsDto(analysis, null);
    }

    @Transactional(readOnly = true)
    public List<AtsAnalysisDto> getAnalysesForResumeVersion(User user, Long resumeVersionId) {
        ResumeVersion version = resumeService.getResumeVersionEntity(resumeVersionId);
        resumeService.validateAccessToResumeVersion(user, version);

        List<AtsAnalysis> list = atsAnalysisRepository.findByResumeVersionIdOrderByCreatedAtDesc(resumeVersionId);
        return list.stream().map(a -> toAtsDto(a, null)).collect(Collectors.toList());
    }

    private AtsAnalysisDto toAtsDto(AtsAnalysis entity, String limitations) {
        List<String> matched = deserializeList(entity.getMatchedSkillsJson());
        List<String> missing = deserializeList(entity.getMissingSkillsJson());
        List<Map<String, Object>> evidence = deserializeMapList(entity.getSupportingEvidenceJson());
        List<Map<String, Object>> suggestions = deserializeMapList(entity.getSuggestionsJson());
        Map<String, Object> policy = deserializeMap(entity.getScoringPolicyJson());

        String limitationsNote = limitations != null ? limitations : 
                "ATS score is a deterministic heuristic reflecting keyword density, structural parsing compliance, " +
                "and stated experience evidence. It does not replace qualitative human recruiter review or practical technical interviewing.";

        return AtsAnalysisDto.builder()
                .id(entity.getId())
                .resumeVersionId(entity.getResumeVersion().getId())
                .jobId(entity.getJob() != null ? entity.getJob().getId() : null)
                .jobTitle(entity.getJob() != null ? entity.getJob().getTitle() : "General ATS Evaluation")
                .overallScore(entity.getOverallScore())
                .keywordScore(entity.getKeywordScore())
                .formatScore(entity.getFormatScore())
                .completenessScore(entity.getCompletenessScore())
                .relevanceScore(entity.getRelevanceScore())
                .matchedSkills(matched)
                .missingSkills(missing)
                .supportingEvidence(evidence)
                .suggestions(suggestions)
                .scoringPolicy(policy)
                .limitationsNote(limitationsNote)
                .completedAt(entity.getCompletedAt())
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
