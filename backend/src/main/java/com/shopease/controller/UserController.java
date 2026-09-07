package com.shopease.controller;

import com.shopease.dto.AuthDTOs.MessageResponse;
import com.shopease.dto.AuthDTOs.UserSummary;
import com.shopease.dto.UserDTOs.ChangePasswordRequest;
import com.shopease.dto.UserDTOs.UpdateProfileRequest;
import com.shopease.security.UserPrincipal;
import com.shopease.service.UserProfileService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User Profile", description = "The authenticated user's own account information")
public class UserController {

    private final UserProfileService userProfileService;

    @GetMapping("/me")
    public ResponseEntity<UserSummary> getMyProfile(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(userProfileService.getProfile(principal.getId()));
    }

    @PutMapping("/me")
    public ResponseEntity<UserSummary> updateMyProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userProfileService.updateProfile(principal.getId(), request));
    }

    @PostMapping("/me/change-password")
    public ResponseEntity<MessageResponse> changePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChangePasswordRequest request) {
        userProfileService.changePassword(principal.getId(), request);
        return ResponseEntity.ok(MessageResponse.builder().message("Password changed successfully. Please log in again on your other devices.").build());
    }
}
