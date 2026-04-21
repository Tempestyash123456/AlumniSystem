package com.university.alumni.auth.service;

import com.university.alumni.auth.dto.ResendEmailRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

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

    @Value("${app.mail.resend.from:admin@tempestonline.in}")
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
        if (resendApiKey == null || resendApiKey.isBlank()) {
            log.error("RESEND_API_KEY is missing or empty. Cannot send email via Resend API.");
            return;
        }

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
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + resendApiKey.trim())
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .bodyValue(emailRequest)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, response -> 
                        response.bodyToMono(String.class).flatMap(errorBody -> {
                            log.error("Resend API returned error: {} - {}", response.statusCode(), errorBody);
                            return Mono.error(new RuntimeException("Resend API Failure: " + errorBody));
                        })
                    )
                    .toBodilessEntity()
                    .doOnSuccess(res -> log.info("Email sent successfully via Resend API to {}", to))
                    .doOnError(err -> log.error("Failed to send email via Resend API to {}: {}", to, err.getMessage()))
                    .subscribe();

        } catch (Exception e) {
            log.error("Error initiating email send via Resend API to {}: {}", to, e.getMessage());
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