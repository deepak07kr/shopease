package com.shopease.controller;

import com.shopease.dto.FileUploadResponse;
import com.shopease.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/uploads")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin - Uploads", description = "Product image uploads")
public class FileUploadController {

    private final FileStorageService fileStorageService;

    @PostMapping(value = "/product-image", consumes = "multipart/form-data")
    @Operation(summary = "Upload a product image", description = "Returns a relative URL to set as the product's imageUrl.")
    public ResponseEntity<FileUploadResponse> uploadProductImage(@RequestParam("file") MultipartFile file) {
        String url = fileStorageService.storeProductImage(file);
        return ResponseEntity.ok(FileUploadResponse.builder().url(url).build());
    }
}
