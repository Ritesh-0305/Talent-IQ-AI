package com.talentiq.service;

import com.talentiq.dto.RecruiterProfileDto;
import com.talentiq.entity.Company;
import com.talentiq.entity.RecruiterProfile;
import com.talentiq.entity.User;
import com.talentiq.exception.ResourceNotFoundException;
import com.talentiq.repository.CompanyRepository;
import com.talentiq.repository.RecruiterProfileRepository;
import com.talentiq.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RecruiterService {

    private final RecruiterProfileRepository recruiterProfileRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public RecruiterProfileDto getProfile(Long userId) {
        RecruiterProfile profile = recruiterProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Recruiter profile not found for user: " + userId));

        return toDto(profile);
    }

    @Transactional
    public RecruiterProfileDto updateProfile(Long userId, RecruiterProfileDto dto) {
        RecruiterProfile profile = recruiterProfileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
                    return RecruiterProfile.builder().user(user).build();
                });

        profile.setFirstName(dto.getFirstName());
        profile.setLastName(dto.getLastName());
        profile.setTitle(dto.getTitle());
        profile.setPhone(dto.getPhone());

        if (dto.getCompany() != null && dto.getCompany().getName() != null) {
            Company company;
            if (dto.getCompany().getId() != null) {
                company = companyRepository.findById(dto.getCompany().getId())
                        .orElse(null);
            } else {
                company = companyRepository.findByName(dto.getCompany().getName().trim()).orElse(null);
            }

            if (company == null) {
                company = Company.builder()
                        .name(dto.getCompany().getName().trim())
                        .description(dto.getCompany().getDescription())
                        .website(dto.getCompany().getWebsite())
                        .industry(dto.getCompany().getIndustry())
                        .sizeRange(dto.getCompany().getSizeRange())
                        .logoUrl(dto.getCompany().getLogoUrl())
                        .verified(false)
                        .build();
            } else {
                company.setDescription(dto.getCompany().getDescription());
                company.setWebsite(dto.getCompany().getWebsite());
                company.setIndustry(dto.getCompany().getIndustry());
                company.setSizeRange(dto.getCompany().getSizeRange());
                company.setLogoUrl(dto.getCompany().getLogoUrl());
            }
            company = companyRepository.save(company);
            profile.setCompany(company);
        }

        profile = recruiterProfileRepository.save(profile);
        return toDto(profile);
    }

    private RecruiterProfileDto toDto(RecruiterProfile profile) {
        RecruiterProfileDto.CompanyDto companyDto = null;
        if (profile.getCompany() != null) {
            Company c = profile.getCompany();
            companyDto = RecruiterProfileDto.CompanyDto.builder()
                    .id(c.getId())
                    .name(c.getName())
                    .description(c.getDescription())
                    .website(c.getWebsite())
                    .industry(c.getIndustry())
                    .sizeRange(c.getSizeRange())
                    .logoUrl(c.getLogoUrl())
                    .verified(c.isVerified())
                    .build();
        }

        return RecruiterProfileDto.builder()
                .id(profile.getId())
                .userId(profile.getUser().getId())
                .firstName(profile.getFirstName())
                .lastName(profile.getLastName())
                .title(profile.getTitle())
                .phone(profile.getPhone())
                .company(companyDto)
                .build();
    }
}
