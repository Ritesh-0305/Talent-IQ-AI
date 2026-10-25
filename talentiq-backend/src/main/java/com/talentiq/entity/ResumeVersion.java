package com.talentiq.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "resume_versions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false)
    private Resume resume;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    @Column(length = 100)
    private String label;

    @Column(name = "storage_path", nullable = false, length = 500)
    private String storagePath;

    @Column(name = "original_filename", nullable = false)
    private String originalFilename;

    @Column(name = "file_size_bytes", nullable = false)
    private Long fileSizeBytes;

    @Column(name = "mime_type", nullable = false, length = 100)
    private String mimeType;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean active = false;

    @CreationTimestamp
    @Column(name = "upload_timestamp", updatable = false)
    private LocalDateTime uploadTimestamp;

    @Column(name = "parsed_at")
    private LocalDateTime parsedAt;

    @OneToOne(mappedBy = "resumeVersion", cascade = CascadeType.ALL, orphanRemoval = true)
    private ParsedResumeData parsedData;
}
