package com.shopease.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = true, unique = true, length = 20)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    // Account is disabled by an admin (distinct from email/phone verification)
    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = true;

    // Set to true only after the user completes OTP verification
    @Column(nullable = false)
    @Builder.Default
    private boolean verified = false;

    @Column(name = "otp_code", length = 10)
    private String otpCode;

    @Column(name = "otp_expiry_time")
    private LocalDateTime otpExpiryTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "otp_purpose", length = 30)
    private OtpPurpose otpPurpose;

    @Column(name = "otp_attempts", nullable = false)
    @Builder.Default
    private int otpAttempts = 0;

    @Column(name = "otp_last_sent_at")
    private LocalDateTime otpLastSentAt;

    @Column(name = "otp_resend_count", nullable = false)
    @Builder.Default
    private int otpResendCount = 0;

    @Column(name = "failed_login_attempts", nullable = false)
    @Builder.Default
    private int failedLoginAttempts = 0;

    @Column(name = "lockout_until")
    private LocalDateTime lockoutUntil;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
