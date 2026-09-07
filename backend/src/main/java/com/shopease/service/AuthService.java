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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final RefreshTokenService refreshTokenService;
    private final EmailService emailService;
    private final RateLimiterService rateLimiterService;

    private static final SecureRandom RANDOM = new SecureRandom();

    @Value("${app.otp.expiry-minutes:10}")
    private long otpExpiryMinutes;

    @Value("${app.otp.max-verify-attempts:5}")
    private int maxOtpVerifyAttempts;

    @Value("${app.otp.resend-cooldown-seconds:60}")
    private long otpResendCooldownSeconds;

    @Value("${app.otp.max-resends-per-window:5}")
    private int maxOtpResendsPerWindow;

    @Value("${app.otp.resend-window-minutes:60}")
    private long otpResendWindowMinutes;

    @Value("${app.otp.dev-mode:false}")
    private boolean otpDevMode;

    @Value("${app.security.max-failed-logins:5}")
    private int maxFailedLogins;

    @Value("${app.security.lockout-minutes:15}")
    private long lockoutMinutes;

    // =====================================================================
    // REGISTER
    // =====================================================================

    @Transactional
    public OtpResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        String phone = request.getPhone().trim();

        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Email is already registered");
        }
        if (userRepository.existsByPhone(phone)) {
            throw new ConflictException("Mobile number is already registered");
        }

        // Note: role is always USER on self-service registration. Admin accounts
        // must be provisioned separately - never inferred from user-supplied input.
        User user = User.builder()
                .name(request.getFullName().trim())
                .email(email)
                .phone(phone)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.ROLE_USER)
                .enabled(true)
                .verified(false)
                .build();

        issueOtp(user, OtpPurpose.VERIFY_ACCOUNT);
        userRepository.save(user);
        emailService.sendOtpEmail(email, user.getOtpCode(), "Verify your ShopEase account");

        return OtpResponse.builder()
                .message("Registration successful. A verification code has been sent to " + maskEmail(email) + ".")
                .identifier(email)
                .expiresInSeconds((int) (otpExpiryMinutes * 60))
                .devOtp(otpDevMode ? user.getOtpCode() : null)
                .build();
    }

    // =====================================================================
    // ACCOUNT VERIFICATION
    // =====================================================================

    @Transactional
    public MessageResponse verifyAccount(VerifyAccountRequest request) {
        User user = resolveUserOrThrow(request.getIdentifier(), "Invalid verification request");

        if (user.isVerified()) {
            return MessageResponse.builder().message("Account is already verified. You can log in.").build();
        }

        if (user.getOtpPurpose() != OtpPurpose.VERIFY_ACCOUNT || user.getOtpCode() == null) {
            throw new BadRequestException("No pending verification for this account. Please request a new code.");
        }

        if (user.getOtpAttempts() >= maxOtpVerifyAttempts) {
            throw new TooManyRequestsException("Too many incorrect attempts. Please request a new verification code.");
        }

        boolean expired = user.getOtpExpiryTime() == null || user.getOtpExpiryTime().isBefore(LocalDateTime.now());
        boolean matches = request.getOtpCode().trim().equals(user.getOtpCode());

        if (!matches || expired) {
            user.setOtpAttempts(user.getOtpAttempts() + 1);
            userRepository.save(user);
            throw new BadRequestException(expired ? "Verification code has expired. Please request a new one." : "Invalid verification code.");
        }

        user.setVerified(true);
        clearOtp(user);
        userRepository.save(user);

        return MessageResponse.builder().message("Account verified successfully. You can now log in.").build();
    }

    @Transactional
    public OtpResponse resendOtp(ResendOtpRequest request) {
        User user = resolveUserOrThrow(request.getIdentifier(), "No account found for this email or phone number");

        rateLimiterService.checkAndRecord(
                "resend-otp:" + user.getId(), maxOtpResendsPerWindow, otpResendWindowMinutes * 60,
                "Too many OTP requests. Please try again later.");

        if (user.isVerified()) {
            throw new BadRequestException("Account is already verified. Please log in.");
        }

        if (user.getOtpLastSentAt() != null &&
                user.getOtpLastSentAt().plusSeconds(otpResendCooldownSeconds).isAfter(LocalDateTime.now())) {
            long waitSeconds = ChronoUnit.SECONDS.between(LocalDateTime.now(), user.getOtpLastSentAt().plusSeconds(otpResendCooldownSeconds));
            throw new TooManyRequestsException("Please wait " + Math.max(waitSeconds, 1) + " seconds before requesting another code.");
        }

        issueOtp(user, OtpPurpose.VERIFY_ACCOUNT);
        userRepository.save(user);
        emailService.sendOtpEmail(user.getEmail(), user.getOtpCode(), "Your new ShopEase verification code");

        return OtpResponse.builder()
                .message("A new verification code has been sent to " + maskEmail(user.getEmail()) + ".")
                .identifier(user.getEmail())
                .expiresInSeconds((int) (otpExpiryMinutes * 60))
                .devOtp(otpDevMode ? user.getOtpCode() : null)
                .build();
    }

    // =====================================================================
    // LOGIN
    // =====================================================================

    @Transactional
    public JwtResponse login(LoginRequest request) {
        String identifier = request.getIdentifier().trim();
        String rateLimitKey = "login:" + identifier.toLowerCase();

        rateLimiterService.checkAndRecord(rateLimitKey, 10, 15 * 60,
                "Too many login attempts. Please try again in a few minutes.");

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(identifier, request.getPassword()));
        } catch (BadCredentialsException ex) {
            recordFailedLogin(identifier);
            throw ex;
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (!user.isVerified()) {
            throw new ForbiddenException("Please verify your account before logging in. Check your email for the verification code.");
        }

        // Successful login: clear any lockout/failed-attempt bookkeeping.
        user.setFailedLoginAttempts(0);
        user.setLockoutUntil(null);
        userRepository.save(user);
        rateLimiterService.reset(rateLimitKey);

        String accessToken = tokenProvider.generateAccessToken(authentication);
        String refreshToken = refreshTokenService.issue(authentication, user);

        return buildJwtResponse("Login successful", accessToken, refreshToken, user);
    }

    private void recordFailedLogin(String identifier) {
        resolveUser(identifier).ifPresent(user -> {
            user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
            if (user.getFailedLoginAttempts() >= maxFailedLogins) {
                user.setLockoutUntil(LocalDateTime.now().plusMinutes(lockoutMinutes));
            }
            userRepository.save(user);
        });
    }

    // =====================================================================
    // TOKEN REFRESH / LOGOUT
    // =====================================================================

    @Transactional
    public JwtResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken record = refreshTokenService.validate(request.getRefreshToken());
        User user = record.getUser();

        UserPrincipal principal = UserPrincipal.create(user);
        Authentication authentication = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

        String newAccessToken = tokenProvider.generateAccessToken(authentication);
        String newRefreshToken = refreshTokenService.rotate(record, authentication);

        return buildJwtResponse("Token refreshed successfully", newAccessToken, newRefreshToken, user);
    }

    @Transactional
    public MessageResponse logout(LogoutRequest request) {
        refreshTokenService.revoke(request.getRefreshToken());
        return MessageResponse.builder().message("Logged out successfully").build();
    }

    // =====================================================================
    // FORGOT / RESET PASSWORD
    // =====================================================================

    @Transactional
    public MessageResponse forgotPassword(ForgotPasswordRequest request) {
        String generic = "If an account exists for that email or mobile number, a password reset code has been sent.";
        String identifier = request.getIdentifier().trim();

        // Record the attempt regardless of outcome so this endpoint cannot be used
        // to enumerate accounts by observing different rate-limit behaviour.
        boolean allowed = rateLimiterService.tryRecord("forgot-password:" + identifier.toLowerCase(), 5, 15 * 60);
        if (!allowed) {
            return MessageResponse.builder().message(generic).build();
        }

        resolveUser(identifier).ifPresent(user -> {
            issueOtp(user, OtpPurpose.RESET_PASSWORD);
            userRepository.save(user);
            emailService.sendOtpEmail(user.getEmail(), user.getOtpCode(), "Reset your ShopEase password");
        });

        return MessageResponse.builder().message(generic).build();
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        User user = resolveUser(request.getIdentifier())
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset code"));

        if (user.getOtpPurpose() != OtpPurpose.RESET_PASSWORD || user.getOtpCode() == null) {
            throw new BadRequestException("Invalid or expired reset code");
        }

        if (user.getOtpAttempts() >= maxOtpVerifyAttempts) {
            throw new TooManyRequestsException("Too many incorrect attempts. Please request a new reset code.");
        }

        boolean expired = user.getOtpExpiryTime() == null || user.getOtpExpiryTime().isBefore(LocalDateTime.now());
        boolean matches = request.getOtpCode().trim().equals(user.getOtpCode());

        if (!matches || expired) {
            user.setOtpAttempts(user.getOtpAttempts() + 1);
            userRepository.save(user);
            throw new BadRequestException("Invalid or expired reset code");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        clearOtp(user);
        user.setFailedLoginAttempts(0);
        user.setLockoutUntil(null);
        userRepository.save(user);

        // Invalidate every existing session - a leaked/guessed password reset flow
        // should not leave old refresh tokens usable.
        refreshTokenService.revokeAllForUser(user);

        return MessageResponse.builder().message("Password has been reset successfully. Please log in with your new password.").build();
    }

    // =====================================================================
    // Helpers
    // =====================================================================

    private void issueOtp(User user, OtpPurpose purpose) {
        String otpCode = String.format("%06d", RANDOM.nextInt(1_000_000));
        user.setOtpCode(otpCode);
        user.setOtpExpiryTime(LocalDateTime.now().plusMinutes(otpExpiryMinutes));
        user.setOtpPurpose(purpose);
        user.setOtpAttempts(0);
        user.setOtpLastSentAt(LocalDateTime.now());
    }

    private void clearOtp(User user) {
        user.setOtpCode(null);
        user.setOtpExpiryTime(null);
        user.setOtpPurpose(null);
        user.setOtpAttempts(0);
    }

    private Optional<User> resolveUser(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            return Optional.empty();
        }
        String trimmed = identifier.trim();
        return userRepository.findByEmailOrPhone(trimmed.toLowerCase(), trimmed);
    }

    private User resolveUserOrThrow(String identifier, String errorMessage) {
        return resolveUser(identifier).orElseThrow(() -> new BadRequestException(errorMessage));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private String maskEmail(String email) {
        int at = email.indexOf('@');
        if (at <= 1) return email;
        return email.charAt(0) + "***" + email.substring(at - 1);
    }

    private JwtResponse buildJwtResponse(String message, String accessToken, String refreshToken, User user) {
        return JwtResponse.builder()
                .message(message)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(tokenProvider.getAccessTokenExpirationMs() / 1000)
                .user(UserSummary.builder()
                        .id(user.getId())
                        .fullName(user.getName())
                        .email(user.getEmail())
                        .phone(user.getPhone())
                        .role(user.getRole().name())
                        .verified(user.isVerified())
                        .build())
                .build();
    }
}
