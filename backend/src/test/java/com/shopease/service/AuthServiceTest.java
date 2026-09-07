package com.shopease.service;

import com.shopease.dto.AuthDTOs.*;
import com.shopease.entity.OtpPurpose;
import com.shopease.entity.RefreshToken;
import com.shopease.entity.Role;
import com.shopease.entity.User;
import com.shopease.exception.BadRequestException;
import com.shopease.exception.ConflictException;
import com.shopease.exception.ForbiddenException;
import com.shopease.exception.TooManyRequestsException;
import com.shopease.repository.UserRepository;
import com.shopease.security.JwtTokenProvider;
import com.shopease.security.RateLimiterService;
import com.shopease.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtTokenProvider tokenProvider;
    @Mock private RefreshTokenService refreshTokenService;
    @Mock private EmailService emailService;
    @Mock private RateLimiterService rateLimiterService;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        // Inject the @Value-driven fields that Spring would normally populate.
        ReflectionTestUtils.setField(authService, "otpExpiryMinutes", 10L);
        ReflectionTestUtils.setField(authService, "maxOtpVerifyAttempts", 5);
        ReflectionTestUtils.setField(authService, "otpResendCooldownSeconds", 60L);
        ReflectionTestUtils.setField(authService, "maxOtpResendsPerWindow", 5);
        ReflectionTestUtils.setField(authService, "otpResendWindowMinutes", 60L);
        ReflectionTestUtils.setField(authService, "otpDevMode", true);
        ReflectionTestUtils.setField(authService, "maxFailedLogins", 5);
        ReflectionTestUtils.setField(authService, "lockoutMinutes", 15L);
    }

    private User sampleUser() {
        return User.builder()
                .id(1L)
                .name("John Doe")
                .email("john@example.com")
                .phone("+10000000002")
                .password("hashed-password")
                .role(Role.ROLE_USER)
                .enabled(true)
                .verified(false)
                .otpAttempts(0)
                .build();
    }

    // ---------------- Registration ----------------

    @Test
    void register_success_createsUnverifiedUserAndSendsOtp() {
        RegisterRequest req = RegisterRequest.builder()
                .fullName("Jane Roe")
                .email("Jane@Example.com")
                .phone("+19998887777")
                .password("Str0ng!Pass")
                .confirmPassword("Str0ng!Pass")
                .build();

        when(userRepository.existsByEmail("jane@example.com")).thenReturn(false);
        when(userRepository.existsByPhone("+19998887777")).thenReturn(false);
        when(passwordEncoder.encode("Str0ng!Pass")).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        OtpResponse response = authService.register(req);

        assertTrue(response.isSuccess());
        assertEquals("jane@example.com", response.getIdentifier());
        assertNotNull(response.getDevOtp());

        verify(userRepository).save(argThat(u ->
                u.getRole() == Role.ROLE_USER &&
                !u.isVerified() &&
                u.isEnabled() &&
                "jane@example.com".equals(u.getEmail())
        ));
        verify(emailService).sendOtpEmail(eq("jane@example.com"), anyString(), anyString());
    }

    @Test
    void register_duplicateEmail_throwsConflict() {
        RegisterRequest req = RegisterRequest.builder()
                .fullName("Jane Roe").email("john@example.com").phone("+19998887777")
                .password("Str0ng!Pass").confirmPassword("Str0ng!Pass").build();

        when(userRepository.existsByEmail("john@example.com")).thenReturn(true);

        assertThrows(ConflictException.class, () -> authService.register(req));
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_duplicatePhone_throwsConflict() {
        RegisterRequest req = RegisterRequest.builder()
                .fullName("Jane Roe").email("new@example.com").phone("+10000000002")
                .password("Str0ng!Pass").confirmPassword("Str0ng!Pass").build();

        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(userRepository.existsByPhone("+10000000002")).thenReturn(true);

        assertThrows(ConflictException.class, () -> authService.register(req));
    }

    // ---------------- Verification ----------------

    @Test
    void verifyAccount_correctOtp_marksVerified() {
        User user = sampleUser();
        user.setOtpCode("123456");
        user.setOtpPurpose(OtpPurpose.VERIFY_ACCOUNT);
        user.setOtpExpiryTime(LocalDateTime.now().plusMinutes(5));

        when(userRepository.findByEmailOrPhone(anyString(), anyString())).thenReturn(Optional.of(user));

        MessageResponse response = authService.verifyAccount(
                new VerifyAccountRequest("john@example.com", "123456"));

        assertTrue(response.isSuccess());
        assertTrue(user.isVerified());
        assertNull(user.getOtpCode());
        verify(userRepository).save(user);
    }

    @Test
    void verifyAccount_invalidOtp_throwsAndIncrementsAttempts() {
        User user = sampleUser();
        user.setOtpCode("123456");
        user.setOtpPurpose(OtpPurpose.VERIFY_ACCOUNT);
        user.setOtpExpiryTime(LocalDateTime.now().plusMinutes(5));

        when(userRepository.findByEmailOrPhone(anyString(), anyString())).thenReturn(Optional.of(user));

        assertThrows(BadRequestException.class, () -> authService.verifyAccount(
                new VerifyAccountRequest("john@example.com", "000000")));

        assertEquals(1, user.getOtpAttempts());
        assertFalse(user.isVerified());
    }

    @Test
    void verifyAccount_expiredOtp_throws() {
        User user = sampleUser();
        user.setOtpCode("123456");
        user.setOtpPurpose(OtpPurpose.VERIFY_ACCOUNT);
        user.setOtpExpiryTime(LocalDateTime.now().minusMinutes(1));

        when(userRepository.findByEmailOrPhone(anyString(), anyString())).thenReturn(Optional.of(user));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> authService.verifyAccount(
                new VerifyAccountRequest("john@example.com", "123456")));
        assertTrue(ex.getMessage().toLowerCase().contains("expired"));
    }

    @Test
    void verifyAccount_tooManyAttempts_throwsTooManyRequests() {
        User user = sampleUser();
        user.setOtpCode("123456");
        user.setOtpPurpose(OtpPurpose.VERIFY_ACCOUNT);
        user.setOtpExpiryTime(LocalDateTime.now().plusMinutes(5));
        user.setOtpAttempts(5);

        when(userRepository.findByEmailOrPhone(anyString(), anyString())).thenReturn(Optional.of(user));

        assertThrows(TooManyRequestsException.class, () -> authService.verifyAccount(
                new VerifyAccountRequest("john@example.com", "000000")));
    }

    // ---------------- Login ----------------

    @Test
    void login_wrongPassword_throwsBadCredentials() {
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("bad creds"));
        when(userRepository.findByEmailOrPhone(anyString(), anyString())).thenReturn(Optional.of(sampleUser()));

        LoginRequest req = new LoginRequest("john@example.com", "wrong", false);

        assertThrows(BadCredentialsException.class, () -> authService.login(req));
        verify(userRepository).save(argThat(u -> u.getFailedLoginAttempts() == 1));
    }

    @Test
    void login_unverifiedAccount_throwsForbidden() {
        User user = sampleUser();
        user.setVerified(false);

        UserPrincipal principal = UserPrincipal.create(user);
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        when(authenticationManager.authenticate(any())).thenReturn(auth);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        LoginRequest req = new LoginRequest("john@example.com", "correct", false);

        assertThrows(ForbiddenException.class, () -> authService.login(req));
    }

    @Test
    void login_success_returnsTokens() {
        User user = sampleUser();
        user.setVerified(true);

        UserPrincipal principal = UserPrincipal.create(user);
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        when(authenticationManager.authenticate(any())).thenReturn(auth);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(tokenProvider.generateAccessToken(any())).thenReturn("access-token");
        when(tokenProvider.getAccessTokenExpirationMs()).thenReturn(900000L);
        when(refreshTokenService.issue(any(), eq(user))).thenReturn("refresh-token");

        JwtResponse response = authService.login(new LoginRequest("john@example.com", "correct", false));

        assertTrue(response.isSuccess());
        assertEquals("access-token", response.getAccessToken());
        assertEquals("refresh-token", response.getRefreshToken());
        assertEquals("john@example.com", response.getUser().getEmail());
        assertTrue(response.getUser().isVerified());
    }

    // ---------------- Refresh / logout ----------------

    @Test
    void refreshToken_valid_rotatesAndReturnsNewTokens() {
        User user = sampleUser();
        user.setVerified(true);
        RefreshToken record = RefreshToken.builder().id(9L).user(user).tokenId("jti-1").build();

        when(refreshTokenService.validate("raw-refresh")).thenReturn(record);
        when(tokenProvider.generateAccessToken(any())).thenReturn("new-access");
        when(tokenProvider.getAccessTokenExpirationMs()).thenReturn(900000L);
        when(refreshTokenService.rotate(eq(record), any())).thenReturn("new-refresh");

        JwtResponse response = authService.refreshToken(new RefreshTokenRequest("raw-refresh"));

        assertEquals("new-access", response.getAccessToken());
        assertEquals("new-refresh", response.getRefreshToken());
    }

    @Test
    void logout_revokesRefreshToken() {
        MessageResponse response = authService.logout(new LogoutRequest("raw-refresh"));
        verify(refreshTokenService).revoke("raw-refresh");
        assertTrue(response.isSuccess());
    }

    // ---------------- Forgot / reset password ----------------

    @Test
    void forgotPassword_unknownIdentifier_stillReturnsGenericMessage() {
        when(rateLimiterService.tryRecord(anyString(), anyInt(), anyLong())).thenReturn(true);
        when(userRepository.findByEmailOrPhone(anyString(), anyString())).thenReturn(Optional.empty());

        MessageResponse response = authService.forgotPassword(new ForgotPasswordRequest("nobody@example.com"));

        assertTrue(response.getMessage().toLowerCase().contains("if an account"));
        verify(emailService, never()).sendOtpEmail(anyString(), anyString(), anyString());
    }

    @Test
    void forgotPassword_knownIdentifier_sendsOtpButSameMessage() {
        User user = sampleUser();
        when(rateLimiterService.tryRecord(anyString(), anyInt(), anyLong())).thenReturn(true);
        when(userRepository.findByEmailOrPhone(anyString(), anyString())).thenReturn(Optional.of(user));

        MessageResponse response = authService.forgotPassword(new ForgotPasswordRequest("john@example.com"));

        assertTrue(response.getMessage().toLowerCase().contains("if an account"));
        verify(emailService).sendOtpEmail(eq("john@example.com"), anyString(), anyString());
        assertEquals(OtpPurpose.RESET_PASSWORD, user.getOtpPurpose());
    }

    @Test
    void resetPassword_correctOtp_updatesPasswordAndRevokesSessions() {
        User user = sampleUser();
        user.setOtpCode("654321");
        user.setOtpPurpose(OtpPurpose.RESET_PASSWORD);
        user.setOtpExpiryTime(LocalDateTime.now().plusMinutes(5));

        when(userRepository.findByEmailOrPhone(anyString(), anyString())).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("NewStr0ng!Pass")).thenReturn("new-hashed");

        MessageResponse response = authService.resetPassword(
                new ResetPasswordRequest("john@example.com", "654321", "NewStr0ng!Pass", "NewStr0ng!Pass"));

        assertTrue(response.isSuccess());
        assertEquals("new-hashed", user.getPassword());
        assertNull(user.getOtpCode());
        verify(refreshTokenService).revokeAllForUser(user);
    }

    @Test
    void resetPassword_wrongOtp_throwsBadRequest() {
        User user = sampleUser();
        user.setOtpCode("654321");
        user.setOtpPurpose(OtpPurpose.RESET_PASSWORD);
        user.setOtpExpiryTime(LocalDateTime.now().plusMinutes(5));

        when(userRepository.findByEmailOrPhone(anyString(), anyString())).thenReturn(Optional.of(user));

        assertThrows(BadRequestException.class, () -> authService.resetPassword(
                new ResetPasswordRequest("john@example.com", "000000", "NewStr0ng!Pass", "NewStr0ng!Pass")));
    }
}
