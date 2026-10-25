package com.talentiq;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentiq.dto.CandidateRegisterRequest;
import com.talentiq.dto.LoginRequest;
import com.talentiq.dto.RecruiterRegisterRequest;
import com.talentiq.entity.Role;
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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityAndAuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @BeforeEach
    void setUp() {
        // Ensure roles are seeded in H2
        for (RoleType roleType : RoleType.values()) {
            if (roleRepository.findByName(roleType).isEmpty()) {
                roleRepository.save(Role.builder().name(roleType).build());
            }
        }
    }

    @Test
    @DisplayName("Candidate registration succeeds and receives ROLE_CANDIDATE JWT")
    void testCandidateRegistrationAndLogin() throws Exception {
        CandidateRegisterRequest registerRequest = new CandidateRegisterRequest();
        registerRequest.setEmail("candidate.test@example.com");
        registerRequest.setPassword("SecureP@ss1");
        registerRequest.setFirstName("Alice");
        registerRequest.setLastName("Candidate");
        registerRequest.setHeadline("Software Engineer");

        mockMvc.perform(post("/api/v1/auth/register/candidate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.roles[0]").value("ROLE_CANDIDATE"))
                .andExpect(jsonPath("$.email").value("candidate.test@example.com"));

        // Login with credentials
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("candidate.test@example.com");
        loginRequest.setPassword("SecureP@ss1");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty());
    }

    @Test
    @DisplayName("Recruiter registration creates company profile and assigns ROLE_RECRUITER")
    void testRecruiterRegistration() throws Exception {
        RecruiterRegisterRequest registerRequest = new RecruiterRegisterRequest();
        registerRequest.setEmail("recruiter.test@example.com");
        registerRequest.setPassword("SecureP@ss1");
        registerRequest.setFirstName("Bob");
        registerRequest.setLastName("Recruiter");
        registerRequest.setTitle("Tech Talent Lead");
        registerRequest.setCompanyName("InnovateTech Corp");

        mockMvc.perform(post("/api/v1/auth/register/recruiter")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.roles[0]").value("ROLE_RECRUITER"))
                .andExpect(jsonPath("$.email").value("recruiter.test@example.com"));
    }

    @Test
    @DisplayName("Security: Unauthenticated request to candidate profile returns 403/401")
    void testUnauthenticatedAccessDenied() throws Exception {
        mockMvc.perform(get("/api/v1/candidates/me"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Security: Candidate cannot access recruiter-only endpoints")
    void testCandidateForbiddenFromRecruiterEndpoints() throws Exception {
        // Register and login candidate
        CandidateRegisterRequest cand = new CandidateRegisterRequest();
        cand.setEmail("cand.isolated@example.com");
        cand.setPassword("SecureP@ss1");
        cand.setFirstName("Charlie");
        cand.setLastName("Brown");

        MvcResult result = mockMvc.perform(post("/api/v1/auth/register/candidate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cand)))
                .andExpect(status().isCreated())
                .andReturn();

        String token = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("accessToken").asText();

        // Attempt recruiter endpoint with candidate JWT -> Must return 403 Forbidden
        mockMvc.perform(get("/api/v1/recruiter/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Security: Recruiter cannot access admin-only endpoints")
    void testRecruiterForbiddenFromAdminEndpoints() throws Exception {
        // Register recruiter
        RecruiterRegisterRequest rec = new RecruiterRegisterRequest();
        rec.setEmail("rec.isolated@example.com");
        rec.setPassword("SecureP@ss1");
        rec.setFirstName("Diana");
        rec.setLastName("Prince");
        rec.setCompanyName("Wayne Enterprises");

        MvcResult result = mockMvc.perform(post("/api/v1/auth/register/recruiter")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rec)))
                .andExpect(status().isCreated())
                .andReturn();

        String token = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("accessToken").asText();

        // Attempt admin endpoint with recruiter JWT -> Must return 403 Forbidden
        mockMvc.perform(get("/api/v1/admin/dashboard")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Security: Public registration does not accept role tampering")
    void testPublicRegistrationDoesNotAllowAdminEscalation() throws Exception {
        // Attempting to post admin role in candidate registration is ignored by DTO
        CandidateRegisterRequest cand = new CandidateRegisterRequest();
        cand.setEmail("fake.admin@example.com");
        cand.setPassword("SecureP@ss1");
        cand.setFirstName("Hacker");
        cand.setLastName("User");

        MvcResult result = mockMvc.perform(post("/api/v1/auth/register/candidate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cand)))
                .andExpect(status().isCreated())
                .andReturn();

        String roles = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("roles").toString();

        assertThat(roles).contains("ROLE_CANDIDATE");
        assertThat(roles).doesNotContain("ROLE_ADMIN");
    }

    @Test
    @DisplayName("Security: Admin endpoints accessible only by securely provisioned admin")
    void testAdminAccessAllowedForAdminUser() throws Exception {
        // Login with provisioned admin credentials
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("admin@talentiq.local");
        loginRequest.setPassword("Admin@TalentIQ2026");

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String adminToken = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .get("accessToken").asText();

        mockMvc.perform(get("/api/v1/admin/dashboard")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }
}
