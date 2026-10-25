package com.talentiq.repository;

import com.talentiq.entity.ResumeVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResumeVersionRepository extends JpaRepository<ResumeVersion, Long> {

    List<ResumeVersion> findByResumeIdOrderByVersionNumberDesc(Long resumeId);

    @Query("SELECT MAX(rv.versionNumber) FROM ResumeVersion rv WHERE rv.resume.id = :resumeId")
    Integer findMaxVersionNumberByResumeId(Long resumeId);

    Optional<ResumeVersion> findByResumeIdAndActiveTrue(Long resumeId);
}
