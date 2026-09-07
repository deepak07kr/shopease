package com.shopease.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Sends OTP codes via email.
 *
 * If a JavaMailSender bean is configured (i.e. spring.mail.* properties are
 * set, e.g. real SMTP credentials in production), messages are sent for real.
 * Otherwise (local development / no SMTP configured) the OTP is written to
 * the application log so the flow can still be exercised end-to-end without
 * an external provider.
 *
 * To plug in a dedicated transactional email provider (SendGrid, SES, Postmark,
 * etc.) or an SMS gateway for phone-based OTP delivery, implement this same
 * method signature against that provider's SDK - nothing in AuthService needs
 * to change, since it only depends on this interface-shaped service.
 */
@Service
@Slf4j
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    // Many real SMTP providers (Brevo, SendGrid, Mailgun, etc.) reject or
    // silently drop mail with no explicit From header, or require it to match
    // a domain/sender they've verified. Defaults to a placeholder that will
    // work for quick testing with Gmail (which overrides From with the
    // authenticated account anyway) but should be set explicitly in
    // production via MAIL_FROM to an address your provider has verified.
    @Value("${app.mail.from:no-reply@shopease.local}")
    private String fromAddress;

    public void sendOtpEmail(String toEmail, String otpCode, String subject) {
        // Never log OTPs in a way that could end up in shipped/aggregated logs in
        // production - this console fallback exists purely for local development
        // where no real mail provider is configured.
        if (mailSender == null) {
            log.info("=================================================");
            log.info("[DEV MODE] No SMTP provider configured - OTP email for {}", toEmail);
            log.info("[DEV MODE] OTP code: {}", otpCode);
            log.info("=================================================");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(toEmail);
            message.setSubject(subject != null ? subject : "ShopEase - Your Verification Code");
            message.setText("Hello,\n\nYour ShopEase one-time code is: " + otpCode
                    + "\n\nThis code will expire shortly. If you did not request this, you can safely ignore this email.\n\nThank you,\nShopEase Team");
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Failed to send email via SMTP to {}: {}", toEmail, e.getMessage());
        }
    }
}
