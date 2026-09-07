package com.shopease.controller;

import com.shopease.dto.PaymentDTOs.*;
import com.shopease.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
@Tag(name = "Payment", description = "Endpoints for Razorpay Payment Gateway integration")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-order")
    @Operation(summary = "Create Razorpay payment order", description = "Creates a Razorpay order with amount in paise")
    public ResponseEntity<RazorpayOrderResponse> createOrder(@Valid @RequestBody CreateRazorpayOrderRequest request) {
        RazorpayOrderResponse response = paymentService.createRazorpayOrder(request.getOrderId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify")
    @Operation(summary = "Verify Razorpay payment signature", description = "Validates the Razorpay HMAC-SHA256 signature and updates order status to PAID")
    public ResponseEntity<PaymentVerificationResponse> verifyPayment(@Valid @RequestBody PaymentVerificationRequest request) {
        PaymentVerificationResponse response = paymentService.verifyPayment(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/webhook")
    @Operation(summary = "Handle Razorpay Webhook notifications")
    public ResponseEntity<Map<String, String>> handleWebhook(@RequestBody String payload, @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        // Webhook log/handling stub
        return ResponseEntity.ok(Map.of("status", "received"));
    }
}
