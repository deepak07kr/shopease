package com.shopease.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider tokenProvider;
    private Authentication authentication;

    @BeforeEach
    void setUp() {
        tokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(tokenProvider, "jwtSecret",
                "test-secret-key-for-unit-tests-only-0123456789-abcdefghijklmnop");
        ReflectionTestUtils.setField(tokenProvider, "jwtExpirationMs", 900000L);
        ReflectionTestUtils.setField(tokenProvider, "refreshExpirationMs", 604800000L);

        UserPrincipal principal = new UserPrincipal(
                1L, "John Doe", "john@example.com", "+10000000002", "hashed", true, true, null,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")));
        authentication = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    }

    @Test
    void accessToken_isValid_andTypedAsAccess() {
        String token = tokenProvider.generateAccessToken(authentication);

        assertTrue(tokenProvider.validateToken(token));
        assertTrue(tokenProvider.isAccessToken(token));
        assertFalse(tokenProvider.isRefreshToken(token));
        assertEquals(1L, tokenProvider.getUserIdFromJWT(token));
    }

    @Test
    void refreshToken_isValid_andTypedAsRefresh_withJti() {
        String jti = tokenProvider.generateJti();
        String token = tokenProvider.generateRefreshToken(authentication, jti);

        assertTrue(tokenProvider.validateToken(token));
        assertTrue(tokenProvider.isRefreshToken(token));
        assertFalse(tokenProvider.isAccessToken(token));
        assertEquals(jti, tokenProvider.getJtiFromJWT(token));
    }

    @Test
    void tamperedToken_failsValidation() {
        String token = tokenProvider.generateAccessToken(authentication);
        String tampered = token.substring(0, token.length() - 2) + "xx";

        assertFalse(tokenProvider.validateToken(tampered));
    }

    @Test
    void expiredToken_failsValidation() throws InterruptedException {
        ReflectionTestUtils.setField(tokenProvider, "jwtExpirationMs", 1L);
        String token = tokenProvider.generateAccessToken(authentication);
        Thread.sleep(15);

        assertFalse(tokenProvider.validateToken(token));
    }
}
