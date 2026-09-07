package com.shopease.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

public class AuthDTOs {

    // ---------- Registration ----------

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RegisterRequest {
        @NotBlank(message = "Full name is required")
        @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
        private String fullName;

        @NotBlank(message = "Email is required")
        @Email(message = "Email should be valid")
        private String email;

        @NotBlank(message = "Mobile number is required")
        @Pattern(regexp = "^\\+?[0-9]{7,15}$", message = "Mobile number must be a valid phone number")
        private String phone;

        @NotBlank(message = "Password is required")
        @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^()_+=\\-{}\\[\\]:;\"'<>,.?/~`|\\\\]).{8,100}$",
            message = "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character"
        )
        private String password;

        @NotBlank(message = "Please confirm your password")
        private String confirmPassword;

        // Optional - the frontend enforces this must be checked; not persisted.
        private Boolean acceptTerms;

        @AssertTrue(message = "Password and confirm password must match")
        public boolean isPasswordConfirmed() {
            return password != null && password.equals(confirmPassword);
        }
    }

    // ---------- Account verification ----------

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VerifyAccountRequest {
        @NotBlank(message = "Email or phone is required")
        private String identifier; // email or phone

        @NotBlank(message = "OTP code is required")
        @Size(min = 6, max = 6, message = "OTP must be 6 digits")
        private String otpCode;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ResendOtpRequest {
        @NotBlank(message = "Email or phone is required")
        private String identifier;
    }

    // ---------- Login ----------

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LoginRequest {
        @NotBlank(message = "Email or mobile number is required")
        private String identifier; // email or phone

        @NotBlank(message = "Password is required")
        private String password;

        @Builder.Default
        private boolean rememberMe = false;
    }

    // ---------- Tokens ----------

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RefreshTokenRequest {
        @NotBlank(message = "Refresh token is required")
        private String refreshToken;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LogoutRequest {
        @NotBlank(message = "Refresh token is required")
        private String refreshToken;
    }

    // ---------- Forgot / reset password ----------

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ForgotPasswordRequest {
        @NotBlank(message = "Email or mobile number is required")
        private String identifier;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ResetPasswordRequest {
        @NotBlank(message = "Email or mobile number is required")
        private String identifier;

        @NotBlank(message = "OTP code is required")
        @Size(min = 6, max = 6, message = "OTP must be 6 digits")
        private String otpCode;

        @NotBlank(message = "New password is required")
        @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^()_+=\\-{}\\[\\]:;\"'<>,.?/~`|\\\\]).{8,100}$",
            message = "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character"
        )
        private String newPassword;

        @NotBlank(message = "Please confirm your new password")
        private String confirmPassword;

        @AssertTrue(message = "New password and confirm password must match")
        public boolean isPasswordConfirmed() {
            return newPassword != null && newPassword.equals(confirmPassword);
        }
    }

    // ---------- Response payloads ----------

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserSummary {
        private Long id;
        private String fullName;
        private String email;
        private String phone;
        private String role;
        private boolean verified;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class JwtResponse {
        @Builder.Default
        private boolean success = true;
        private String message;
        private String accessToken;
        private String refreshToken;
        @Builder.Default
        private String tokenType = "Bearer";
        private Long expiresIn; // access token TTL in seconds
        private UserSummary user;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MessageResponse {
        @Builder.Default
        private boolean success = true;
        private String message;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class OtpResponse {
        @Builder.Default
        private boolean success = true;
        private String message;
        private String identifier;
        private Integer expiresInSeconds;
        // Only ever populated when app.otp.dev-mode=true (local development). Never set in production.
        private String devOtp;
    }
}
