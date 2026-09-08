package com.shopease.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.shopease.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Validates and uploads product images to Cloudinary, returning the
 * public HTTPS (CDN) URL to store on the product record.
 *
 * Cloudinary handles storage, global CDN delivery, and automatic
 * optimization/resizing, replacing the old local-disk implementation
 * (which was slow and not shared across replicas/pods).
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class FileStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );
    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024; // 5MB, mirrors spring.servlet.multipart.max-file-size

    private final Cloudinary cloudinary;

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

        try {
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", "shopease/products",
                    "public_id", UUID.randomUUID().toString(),
                    "resource_type", "image",
                    // Auto-optimize quality/format (e.g. serves WebP/AVIF to browsers
                    // that support it) - this is what actually fixes slow load times,
                    // on top of moving off the app server onto Cloudinary's CDN.
                    "quality", "auto",
                    "fetch_format", "auto",
                    "overwrite", false
            ));

            String secureUrl = (String) uploadResult.get("secure_url");
            if (secureUrl == null) {
                throw new BadRequestException("Failed to save the uploaded image. Please try again.");
            }
            return secureUrl;
        } catch (IOException e) {
            log.error("Failed to upload product image to Cloudinary", e);
            throw new BadRequestException("Failed to save the uploaded image. Please try again.");
        }
    }
}
