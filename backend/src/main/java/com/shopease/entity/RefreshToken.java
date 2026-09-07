package com.shopease.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Persisted refresh token record.
 *
 * We never store the raw JWT refresh token in the database — only a SHA-256
 * hash of it (tokenHash). This means that even if the database is ever
 * compromised, stolen rows cannot be replayed as valid refresh tokens.
 * The raw token is only ever handed to the client.
 */
@Entity
@Table(name = "refresh_tokens", indexes = {
        @Index(name = "idx_refresh_token_hash", columnList = "tokenHash", unique = true),
        @Index(name = "idx_refresh_token_user", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, unique = true, length = 128)
    private String tokenHash;

    // Identifier ("jti") embedded in the JWT itself, used to look the row up quickly
    @Column(nullable = false, unique = true, length = 64)
    private String tokenId;

    @Column(nullable = false)
    private LocalDateTime expiryDate;

    @Column(nullable = false)
    @Builder.Default
    private boolean revoked = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "replaced_by_token_id", length = 64)
    private String replacedByTokenId;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
