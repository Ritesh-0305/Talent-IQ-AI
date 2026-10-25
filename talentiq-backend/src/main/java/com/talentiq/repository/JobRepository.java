package com.talentiq.repository;

import com.talentiq.entity.Job;
import com.talentiq.entity.RecruiterProfile;
import com.talentiq.enums.JobStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {

    Page<Job> findByPostedBy(RecruiterProfile postedBy, Pageable pageable);

    List<Job> findByPostedBy(RecruiterProfile postedBy);

    long countByPostedByAndStatus(RecruiterProfile postedBy, JobStatus status);

    long countByStatus(JobStatus status);

    @Query("SELECT j FROM Job j WHERE j.status = 'PUBLISHED' " +
           "AND (:keyword IS NULL OR LOWER(j.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "     OR LOWER(j.description) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "     OR LOWER(j.company.name) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (:location IS NULL OR LOWER(j.location) LIKE LOWER(CONCAT('%', :location, '%'))) " +
           "AND (:jobType IS NULL OR j.jobType = :jobType) " +
           "AND (:isRemote IS NULL OR j.remote = :isRemote)")
    Page<Job> searchPublishedJobs(
            @Param("keyword") String keyword,
            @Param("location") String location,
            @Param("jobType") String jobType,
            @Param("isRemote") Boolean isRemote,
            Pageable pageable
    );
}
