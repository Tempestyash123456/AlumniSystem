package com.university.alumni.auth.service;

import com.university.alumni.auth.dto.ResendEmailRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final WebClient.Builder webClientBuilder;

    @Value("${app.mail.provider:smtp}")
    private String mailProvider;

    @Value("${app.mail.resend.api-key:}")
    private String resendApiKey;

    @Value("${app.mail.resend.from:onboarding@resend.dev}")
    private String resendFrom;

    @Value("${spring.mail.username:}")
    private String smtpFrom;

    @Async
    public void sendEmail(String to, String subject, String body) {
        if ("resend".equalsIgnoreCase(mailProvider)) {
            sendViaResend(to, subject, body);
        } else {
            sendViaSmtp(to, subject, body);
        }
    }

    private void sendViaResend(String to, String subject, String body) {
        try {
            ResendEmailRequest emailRequest = ResendEmailRequest.builder()
                    .from(resendFrom)
                    .to(to)
                    .subject(subject)
                    .html(body.replace("\n", "<br>"))
                    .build();

            webClientBuilder.build()
                    .post()
                    .uri("https://api.resend.com/emails")
                    .header("Authorization", "Bearer " + resendApiKey)
                    .bodyValue(emailRequest)
                    .retrieve()
                    .toBodilessEntity()
                    .block();

            log.info("Email sent via Resend API to {}", to);
        } catch (Exception e) {
            log.error("Failed to send email via Resend API to {}: {}", to, e.getMessage());
        }
    }

    private void sendViaSmtp(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(smtpFrom);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Email sent via SMTP to {}", to);
        } catch (Exception e) {
            log.error("Failed to send email via SMTP to {}: {}", to, e.getMessage());
        }
    }
}