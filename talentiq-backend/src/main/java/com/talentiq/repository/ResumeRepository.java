package com.talentiq.repository;

import com.talentiq.entity.Resume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, Long> {
    Optional<Resume> findByCandidateIdAndDeletedFalse(Long candidateId);
}
