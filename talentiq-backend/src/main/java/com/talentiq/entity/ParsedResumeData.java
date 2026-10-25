package com.talentiq.entity;

import com.talentiq.enums.ParseStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "parsed_resume_data")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParsedResumeData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_version_id", nullable = false, unique = true)
    private ResumeVersion resumeVersion;

    @Column(name = "raw_text", columnDefinition = "LONGTEXT")
    private String rawText;

    @Column(name = "contact_json", columnDefinition = "LONGTEXT")
    private String contactJson;

    @Column(name = "skills_json", columnDefinition = "LONGTEXT")
    private String skillsJson;

    @Column(name = "education_json", columnDefinition = "LONGTEXT")
    private String educationJson;

    @Column(name = "experience_json", columnDefinition = "LONGTEXT")
    private String experienceJson;

    @Column(name = "projects_json", columnDefinition = "LONGTEXT")
    private String projectsJson;

    @Column(name = "certifications_json", columnDefinition = "LONGTEXT")
    private String certificationsJson;

    @Column(name = "summary_text", columnDefinition = "TEXT")
    private String summaryText;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "parse_status", nullable = false, length = 50)
    private ParseStatus parseStatus = ParseStatus.PENDING;

    @Column(name = "parsed_at")
    private LocalDateTime parsedAt;
}
