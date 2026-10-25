package com.talentiq.repository;

import com.talentiq.entity.Application;
import com.talentiq.entity.RecruiterNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecruiterNoteRepository extends JpaRepository<RecruiterNote, Long> {
    List<RecruiterNote> findByApplicationOrderByCreatedAtDesc(Application application);
}
