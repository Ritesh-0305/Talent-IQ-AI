package com.talentiq.dto;

import lombok.*;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParsedResumeDto {
    private Long resumeVersionId;
    private String parseStatus;
    private Map<String, Object> contact;
    private List<String> skills;
    private List<Map<String, Object>> education;
    private List<Map<String, Object>> experience;
    private List<Map<String, Object>> projects;
    private List<Map<String, Object>> certifications;
    private String summary;
    private String rawText;
    private List<String> parseWarnings;
}
