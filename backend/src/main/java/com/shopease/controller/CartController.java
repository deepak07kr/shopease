package com.shopease.controller;

import com.shopease.dto.CartDTOs.*;
import com.shopease.security.UserPrincipal;
import com.shopease.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@Tag(name = "Cart", description = "Endpoints for managing the user's shopping cart")
public class CartController {

    private final CartService cartService;

    @GetMapping
    @Operation(summary = "Get current user's shopping cart")
    public ResponseEntity<CartResponse> getCart(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(cartService.getCart(userPrincipal.getId()));
    }

    @PostMapping("/items")
    @Operation(summary = "Add item to shopping cart")
    public ResponseEntity<CartResponse> addToCart(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody CartItemRequest request) {
        return ResponseEntity.ok(cartService.addToCart(userPrincipal.getId(), request));
    }

    @PutMapping("/items/{cartItemId}")
    @Operation(summary = "Update cart item quantity")
    public ResponseEntity<CartResponse> updateQuantity(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long cartItemId,
            @RequestParam Integer quantity) {
        return ResponseEntity.ok(cartService.updateQuantity(userPrincipal.getId(), cartItemId, quantity));
    }

    @DeleteMapping("/items/{cartItemId}")
    @Operation(summary = "Remove item from cart")
    public ResponseEntity<CartResponse> removeFromCart(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long cartItemId) {
        return ResponseEntity.ok(cartService.removeFromCart(userPrincipal.getId(), cartItemId));
    }

    @DeleteMapping("/clear")
    @Operation(summary = "Clear all items from cart")
    public ResponseEntity<Void> clearCart(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        cartService.clearCart(userPrincipal.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/merge")
    @Operation(summary = "Merge a guest cart into the authenticated user's cart",
            description = "Called once right after login/register with whatever the guest had accumulated in browser-local storage.")
    public ResponseEntity<CartResponse> mergeGuestCart(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody MergeCartRequest request) {
        return ResponseEntity.ok(cartService.mergeGuestCart(userPrincipal.getId(), request.getItems()));
    }
}
