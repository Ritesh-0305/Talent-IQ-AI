package com.talentiq.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateApplicationStatusRequest {

    @NotNull(message = "New application status is required")
    private String status;

    private String note;
}
