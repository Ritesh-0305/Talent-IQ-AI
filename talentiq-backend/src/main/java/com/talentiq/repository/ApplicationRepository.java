package com.talentiq.repository;

import com.talentiq.entity.Application;
import com.talentiq.entity.CandidateProfile;
import com.talentiq.entity.Job;
import com.talentiq.enums.ApplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    boolean existsByCandidateAndJob(CandidateProfile candidate, Job job);

    Optional<Application> findByCandidateAndJob(CandidateProfile candidate, Job job);

    Page<Application> findByCandidateOrderByAppliedAtDesc(CandidateProfile candidate, Pageable pageable);

    List<Application> findByCandidate(CandidateProfile candidate);

    Page<Application> findByJobOrderByAppliedAtDesc(Job job, Pageable pageable);

    Page<Application> findByJobAndStatusOrderByAppliedAtDesc(Job job, ApplicationStatus status, Pageable pageable);

    long countByJob(Job job);

    long countByCandidate(CandidateProfile candidate);

    long countByCandidateAndStatus(CandidateProfile candidate, ApplicationStatus status);
}
