package com.shopease.config;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configures the Cloudinary client used by FileStorageService for product
 * image uploads.
 *
 * Cloudinary's Java SDK understands a single connection-string style env var
 * of the form:
 *   cloudinary://<api_key>:<api_secret>@<cloud_name>
 * That single value (CLOUDINARY_URL) is all you need - Cloudinary picks it
 * up automatically, no separate key/secret/cloud-name properties required.
 * Get it from the Cloudinary dashboard -> Account Details -> API Environment
 * variable.
 */
@Configuration
public class CloudinaryConfig {

    @Value("${cloudinary.url}")
    private String cloudinaryUrl;

    @Bean
    public Cloudinary cloudinary() {
        Cloudinary cloudinary = new Cloudinary(cloudinaryUrl);
        cloudinary.config.secure = true; // always return https:// URLs
        return cloudinary;
    }
}
