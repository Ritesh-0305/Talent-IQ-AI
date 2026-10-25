package com.talentiq.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AtsAnalysisRequest {

    @NotNull(message = "Resume version ID is required")
    private Long resumeVersionId;

    private Long jobId;
}
