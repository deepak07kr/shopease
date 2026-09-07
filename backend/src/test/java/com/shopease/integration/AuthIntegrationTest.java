package com.shopease.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopease.dto.AuthDTOs.*;
import com.shopease.entity.OtpPurpose;
import com.shopease.entity.User;
import com.shopease.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;

    // ---------------- Protected endpoints ----------------

    @Test
    void protectedEndpoint_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/cart"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void userAccessingAdminEndpoint_returns403() throws Exception {
        String userToken = loginAndGetAccessToken("john@example.com", "User@1234");

        mockMvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminAccessingAdminEndpoint_succeeds() throws Exception {
        String adminToken = loginAndGetAccessToken("admin@shopease.com", "Admin@123");

        mockMvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    void expiredOrGarbageToken_returns401() throws Exception {
        mockMvc.perform(get("/api/cart").header("Authorization", "Bearer not-a-real-token"))
                .andExpect(status().isUnauthorized());
    }

    // ---------------- Full register -> verify -> login flow ----------------

    @Test
    void fullFlow_registerVerifyLoginRefreshLogout() throws Exception {
        RegisterRequest register = RegisterRequest.builder()
                .fullName("Integration Tester")
                .email("integration.tester@example.com")
                .phone("+15551230000")
                .password("Str0ng!Passw0rd")
                .confirmPassword("Str0ng!Passw0rd")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));

        // Logging in before verification must be rejected.
        LoginRequest earlyLogin = new LoginRequest("integration.tester@example.com", "Str0ng!Passw0rd", false);
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(earlyLogin)))
                .andExpect(status().isForbidden());

        // Fetch the OTP directly from the DB (dev-mode also echoes it in the response).
        User user = userRepository.findByEmail("integration.tester@example.com").orElseThrow();
        String otp = user.getOtpCode();

        mockMvc.perform(post("/api/auth/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new VerifyAccountRequest("integration.tester@example.com", otp))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        LoginRequest login = new LoginRequest("integration.tester@example.com", "Str0ng!Passw0rd", false);
        String loginBody = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.refreshToken").exists())
                .andReturn().getResponse().getContentAsString();

        JwtResponse loginResponse = objectMapper.readValue(loginBody, JwtResponse.class);

        // Access token works against a protected endpoint.
        mockMvc.perform(get("/api/cart").header("Authorization", "Bearer " + loginResponse.getAccessToken()))
                .andExpect(status().isOk());

        // Refresh rotates the token.
        String refreshBody = mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RefreshTokenRequest(loginResponse.getRefreshToken()))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JwtResponse refreshResponse = objectMapper.readValue(refreshBody, JwtResponse.class);
        org.junit.jupiter.api.Assertions.assertNotEquals(loginResponse.getRefreshToken(), refreshResponse.getRefreshToken());

        // The old (rotated-away) refresh token can no longer be used.
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RefreshTokenRequest(loginResponse.getRefreshToken()))))
                .andExpect(status().isBadRequest());

        // Logout revokes the current refresh token.
        mockMvc.perform(post("/api/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LogoutRequest(refreshResponse.getRefreshToken()))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RefreshTokenRequest(refreshResponse.getRefreshToken()))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void duplicateEmailRegistration_returns409() throws Exception {
        RegisterRequest register = RegisterRequest.builder()
                .fullName("Dup Test").email("john@example.com").phone("+15559990000")
                .password("Str0ng!Passw0rd").confirmPassword("Str0ng!Passw0rd").build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isConflict());
    }

    @Test
    void invalidEmail_returns400() throws Exception {
        RegisterRequest register = RegisterRequest.builder()
                .fullName("Bad Email").email("not-an-email").phone("+15559990001")
                .password("Str0ng!Passw0rd").confirmPassword("Str0ng!Passw0rd").build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void weakPassword_returns400() throws Exception {
        RegisterRequest register = RegisterRequest.builder()
                .fullName("Weak Pass").email("weakpass@example.com").phone("+15559990002")
                .password("weak").confirmPassword("weak").build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void passwordMismatch_returns400() throws Exception {
        RegisterRequest register = RegisterRequest.builder()
                .fullName("Mismatch").email("mismatch@example.com").phone("+15559990003")
                .password("Str0ng!Passw0rd").confirmPassword("Different!123").build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void wrongPassword_returns401() throws Exception {
        LoginRequest login = new LoginRequest("john@example.com", "TotallyWrong!1", false);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void invalidOtp_returns400() throws Exception {
        User user = userRepository.findByEmail("john@example.com").orElseThrow();
        user.setOtpCode("111111");
        user.setOtpPurpose(OtpPurpose.VERIFY_ACCOUNT);
        user.setOtpExpiryTime(LocalDateTime.now().plusMinutes(5));
        user.setVerified(false);
        userRepository.save(user);

        mockMvc.perform(post("/api/auth/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new VerifyAccountRequest("john@example.com", "999999"))))
                .andExpect(status().isBadRequest());

        // restore state for other tests
        user.setVerified(true);
        userRepository.save(user);
    }

    @Test
    void expiredOtp_returns400() throws Exception {
        User user = userRepository.findByEmail("john@example.com").orElseThrow();
        user.setOtpCode("222222");
        user.setOtpPurpose(OtpPurpose.VERIFY_ACCOUNT);
        user.setOtpExpiryTime(LocalDateTime.now().minusMinutes(1));
        user.setVerified(false);
        userRepository.save(user);

        mockMvc.perform(post("/api/auth/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new VerifyAccountRequest("john@example.com", "222222"))))
                .andExpect(status().isBadRequest());

        user.setVerified(true);
        userRepository.save(user);
    }

    @Test
    void forgotPassword_neverRevealsWhetherAccountExists() throws Exception {
        String knownBody = mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ForgotPasswordRequest("john@example.com"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String unknownBody = mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ForgotPasswordRequest("nobody-at-all@example.com"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        MessageResponse known = objectMapper.readValue(knownBody, MessageResponse.class);
        MessageResponse unknown = objectMapper.readValue(unknownBody, MessageResponse.class);
        org.junit.jupiter.api.Assertions.assertEquals(known.getMessage(), unknown.getMessage());
    }

    // ---------------- helper ----------------

    private String loginAndGetAccessToken(String identifier, String password) throws Exception {
        LoginRequest login = new LoginRequest(identifier, password, false);
        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readValue(body, JwtResponse.class).getAccessToken();
    }
}
