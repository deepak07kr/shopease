package com.shopease.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

public class PaymentDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRazorpayOrderRequest {
        @NotNull(message = "Order ID is required")
        private Long orderId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RazorpayOrderResponse {
        private String razorpayOrderId;
        private BigDecimal amount;
        private String currency;
        private String keyId;
        private Long orderId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaymentVerificationRequest {
        @NotNull(message = "Order ID is required")
        private Long orderId;

        @NotBlank(message = "Razorpay Order ID is required")
        private String razorpayOrderId;

        @NotBlank(message = "Razorpay Payment ID is required")
        private String razorpayPaymentId;

        @NotBlank(message = "Razorpay Signature is required")
        private String razorpaySignature;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaymentVerificationResponse {
        private boolean success;
        private String message;
        private Long orderId;
        private String status;
    }
}
