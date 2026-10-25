package com.talentiq.controller;

import com.talentiq.dto.ParsedResumeDto;
import com.talentiq.dto.ResumeVersionDto;
import com.talentiq.dto.UpdateParsedResumeRequest;
import com.talentiq.entity.ResumeVersion;
import com.talentiq.entity.User;
import com.talentiq.exception.ResourceNotFoundException;
import com.talentiq.repository.UserRepository;
import com.talentiq.security.UserPrincipal;
import com.talentiq.service.ResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/resumes")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;
    private final UserRepository userRepository;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ResumeVersionDto> uploadResume(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "label", required = false) String label
    ) {
        User user = getUser(userPrincipal);
        ResumeVersionDto dto = resumeService.uploadAndProcessResume(user, file, label);
        return new ResponseEntity<>(dto, HttpStatus.CREATED);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<List<ResumeVersionDto>> getMyResumes(
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        User user = getUser(userPrincipal);
        List<ResumeVersionDto> list = resumeService.getCandidateResumeVersions(user);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{versionId}/parsed")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ParsedResumeDto> getParsedResume(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long versionId,
            @RequestParam(value = "anonymized", defaultValue = "false") boolean anonymized
    ) {
        User user = getUser(userPrincipal);
        ParsedResumeDto dto = resumeService.getParsedResume(user, versionId, anonymized);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{versionId}/parsed")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ParsedResumeDto> updateParsedResume(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long versionId,
            @RequestBody UpdateParsedResumeRequest req
    ) {
        User user = getUser(userPrincipal);
        ParsedResumeDto updated = resumeService.updateParsedResume(user, versionId, req);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{versionId}/set-active")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ResumeVersionDto> setActiveVersion(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long versionId
    ) {
        User user = getUser(userPrincipal);
        ResumeVersionDto dto = resumeService.setActiveVersion(user, versionId);
        return ResponseEntity.ok(dto);
    }

    @DeleteMapping("/{versionId}")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<Void> deleteResumeVersion(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long versionId
    ) {
        User user = getUser(userPrincipal);
        resumeService.deleteResumeVersion(user, versionId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{versionId}/download")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> downloadResume(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long versionId
    ) {
        User user = getUser(userPrincipal);
        ResumeVersion version = resumeService.getResumeVersionEntity(versionId);
        Resource resource = resumeService.getResumeFileForDownload(user, versionId);

        String contentType = version.getMimeType() != null ? version.getMimeType() : "application/octet-stream";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + version.getOriginalFilename() + "\"")
                .body(resource);
    }

    private User getUser(UserPrincipal principal) {
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + principal.getId()));
    }
}
