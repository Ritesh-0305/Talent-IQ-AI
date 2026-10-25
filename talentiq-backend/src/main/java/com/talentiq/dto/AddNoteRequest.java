package com.talentiq.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddNoteRequest {

    @NotBlank(message = "Note content cannot be empty")
    private String noteText;
}
