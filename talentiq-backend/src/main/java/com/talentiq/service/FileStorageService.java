package com.talentiq.service;

import com.talentiq.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path storageDirectory;
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    public FileStorageService(@Value("${app.storage.resume-dir:uploads/resumes}") String resumeDir) {
        this.storageDirectory = Paths.get(resumeDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.storageDirectory);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize resume storage directory: " + this.storageDirectory, e);
        }
    }

    public String storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Uploaded file cannot be empty (0 bytes).");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("File size exceeds maximum allowable limit of 10MB.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.trim().isEmpty()) {
            throw new BadRequestException("Filename cannot be empty.");
        }

        String cleanFilename = Paths.get(originalFilename).getFileName().toString();
        String extension = "";
        int dotIdx = cleanFilename.lastIndexOf('.');
        if (dotIdx > 0) {
            extension = cleanFilename.substring(dotIdx).toLowerCase();
        }

        if (!extension.equals(".pdf") && !extension.equals(".docx")) {
            throw new BadRequestException("Unsupported file type '" + extension + "'. Only .pdf and .docx documents are accepted.");
        }

        // Validate actual magic bytes
        validateMagicBytes(file, extension);

        // Generate safe unique filename
        String safeStoredName = UUID.randomUUID().toString() + "_" + cleanFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
        Path targetPath = this.storageDirectory.resolve(safeStoredName).normalize();

        // Prevent path traversal
        if (!targetPath.startsWith(this.storageDirectory)) {
            throw new BadRequestException("Invalid path sequence detected in filename.");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
            return targetPath.toString();
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file securely: " + e.getMessage(), e);
        }
    }

    private void validateMagicBytes(MultipartFile file, String extension) {
        try (InputStream is = file.getInputStream()) {
            byte[] header = new byte[4];
            int read = is.read(header);
            if (read < 4) {
                throw new BadRequestException("File header is corrupted or unreadable.");
            }

            if (extension.equals(".pdf")) {
                // PDF magic bytes: %PDF (0x25, 0x50, 0x44, 0x46)
                if (header[0] != 0x25 || header[1] != 0x50 || header[2] != 0x44 || header[3] != 0x46) {
                    throw new BadRequestException("Invalid PDF format: file content signature does not match PDF specification.");
                }
            } else if (extension.equals(".docx")) {
                // DOCX magic bytes: PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
                if (header[0] != 0x50 || header[1] != 0x4B || header[2] != 0x03 || header[3] != 0x04) {
                    throw new BadRequestException("Invalid DOCX format: file content signature does not match DOCX specification.");
                }
            }
        } catch (IOException e) {
            throw new BadRequestException("Unable to read file signature: " + e.getMessage());
        }
    }

    public Resource loadFileAsResource(String storagePath) {
        try {
            Path filePath = Paths.get(storagePath).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new BadRequestException("Stored file is missing or unreadable on server filesystem.");
            }
        } catch (MalformedURLException e) {
            throw new BadRequestException("File storage path error: " + e.getMessage());
        }
    }

    public void deleteFileIfExists(String storagePath) {
        if (storagePath == null) return;
        try {
            Path filePath = Paths.get(storagePath).normalize();
            Files.deleteIfExists(filePath);
        } catch (IOException ignored) {}
    }
}
