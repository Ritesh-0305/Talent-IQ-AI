package com.talentiq.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeVersionDto {
    private Long id;
    private Long resumeId;
    private Integer versionNumber;
    private String label;
    private String originalFilename;
    private Long fileSizeBytes;
    private String mimeType;
    private boolean active;
    private LocalDateTime uploadTimestamp;
    private String parseStatus;
}
