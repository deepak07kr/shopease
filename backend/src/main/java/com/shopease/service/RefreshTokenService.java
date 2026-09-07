package com.shopease.service;

import com.shopease.entity.RefreshToken;
import com.shopease.entity.User;
import com.shopease.exception.BadRequestException;
import com.shopease.repository.RefreshTokenRepository;
import com.shopease.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider tokenProvider;

    /**
     * Issues a brand-new refresh token for the given authentication and persists
     * its hash so it can be looked up / revoked later.
     */
    @Transactional
    public String issue(Authentication authentication, User user) {
        String jti = tokenProvider.generateJti();
        String rawToken = tokenProvider.generateRefreshToken(authentication, jti);

        RefreshToken record = RefreshToken.builder()
                .user(user)
                .tokenId(jti)
                .tokenHash(hash(rawToken))
                .expiryDate(LocalDateTime.now().plusSeconds(tokenProvider.getRefreshTokenExpirationMs() / 1000))
                .revoked(false)
                .build();
        refreshTokenRepository.save(record);

        return rawToken;
    }

    /**
     * Validates a presented refresh token: signature/expiry via the JWT itself,
     * plus the persisted record must exist, be un-revoked and un-expired.
     * Returns the matching persisted record.
     */
    @Transactional
    public RefreshToken validate(String rawToken) {
        if (!tokenProvider.validateToken(rawToken) || !tokenProvider.isRefreshToken(rawToken)) {
            throw new BadRequestException("Invalid or expired refresh token");
        }

        String jti = tokenProvider.getJtiFromJWT(rawToken);
        RefreshToken record = refreshTokenRepository.findByTokenId(jti)
                .orElseThrow(() -> new BadRequestException("Invalid or expired refresh token"));

        if (record.isRevoked()) {
            // Reuse of an already-rotated/revoked refresh token is a strong signal of
            // token theft - revoke the whole family (all of this user's tokens) defensively.
            refreshTokenRepository.revokeAllForUser(record.getUser());
            throw new BadRequestException("Refresh token has already been used or revoked. All sessions have been logged out for your safety.");
        }

        if (record.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Refresh token has expired. Please log in again.");
        }

        if (!record.getTokenHash().equals(hash(rawToken))) {
            throw new BadRequestException("Invalid refresh token");
        }

        return record;
    }

    /** Rotates a refresh token: revokes the old one and issues + persists a new one. */
    @Transactional
    public String rotate(RefreshToken oldRecord, Authentication authentication) {
        oldRecord.setRevoked(true);

        String newJti = tokenProvider.generateJti();
        String newRawToken = tokenProvider.generateRefreshToken(authentication, newJti);

        oldRecord.setReplacedByTokenId(newJti);
        refreshTokenRepository.save(oldRecord);

        RefreshToken newRecord = RefreshToken.builder()
                .user(oldRecord.getUser())
                .tokenId(newJti)
                .tokenHash(hash(newRawToken))
                .expiryDate(LocalDateTime.now().plusSeconds(tokenProvider.getRefreshTokenExpirationMs() / 1000))
                .revoked(false)
                .build();
        refreshTokenRepository.save(newRecord);

        return newRawToken;
    }

    @Transactional
    public void revoke(String rawToken) {
        if (rawToken == null) {
            return;
        }
        String jti;
        try {
            // validateToken() is exception-safe (catches expired/malformed/garbage
            // tokens internally); isRefreshToken()/getJtiFromJWT() are not, so they
            // must only ever be called after validateToken() has already passed.
            if (!tokenProvider.validateToken(rawToken) || !tokenProvider.isRefreshToken(rawToken)) {
                return;
            }
            jti = tokenProvider.getJtiFromJWT(rawToken);
        } catch (Exception ex) {
            return; // malformed / already invalid token - nothing to revoke, logout is idempotent
        }
        refreshTokenRepository.findByTokenId(jti).ifPresent(record -> {
            record.setRevoked(true);
            refreshTokenRepository.save(record);
        });
    }

    /** Revokes every active session/refresh-token for a user (e.g. on password reset). */
    @Transactional
    public void revokeAllForUser(User user) {
        refreshTokenRepository.revokeAllForUser(user);
    }

    private String hash(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
