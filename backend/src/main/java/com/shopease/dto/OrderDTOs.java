package com.shopease.dto;

import com.shopease.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class OrderDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderRequest {
        private Long addressId;
        private AddressDto shippingAddress;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderItemDto {
        private Long id;
        private Long productId;
        private String productName;
        private String productImage;
        private Integer quantity;
        private BigDecimal price;
        private BigDecimal itemTotal;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderDto {
        private Long id;
        private Long userId;
        private String userName;
        private String userEmail;
        private BigDecimal totalAmount;
        private OrderStatus status;
        private String razorpayOrderId;
        private String razorpayPaymentId;
        private AddressDto shippingAddress;
        private List<OrderItemDto> orderItems;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderStatusUpdateRequest {
        @NotNull(message = "Status is required")
        private OrderStatus status;
    }
}
