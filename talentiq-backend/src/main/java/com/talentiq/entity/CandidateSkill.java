package com.talentiq.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "candidate_skills")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CandidateSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private CandidateProfile candidateProfile;

    @Column(name = "skill_name", nullable = false, length = 100)
    private String skillName;

    @Builder.Default
    @Column(name = "proficiency_level", length = 50)
    private String proficiencyLevel = "INTERMEDIATE";

    @Builder.Default
    @Column(name = "years_used")
    private Integer yearsUsed = 1;
}
