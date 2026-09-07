package com.shopease.service;

import com.razorpay.RazorpayClient;
import com.shopease.dto.PaymentDTOs.*;
import com.shopease.entity.Order;
import com.shopease.entity.OrderStatus;
import com.shopease.exception.BadRequestException;
import com.shopease.exception.PaymentException;
import com.shopease.exception.ResourceNotFoundException;
import com.shopease.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.SignatureException;
import java.util.Formatter;

@Service
@RequiredArgsConstructor
public class PaymentService {

    @Value("${razorpay.key-id}")
    private String keyId;

    @Value("${razorpay.key-secret}")
    private String keySecret;

    private final OrderRepository orderRepository;

    @Transactional
    public RazorpayOrderResponse createRazorpayOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (order.getStatus() == OrderStatus.PAID) {
            throw new BadRequestException("Order is already paid");
        }

        // Amount in paise (1 INR = 100 paise)
        long amountInPaise = order.getTotalAmount().multiply(new BigDecimal("100")).longValue();

        try {
            String razorpayOrderId;

            // Check if keyId is real or dummy/test
            if (keyId != null && !keyId.startsWith("rzp_test_sample")) {
                RazorpayClient razorpay = new RazorpayClient(keyId, keySecret);
                JSONObject orderRequest = new JSONObject();
                orderRequest.put("amount", amountInPaise);
                orderRequest.put("currency", "INR");
                orderRequest.put("receipt", "receipt_order_" + orderId);

                com.razorpay.Order rzpOrder = razorpay.orders.create(orderRequest);
                razorpayOrderId = rzpOrder.get("id");
            } else {
                // Fallback mock order id for development / testing without live keys
                razorpayOrderId = "order_mock_" + System.currentTimeMillis() + "_" + orderId;
            }

            order.setRazorpayOrderId(razorpayOrderId);
            orderRepository.save(order);

            return RazorpayOrderResponse.builder()
                    .razorpayOrderId(razorpayOrderId)
                    .amount(order.getTotalAmount())
                    .currency("INR")
                    .keyId(keyId)
                    .orderId(orderId)
                    .build();

        } catch (Exception e) {
            throw new PaymentException("Error creating Razorpay order: " + e.getMessage());
        }
    }

    @Transactional
    public PaymentVerificationResponse verifyPayment(PaymentVerificationRequest request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", request.getOrderId()));

        try {
            boolean isValidSignature = false;

            if (keyId != null && !keyId.startsWith("rzp_test_sample")) {
                String payload = request.getRazorpayOrderId() + "|" + request.getRazorpayPaymentId();
                String calculatedSignature = calculateHmacSha256(payload, keySecret);
                isValidSignature = calculatedSignature.equals(request.getRazorpaySignature());
            } else {
                // In test/mock mode, automatically accept signatures
                isValidSignature = true;
            }

            if (isValidSignature) {
                order.setStatus(OrderStatus.PAID);
                order.setRazorpayOrderId(request.getRazorpayOrderId());
                order.setRazorpayPaymentId(request.getRazorpayPaymentId());
                order.setRazorpaySignature(request.getRazorpaySignature());
                orderRepository.save(order);

                return PaymentVerificationResponse.builder()
                        .success(true)
                        .message("Payment verified successfully!")
                        .orderId(order.getId())
                        .status(OrderStatus.PAID.name())
                        .build();
            } else {
                throw new PaymentException("Invalid Razorpay payment signature");
            }

        } catch (Exception e) {
            throw new PaymentException("Payment verification failed: " + e.getMessage());
        }
    }

    private String calculateHmacSha256(String data, String secret) throws SignatureException {
        try {
            SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hmacBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));

            Formatter formatter = new Formatter();
            for (byte b : hmacBytes) {
                formatter.format("%02x", b);
            }
            return formatter.toString();
        } catch (Exception e) {
            throw new SignatureException("Failed to calculate HMAC-SHA256 signature", e);
        }
    }
}
