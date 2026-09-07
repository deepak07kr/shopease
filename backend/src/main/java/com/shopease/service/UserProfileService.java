package com.shopease.service;

import com.shopease.dto.AuthDTOs.UserSummary;
import com.shopease.dto.UserDTOs.ChangePasswordRequest;
import com.shopease.dto.UserDTOs.UpdateProfileRequest;
import com.shopease.entity.User;
import com.shopease.exception.BadRequestException;
import com.shopease.exception.ResourceNotFoundException;
import com.shopease.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;

    @Transactional
    public UserSummary getProfile(Long userId) {
        return toSummary(getUser(userId));
    }

    @Transactional
    public UserSummary updateProfile(Long userId, UpdateProfileRequest request) {
        User user = getUser(userId);
        user.setName(request.getFullName().trim());
        userRepository.save(user);
        return toSummary(user);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = getUser(userId);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Force re-login everywhere else - the current session's access token
        // remains valid until it naturally expires, but no refresh token survives.
        refreshTokenService.revokeAllForUser(user);
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private UserSummary toSummary(User user) {
        return UserSummary.builder()
                .id(user.getId())
                .fullName(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .verified(user.isVerified())
                .build();
    }
}
