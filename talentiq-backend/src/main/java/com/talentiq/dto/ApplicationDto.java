package com.talentiq.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationDto {

    private Long id;

    @NotNull(message = "Job ID is required")
    private Long jobId;

    private String jobTitle;
    private String companyName;
    private String jobLocation;
    private Long candidateId;
    private String candidateName;
    private String candidateEmail;
    private String candidateHeadline;
    private String coverLetterText;
    private String status;
    private boolean shortlisted;
    private LocalDateTime appliedAt;
    private LocalDateTime updatedAt;

    private List<StatusHistoryDto> history;
    private List<NoteDto> recruiterNotes;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusHistoryDto {
        private String fromStatus;
        private String toStatus;
        private String changedByName;
        private String note;
        private LocalDateTime changedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NoteDto {
        private Long id;
        private String recruiterName;
        private String noteText;
        private LocalDateTime createdAt;
    }
}
