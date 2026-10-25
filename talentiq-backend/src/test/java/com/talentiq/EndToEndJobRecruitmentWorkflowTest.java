package com.talentiq;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentiq.controller.CandidateWorkflowController;
import com.talentiq.dto.*;
import com.talentiq.entity.Role;
import com.talentiq.enums.ApplicationStatus;
import com.talentiq.enums.RoleType;
import com.talentiq.repository.RoleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class EndToEndJobRecruitmentWorkflowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RoleRepository roleRepository;

    @BeforeEach
    void setUp() {
        for (RoleType roleType : RoleType.values()) {
            if (roleRepository.findByName(roleType).isEmpty()) {
                roleRepository.save(Role.builder().name(roleType).build());
            }
        }
    }

    @Test
    @DisplayName("Complete Recruitment Lifecycle: Post Job -> Publish -> Discover -> Apply -> Review -> Status Update -> Notifications")
    void testCompleteJobAndRecruitmentLifecycle() throws Exception {
        // 1. Register Recruiter
        RecruiterRegisterRequest recRequest = new RecruiterRegisterRequest();
        recRequest.setEmail("hiring.manager@nexastech.com");
        recRequest.setPassword("SecureP@ss1");
        recRequest.setFirstName("Sarah");
        recRequest.setLastName("Connor");
        recRequest.setTitle("Director of Talent");
        recRequest.setCompanyName("Nexas Tech AI");
        recRequest.setCompanyWebsite("https://nexastech.com");

        MvcResult recResult = mockMvc.perform(post("/api/v1/auth/register/recruiter")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(recRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        String recToken = objectMapper.readTree(recResult.getResponse().getContentAsString())
                .get("accessToken").asText();

        // 2. Recruiter Creates Job (Draft)
        JobDto jobDto = new JobDto();
        jobDto.setTitle("Senior Cloud Backend Engineer");
        jobDto.setDescription("Lead our core distributed microservices architecture using Spring Boot and Java 21.");
        jobDto.setLocation("Bengaluru / Remote");
        jobDto.setJobType("FULL_TIME");
        jobDto.setRemote(true);
        jobDto.setSalaryMin(new BigDecimal("1800000"));
        jobDto.setSalaryMax(new BigDecimal("2600000"));
        jobDto.setRequirements(List.of(
                JobDto.JobRequirementDto.builder().requirement("5+ years building backend systems").required(true).build(),
                JobDto.JobRequirementDto.builder().requirement("Hands-on MySQL and JPA experience").required(true).build()
        ));
        jobDto.setSkills(List.of(
                JobDto.JobSkillDto.builder().skillName("Java").required(true).build(),
                JobDto.JobSkillDto.builder().skillName("Spring Boot").required(true).build(),
                JobDto.JobSkillDto.builder().skillName("MySQL").required(true).build()
        ));

        MvcResult createJobResult = mockMvc.perform(post("/api/v1/recruiter/jobs")
                        .header("Authorization", "Bearer " + recToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(jobDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andReturn();

        Long jobId = objectMapper.readTree(createJobResult.getResponse().getContentAsString())
                .get("id").asLong();

        // 3. Verify Draft Job is NOT listed in public search
        mockMvc.perform(get("/api/v1/jobs")
                        .param("keyword", "Senior Cloud Backend Engineer"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));

        // 4. Recruiter Publishes the Job
        mockMvc.perform(patch("/api/v1/recruiter/jobs/" + jobId + "/publish")
                        .header("Authorization", "Bearer " + recToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"));

        // 5. Candidate Discovers the Job in Public Search
        mockMvc.perform(get("/api/v1/jobs")
                        .param("keyword", "Backend"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].id").value(jobId))
                .andExpect(jsonPath("$.content[0].companyName").value("Nexas Tech AI"));

        // 6. Register Candidate
        CandidateRegisterRequest candRequest = new CandidateRegisterRequest();
        candRequest.setEmail("dev.candidate@example.com");
        candRequest.setPassword("SecureP@ss1");
        candRequest.setFirstName("John");
        candRequest.setLastName("Developer");
        candRequest.setHeadline("Full Stack Java Engineer");

        MvcResult candResult = mockMvc.perform(post("/api/v1/auth/register/candidate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(candRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        String candToken = objectMapper.readTree(candResult.getResponse().getContentAsString())
                .get("accessToken").asText();

        // 7. Candidate Submits Job Application
        CandidateWorkflowController.ApplyJobRequest applyReq = new CandidateWorkflowController.ApplyJobRequest();
        applyReq.setCoverLetter("I have 6 years of enterprise experience with Java 21 and Spring Boot.");

        MvcResult applyResult = mockMvc.perform(post("/api/v1/candidates/jobs/" + jobId + "/apply")
                        .header("Authorization", "Bearer " + candToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(applyReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("SUBMITTED"))
                .andExpect(jsonPath("$.jobTitle").value("Senior Cloud Backend Engineer"))
                .andReturn();

        Long applicationId = objectMapper.readTree(applyResult.getResponse().getContentAsString())
                .get("id").asLong();

        // 8. Prevent Duplicate Application
        mockMvc.perform(post("/api/v1/candidates/jobs/" + jobId + "/apply")
                        .header("Authorization", "Bearer " + candToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(applyReq)))
                .andExpect(status().isBadRequest());

        // 9. Recruiter Views Applicants for the Job
        mockMvc.perform(get("/api/v1/recruiter/jobs/" + jobId + "/applicants")
                        .header("Authorization", "Bearer " + recToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].candidateName").value("John Developer"));

        // 10. Recruiter Adds a Private Note (Not visible to Candidate)
        AddNoteRequest noteRequest = new AddNoteRequest();
        noteRequest.setNoteText("Strong background in Spring Boot microservices. Schedule technical screen.");

        mockMvc.perform(post("/api/v1/recruiter/applications/" + applicationId + "/notes")
                        .header("Authorization", "Bearer " + recToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(noteRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recruiterNotes[0].noteText").value("Strong background in Spring Boot microservices. Schedule technical screen."));

        // 11. Recruiter Shortlists & Updates Status to INTERVIEWING
        mockMvc.perform(patch("/api/v1/recruiter/applications/" + applicationId + "/shortlist")
                        .header("Authorization", "Bearer " + recToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.shortlisted").value(true));

        UpdateApplicationStatusRequest statusUpdate = new UpdateApplicationStatusRequest();
        statusUpdate.setStatus("INTERVIEWING");
        statusUpdate.setNote("Advancing to technical interview stage");

        mockMvc.perform(patch("/api/v1/recruiter/applications/" + applicationId + "/status")
                        .header("Authorization", "Bearer " + recToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusUpdate)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INTERVIEWING"));

        // 12. Candidate Checks Application History & Sees Updated Status (Without Recruiter Private Notes)
        MvcResult candAppsResult = mockMvc.perform(get("/api/v1/candidates/applications")
                        .header("Authorization", "Bearer " + candToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].status").value("INTERVIEWING"))
                .andReturn();

        String candidateAppJson = candAppsResult.getResponse().getContentAsString();
        // Recruiter notes must be completely omitted/null in candidate response
        assertThat(candidateAppJson).doesNotContain("Schedule technical screen");

        // 13. Candidate Checks In-App Notifications
        mockMvc.perform(get("/api/v1/candidates/notifications")
                        .header("Authorization", "Bearer " + candToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].type").value("APPLICATION_STATUS_UPDATED"));
    }

    @Test
    @DisplayName("Security: Recruiter cannot manage another recruiter's job openings")
    void testRecruiterCannotModifyOtherRecruitersJob() throws Exception {
        // Register Recruiter A
        RecruiterRegisterRequest recA = new RecruiterRegisterRequest();
        recA.setEmail("rec.a@companyA.com");
        recA.setPassword("SecureP@ss1");
        recA.setFirstName("Alice");
        recA.setLastName("Recruiter");
        recA.setCompanyName("Company Alpha");

        MvcResult resA = mockMvc.perform(post("/api/v1/auth/register/recruiter")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(recA)))
                .andExpect(status().isCreated()).andReturn();

        String tokenA = objectMapper.readTree(resA.getResponse().getContentAsString()).get("accessToken").asText();

        // Create Job A
        JobDto job = new JobDto();
        job.setTitle("Architect Alpha");
        job.setDescription("Core platform architecture");
        job.setLocation("Remote");
        MvcResult jobRes = mockMvc.perform(post("/api/v1/recruiter/jobs")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(job)))
                .andExpect(status().isCreated()).andReturn();
        Long jobAId = objectMapper.readTree(jobRes.getResponse().getContentAsString()).get("id").asLong();

        // Register Recruiter B
        RecruiterRegisterRequest recB = new RecruiterRegisterRequest();
        recB.setEmail("rec.b@companyB.com");
        recB.setPassword("SecureP@ss1");
        recB.setFirstName("Bob");
        recB.setLastName("Recruiter");
        recB.setCompanyName("Company Beta");

        MvcResult resB = mockMvc.perform(post("/api/v1/auth/register/recruiter")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(recB)))
                .andExpect(status().isCreated()).andReturn();

        String tokenB = objectMapper.readTree(resB.getResponse().getContentAsString()).get("accessToken").asText();

        // Recruiter B attempts to publish or edit Job A -> Must return 403 Forbidden
        mockMvc.perform(patch("/api/v1/recruiter/jobs/" + jobAId + "/publish")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isForbidden());
    }
}
