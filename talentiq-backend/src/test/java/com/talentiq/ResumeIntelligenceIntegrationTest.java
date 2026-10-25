package com.talentiq;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentiq.controller.CandidateWorkflowController;
import com.talentiq.dto.*;
import com.talentiq.entity.Role;
import com.talentiq.entity.User;
import com.talentiq.enums.RoleType;
import com.talentiq.repository.RoleRepository;
import com.talentiq.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.*;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class ResumeIntelligenceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String candidateToken;
    private String candidateBToken;
    private String recruiterToken;
    private Long candidateUserId;
    private Long recruiterUserId;

    @BeforeEach
    void setUp() throws Exception {
        for (RoleType roleType : RoleType.values()) {
            if (roleRepository.findByName(roleType).isEmpty()) {
                roleRepository.save(Role.builder().name(roleType).build());
            }
        }

        // Register Candidate A
        CandidateRegisterRequest candReq = new CandidateRegisterRequest();
        candReq.setEmail("cand.alice@talentiq.test");
        candReq.setPassword("Password123!");
        candReq.setFirstName("Alice");
        candReq.setLastName("Dev");
        candReq.setHeadline("Full Stack Java Engineer");
        MvcResult candRes = mockMvc.perform(post("/api/v1/auth/register/candidate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(candReq)))
                .andExpect(status().isCreated())
                .andReturn();
        candidateToken = objectMapper.readTree(candRes.getResponse().getContentAsString()).get("accessToken").asText();
        candidateUserId = objectMapper.readTree(candRes.getResponse().getContentAsString()).get("userId").asLong();

        // Register Candidate B (Attacker)
        CandidateRegisterRequest candBReq = new CandidateRegisterRequest();
        candBReq.setEmail("cand.bob@talentiq.test");
        candBReq.setPassword("Password123!");
        candBReq.setFirstName("Bob");
        candBReq.setLastName("Hacker");
        candBReq.setHeadline("Security Enthusiast");
        MvcResult candBRes = mockMvc.perform(post("/api/v1/auth/register/candidate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(candBReq)))
                .andExpect(status().isCreated())
                .andReturn();
        candidateBToken = objectMapper.readTree(candBRes.getResponse().getContentAsString()).get("accessToken").asText();

        // Register Recruiter
        RecruiterRegisterRequest recReq = new RecruiterRegisterRequest();
        recReq.setEmail("recruiter.sarah@talentiq.test");
        recReq.setPassword("Password123!");
        recReq.setFirstName("Sarah");
        recReq.setLastName("Talent");
        recReq.setTitle("Lead Recruiter");
        recReq.setCompanyName("CloudCorp AI");
        recReq.setCompanyWebsite("https://cloudcorp.ai");
        recReq.setCompanyIndustry("Cloud & AI");
        MvcResult recRes = mockMvc.perform(post("/api/v1/auth/register/recruiter")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(recReq)))
                .andExpect(status().isCreated())
                .andReturn();
        recruiterToken = objectMapper.readTree(recRes.getResponse().getContentAsString()).get("accessToken").asText();
        recruiterUserId = objectMapper.readTree(recRes.getResponse().getContentAsString()).get("userId").asLong();
    }

    private byte[] createMinimalPdfBytes(String content) {
        // Creates a valid minimal PDF binary with %PDF header
        StringBuilder sb = new StringBuilder();
        sb.append("%PDF-1.4\n");
        sb.append("1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n");
        sb.append("2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n");
        sb.append("3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n");
        sb.append("4 0 obj << /Length ").append(content.length() + 30).append(" >> stream\nBT /F1 12 Tf 50 700 Td (").append(content).append(") Tj ET\nendstream\nendobj\n");
        sb.append("5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n");
        sb.append("xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000244 00000 n \n0000000330 00000 n \n");
        sb.append("trailer << /Size 6 /Root 1 0 R >>\nstartxref\n417\n%%EOF\n");
        return sb.toString().getBytes();
    }

    @Test
    @DisplayName("Should successfully upload and parse a valid PDF resume")
    void testUploadAndParseValidPdfResume() throws Exception {
        byte[] pdfBytes = createMinimalPdfBytes("Alice Dev\\nalice@talentiq.test\\nJava Spring Boot MySQL Docker Kubernetes");
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "alice_resume.pdf",
                "application/pdf",
                pdfBytes
        );

        MvcResult result = mockMvc.perform(multipart("/api/v1/resumes/upload")
                        .file(file)
                        .param("label", "Primary 2026 Resume")
                        .header("Authorization", "Bearer " + candidateToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.versionNumber").value(1))
                .andExpect(jsonPath("$.label").value("Primary 2026 Resume"))
                .andExpect(jsonPath("$.active").value(true))
                .andExpect(jsonPath("$.parseStatus").value("COMPLETED"))
                .andReturn();

        Long versionId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();

        // Verify retrieval of parsed data
        mockMvc.perform(get("/api/v1/resumes/" + versionId + "/parsed")
                        .header("Authorization", "Bearer " + candidateToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resumeVersionId").value(versionId))
                .andExpect(jsonPath("$.parseStatus").value("COMPLETED"))
                .andExpect(jsonPath("$.skills", hasItems("Java", "Spring Boot", "MySQL")));
    }

    @Test
    @DisplayName("Should reject empty document with 400 Bad Request")
    void testRejectEmptyDocument() throws Exception {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file",
                "empty.pdf",
                "application/pdf",
                new byte[0]
        );

        mockMvc.perform(multipart("/api/v1/resumes/upload")
                        .file(emptyFile)
                        .header("Authorization", "Bearer " + candidateToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("empty")));
    }

    @Test
    @DisplayName("Should reject unsupported file extension with 400 Bad Request")
    void testRejectUnsupportedExtension() throws Exception {
        MockMultipartFile scriptFile = new MockMultipartFile(
                "file",
                "malicious.exe",
                "application/octet-stream",
                "MZ executable content".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/resumes/upload")
                        .file(scriptFile)
                        .header("Authorization", "Bearer " + candidateToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Unsupported file type")));
    }

    @Test
    @DisplayName("Should reject malformed PDF header signature")
    void testRejectMalformedPdfHeader() throws Exception {
        MockMultipartFile fakePdf = new MockMultipartFile(
                "file",
                "fake.pdf",
                "application/pdf",
                "NOT_A_REAL_PDF_HEADER_CONTENT".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/resumes/upload")
                        .file(fakePdf)
                        .header("Authorization", "Bearer " + candidateToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("file content signature does not match PDF")));
    }

    @Test
    @DisplayName("Candidate can correct/update parsed resume fields")
    void testUpdateParsedResumeFields() throws Exception {
        byte[] pdfBytes = createMinimalPdfBytes("Alice Dev\\nSkills: Java");
        MockMultipartFile file = new MockMultipartFile("file", "resume.pdf", "application/pdf", pdfBytes);

        MvcResult uploadRes = mockMvc.perform(multipart("/api/v1/resumes/upload")
                        .file(file)
                        .header("Authorization", "Bearer " + candidateToken))
                .andExpect(status().isCreated())
                .andReturn();

        Long versionId = objectMapper.readTree(uploadRes.getResponse().getContentAsString()).get("id").asLong();

        // Candidate updates skills and contact
        UpdateParsedResumeRequest updateReq = new UpdateParsedResumeRequest();
        updateReq.setSkills(Arrays.asList("Java", "Spring Boot", "React", "TypeScript", "AWS"));
        Map<String, Object> contact = new HashMap<>();
        contact.put("name", "Alice Dev");
        contact.put("email", "alice.updated@talentiq.test");
        contact.put("phone", "(555) 987-6543");
        updateReq.setContact(contact);
        updateReq.setSummary("Senior Java and Full Stack Architect.");

        mockMvc.perform(put("/api/v1/resumes/" + versionId + "/parsed")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq))
                        .header("Authorization", "Bearer " + candidateToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.skills", hasItems("Java", "Spring Boot", "React", "TypeScript", "AWS")))
                .andExpect(jsonPath("$.summary").value("Senior Java and Full Stack Architect."));
    }

    @Test
    @DisplayName("Candidate can calculate transparent ATS analysis against a published job")
    void testCalculateAtsAgainstJob() throws Exception {
        // 1. Recruiter posts and publishes a job
        JobDto jobDto = JobDto.builder()
                .title("Senior Cloud Engineer")
                .description("We require Java, Spring Boot, AWS, Kubernetes, and Docker.")
                .location("Remote")
                .jobType("FULL_TIME")
                .remote(true)
                .skills(Arrays.asList(
                        JobDto.JobSkillDto.builder().skillName("Java").required(true).build(),
                        JobDto.JobSkillDto.builder().skillName("Spring Boot").required(true).build(),
                        JobDto.JobSkillDto.builder().skillName("AWS").required(true).build(),
                        JobDto.JobSkillDto.builder().skillName("Kubernetes").required(true).build()
                ))
                .build();

        MvcResult jobRes = mockMvc.perform(post("/api/v1/recruiter/jobs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(jobDto))
                        .header("Authorization", "Bearer " + recruiterToken))
                .andExpect(status().isCreated())
                .andReturn();
        Long jobId = objectMapper.readTree(jobRes.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(patch("/api/v1/recruiter/jobs/" + jobId + "/publish")
                        .header("Authorization", "Bearer " + recruiterToken))
                .andExpect(status().isOk());

        // 2. Candidate uploads resume with some matching and missing skills
        byte[] pdfBytes = createMinimalPdfBytes("Alice Dev\\nWork Experience\\nSenior Developer\\nJava Spring Boot Docker PostgreSQL 2020-2026\\nReduced latency by 35%");
        MockMultipartFile file = new MockMultipartFile("file", "alice_resume.pdf", "application/pdf", pdfBytes);

        MvcResult uploadRes = mockMvc.perform(multipart("/api/v1/resumes/upload")
                        .file(file)
                        .header("Authorization", "Bearer " + candidateToken))
                .andExpect(status().isCreated())
                .andReturn();
        Long versionId = objectMapper.readTree(uploadRes.getResponse().getContentAsString()).get("id").asLong();

        // 3. Request ATS analysis
        AtsAnalysisRequest atsReq = AtsAnalysisRequest.builder()
                .resumeVersionId(versionId)
                .jobId(jobId)
                .build();

        mockMvc.perform(post("/api/v1/ats/analyze")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(atsReq))
                        .header("Authorization", "Bearer " + candidateToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.overallScore").isNumber())
                .andExpect(jsonPath("$.keywordScore").isNumber())
                .andExpect(jsonPath("$.formatScore").isNumber())
                .andExpect(jsonPath("$.completenessScore").isNumber())
                .andExpect(jsonPath("$.relevanceScore").isNumber())
                .andExpect(jsonPath("$.matchedSkills", hasItems("Java", "Spring Boot")))
                .andExpect(jsonPath("$.missingSkills", hasItems("AWS", "Kubernetes")))
                .andExpect(jsonPath("$.supportingEvidence").isArray())
                .andExpect(jsonPath("$.suggestions").isArray())
                .andExpect(jsonPath("$.limitationsNote").isNotEmpty());
    }

    @Test
    @DisplayName("Candidate B cannot access, download, or edit Candidate A's resume (403 Forbidden)")
    void testUnauthorizedCandidateAccessForbidden() throws Exception {
        byte[] pdfBytes = createMinimalPdfBytes("Alice Private Resume");
        MockMultipartFile file = new MockMultipartFile("file", "alice.pdf", "application/pdf", pdfBytes);

        MvcResult uploadRes = mockMvc.perform(multipart("/api/v1/resumes/upload")
                        .file(file)
                        .header("Authorization", "Bearer " + candidateToken))
                .andExpect(status().isCreated())
                .andReturn();
        Long versionId = objectMapper.readTree(uploadRes.getResponse().getContentAsString()).get("id").asLong();

        // Candidate B attempts to view parsed data
        mockMvc.perform(get("/api/v1/resumes/" + versionId + "/parsed")
                        .header("Authorization", "Bearer " + candidateBToken))
                .andExpect(status().isForbidden());

        // Candidate B attempts to download file
        mockMvc.perform(get("/api/v1/resumes/" + versionId + "/download")
                        .header("Authorization", "Bearer " + candidateBToken))
                .andExpect(status().isForbidden());

        // Candidate B attempts to delete
        mockMvc.perform(delete("/api/v1/resumes/" + versionId)
                        .header("Authorization", "Bearer " + candidateBToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Recruiter can view applicant resume and anonymized evaluation view")
    void testRecruiterApplicantResumeEvaluation() throws Exception {
        // 1. Recruiter creates and publishes job
        JobDto jobDto = JobDto.builder()
                .title("Full Stack Lead")
                .description("Lead developer opening.")
                .location("Remote")
                .jobType("FULL_TIME")
                .remote(true)
                .build();
        MvcResult jobRes = mockMvc.perform(post("/api/v1/recruiter/jobs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(jobDto))
                        .header("Authorization", "Bearer " + recruiterToken))
                .andExpect(status().isCreated())
                .andReturn();
        Long jobId = objectMapper.readTree(jobRes.getResponse().getContentAsString()).get("id").asLong();
        mockMvc.perform(patch("/api/v1/recruiter/jobs/" + jobId + "/publish")
                        .header("Authorization", "Bearer " + recruiterToken))
                .andExpect(status().isOk());

        // 2. Candidate uploads resume
        byte[] pdfBytes = createMinimalPdfBytes("Alice Dev\\nalice@talentiq.test\\nJava Spring Boot");
        MockMultipartFile file = new MockMultipartFile("file", "alice.pdf", "application/pdf", pdfBytes);
        MvcResult uploadRes = mockMvc.perform(multipart("/api/v1/resumes/upload")
                        .file(file)
                        .header("Authorization", "Bearer " + candidateToken))
                .andExpect(status().isCreated())
                .andReturn();
        Long versionId = objectMapper.readTree(uploadRes.getResponse().getContentAsString()).get("id").asLong();

        // 3. Candidate applies with resume version
        CandidateWorkflowController.ApplyJobRequest applyReq = new CandidateWorkflowController.ApplyJobRequest();
        applyReq.setCoverLetter("Excited about this opening.");
        applyReq.setResumeVersionId(versionId);

        MvcResult appRes = mockMvc.perform(post("/api/v1/candidates/jobs/" + jobId + "/apply")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(applyReq))
                        .header("Authorization", "Bearer " + candidateToken))
                .andExpect(status().isCreated())
                .andReturn();
        Long applicationId = objectMapper.readTree(appRes.getResponse().getContentAsString()).get("id").asLong();

        // 4. Recruiter reviews applicant resume
        mockMvc.perform(get("/api/v1/recruiter/applications/" + applicationId + "/resume")
                        .header("Authorization", "Bearer " + recruiterToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resumeVersionId").value(versionId))
                .andExpect(jsonPath("$.contact.name").value("Alice Dev"));

        // 5. Recruiter reviews anonymized evaluation view
        mockMvc.perform(get("/api/v1/recruiter/applications/" + applicationId + "/resume?anonymized=true")
                        .header("Authorization", "Bearer " + recruiterToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contact.name").value("Anonymized Candidate"))
                .andExpect(jsonPath("$.contact.email").value("candidate-protected@talentiq.internal"))
                .andExpect(jsonPath("$.skills", hasItem("Java")));
    }
}
