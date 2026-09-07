package com.shopease.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;

public class CartDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CartItemRequest {
        @NotNull(message = "Product ID is required")
        private Long productId;

        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be at least 1")
        private Integer quantity;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CartItemDto {
        private Long id;
        private Long productId;
        private String productName;
        private BigDecimal productPrice;
        private String productImage;
        private Integer quantity;
        private BigDecimal itemTotal;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CartResponse {
        private List<CartItemDto> items;
        private BigDecimal cartTotal;
        private Integer totalQuantity;
    }

    /**
     * Payload sent once, right after a guest logs in or registers, containing
     * whatever they had accumulated in their browser-local guest cart.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MergeCartRequest {
        @NotEmpty(message = "items must not be empty")
        private List<@Valid CartItemRequest> items;
    }
}
