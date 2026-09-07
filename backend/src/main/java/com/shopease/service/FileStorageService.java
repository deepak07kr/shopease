package com.shopease.service;

import com.shopease.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp", "gif");
    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024; // 5MB, mirrors spring.servlet.multipart.max-file-size

    @Value("${app.upload.dir}")
    private String uploadDir;

    /**
     * Validates and saves an uploaded product image, returning the relative
     * public path (e.g. "/uploads/products/&lt;uuid&gt;.jpg") to store on the
     * product record. The file is renamed to a random UUID - the original
     * filename is never trusted or persisted, which also rules out path
     * traversal via a crafted filename.
     */
    public String storeProductImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("No file was uploaded");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException("Image must be smaller than 5MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new BadRequestException("Only JPEG, PNG, WEBP or GIF images are allowed");
        }

        String extension = extensionFor(file.getOriginalFilename(), contentType);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException("Only JPEG, PNG, WEBP or GIF images are allowed");
        }

        try {
            Path productsDir = Paths.get(uploadDir, "products").toAbsolutePath().normalize();
            Files.createDirectories(productsDir);

            String filename = UUID.randomUUID() + "." + extension;
            Path target = productsDir.resolve(filename).normalize();

            // Defensive check: the resolved path must still live inside productsDir.
            if (!target.startsWith(productsDir)) {
                throw new BadRequestException("Invalid file name");
            }

            try (var in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }

            return "/uploads/products/" + filename;
        } catch (IOException e) {
            log.error("Failed to store uploaded product image", e);
            throw new BadRequestException("Failed to save the uploaded image. Please try again.");
        }
    }

    private String extensionFor(String originalFilename, String contentType) {
        String fromName = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            fromName = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
        }
        if (ALLOWED_EXTENSIONS.contains(fromName)) {
            return fromName;
        }
        // Fall back to deriving the extension from the (already-validated) content type.
        return switch (contentType.toLowerCase(Locale.ROOT)) {
            case "image/jpeg" -> "jpg";
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            case "image/gif" -> "gif";
            default -> "";
        };
    }
}
