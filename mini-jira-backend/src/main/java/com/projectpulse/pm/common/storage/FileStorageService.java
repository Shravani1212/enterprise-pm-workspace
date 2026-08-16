package com.projectpulse.pm.common.storage;

import com.projectpulse.pm.common.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path fileStorageLocation;

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("pdf", "jpg", "jpeg", "png");

    public FileStorageService(@Value("${app.storage.upload-dir:C:/enterprise-pm/attachments}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored: " + this.fileStorageLocation, ex);
        }
    }

    public record FileStorageResult(String filePath, String fileName, String contentType) {}

    public FileStorageResult storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store empty file.");
        }

        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "document");
        if (originalFileName.contains("..")) {
            throw new IllegalArgumentException("Filename contains invalid path sequence: " + originalFileName);
        }

        String extension = getFileExtension(originalFileName).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Invalid file type '" + extension + "'. Only PDF, JPG, JPEG, and PNG files are allowed.");
        }

        String uniqueFileName = UUID.randomUUID().toString() + "_" + originalFileName;

        try {
            Files.createDirectories(this.fileStorageLocation);
            Path targetLocation = this.fileStorageLocation.resolve(uniqueFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            String storedPath = targetLocation.toString();
            String contentType = file.getContentType() != null ? file.getContentType() : getContentTypeFromExtension(extension);

            return new FileStorageResult(storedPath, originalFileName, contentType);
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + originalFileName + ". Please try again!", ex);
        }
    }

    public Resource loadFileAsResource(String filePathStr) {
        if (filePathStr == null || filePathStr.isBlank()) {
            throw new ResourceNotFoundException("No attachment found");
        }

        try {
            Path filePath = Paths.get(filePathStr).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("File not found or not readable at path: " + filePathStr);
            }
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException("File not found at path: " + filePathStr);
        }
    }

    public void deleteFile(String filePathStr) {
        if (filePathStr == null || filePathStr.isBlank()) {
            return;
        }

        try {
            Path filePath = Paths.get(filePathStr).normalize();
            Files.deleteIfExists(filePath);
        } catch (IOException ex) {
            // Ignore deletion errors or log warning
        }
    }

    private String getFileExtension(String fileName) {
        int lastIndexOfDot = fileName.lastIndexOf('.');
        if (lastIndexOfDot == -1) {
            return "";
        }
        return fileName.substring(lastIndexOfDot + 1);
    }

    private String getContentTypeFromExtension(String extension) {
        return switch (extension.toLowerCase()) {
            case "pdf" -> "application/pdf";
            case "jpg", "jpeg" -> "image/jpeg";
            case "png" -> "image/png";
            default -> "application/octet-stream";
        };
    }
}
