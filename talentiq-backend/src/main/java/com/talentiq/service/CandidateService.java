package com.talentiq.service;

import com.talentiq.dto.CandidateProfileDto;
import com.talentiq.entity.CandidateProfile;
import com.talentiq.entity.CandidateSkill;
import com.talentiq.entity.User;
import com.talentiq.exception.ResourceNotFoundException;
import com.talentiq.repository.CandidateProfileRepository;
import com.talentiq.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CandidateService {

    private final CandidateProfileRepository candidateProfileRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public CandidateProfileDto getProfile(Long userId) {
        CandidateProfile profile = candidateProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate profile not found for user: " + userId));

        return toDto(profile);
    }

    @Transactional
    public CandidateProfileDto updateProfile(Long userId, CandidateProfileDto dto) {
        CandidateProfile profile = candidateProfileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
                    return CandidateProfile.builder().user(user).build();
                });

        profile.setFirstName(dto.getFirstName());
        profile.setLastName(dto.getLastName());
        profile.setHeadline(dto.getHeadline());
        profile.setBio(dto.getBio());
        profile.setLocation(dto.getLocation());
        profile.setPhone(dto.getPhone());
        profile.setLinkedinUrl(dto.getLinkedinUrl());
        profile.setGithubUrl(dto.getGithubUrl());
        profile.setPortfolioUrl(dto.getPortfolioUrl());
        profile.setYearsExperience(dto.getYearsExperience() != null ? dto.getYearsExperience() : 0);
        profile.setProfilePhotoUrl(dto.getProfilePhotoUrl());

        if (dto.getSkills() != null) {
            profile.clearSkills();
            for (CandidateProfileDto.SkillDto skillDto : dto.getSkills()) {
                CandidateSkill skill = CandidateSkill.builder()
                        .skillName(skillDto.getSkillName())
                        .proficiencyLevel(skillDto.getProficiencyLevel() != null ? skillDto.getProficiencyLevel() : "INTERMEDIATE")
                        .yearsUsed(skillDto.getYearsUsed() != null ? skillDto.getYearsUsed() : 1)
                        .build();
                profile.addSkill(skill);
            }
        }

        profile = candidateProfileRepository.save(profile);
        return toDto(profile);
    }

    private CandidateProfileDto toDto(CandidateProfile profile) {
        List<CandidateProfileDto.SkillDto> skills = profile.getSkills().stream()
                .map(s -> CandidateProfileDto.SkillDto.builder()
                        .id(s.getId())
                        .skillName(s.getSkillName())
                        .proficiencyLevel(s.getProficiencyLevel())
                        .yearsUsed(s.getYearsUsed())
                        .build())
                .collect(Collectors.toList());

        return CandidateProfileDto.builder()
                .id(profile.getId())
                .userId(profile.getUser().getId())
                .firstName(profile.getFirstName())
                .lastName(profile.getLastName())
                .headline(profile.getHeadline())
                .bio(profile.getBio())
                .location(profile.getLocation())
                .phone(profile.getPhone())
                .linkedinUrl(profile.getLinkedinUrl())
                .githubUrl(profile.getGithubUrl())
                .portfolioUrl(profile.getPortfolioUrl())
                .yearsExperience(profile.getYearsExperience())
                .profilePhotoUrl(profile.getProfilePhotoUrl())
                .skills(skills)
                .build();
    }
}
