package com.talentiq.service;

import com.talentiq.entity.Role;
import com.talentiq.entity.User;
import com.talentiq.enums.RoleType;
import com.talentiq.repository.RoleRepository;
import com.talentiq.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminProvisioningRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.seed-email:admin@talentiq.local}")
    private String adminSeedEmail;

    @Value("${app.admin.seed-password:Admin@TalentIQ2026}")
    private String adminSeedPassword;

    @Override
    @Transactional
    public void run(String... args) {
        // Ensure default roles exist in database
        for (RoleType roleType : RoleType.values()) {
            if (roleRepository.findByName(roleType).isEmpty()) {
                roleRepository.save(Role.builder().name(roleType).build());
                log.info("Initialized system role: {}", roleType);
            }
        }

        // Provision admin user securely from environment configuration if not present
        if (!userRepository.existsByEmail(adminSeedEmail.toLowerCase().trim())) {
            Role adminRole = roleRepository.findByName(RoleType.ROLE_ADMIN)
                    .orElseThrow(() -> new IllegalStateException("ROLE_ADMIN could not be found or initialized"));

            User admin = User.builder()
                    .email(adminSeedEmail.toLowerCase().trim())
                    .passwordHash(passwordEncoder.encode(adminSeedPassword))
                    .active(true)
                    .deleted(false)
                    .roles(Collections.singleton(adminRole))
                    .build();

            userRepository.save(admin);
            log.info("Securely provisioned platform Administrator: {}", adminSeedEmail);
        } else {
            log.info("Platform Administrator account already provisioned: {}", adminSeedEmail);
        }
    }
}
