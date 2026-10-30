package com.studio.booking.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.studio.booking.model.Appointment;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class EmailService {
    private final HttpClient http = HttpClient.newHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();
    @Value("${brevo.api-key:}") private String apiKey;
    @Value("${app.mail-from}") private String from;
    @Value("${app.mail-from-name}") private String fromName;
    @Value("${app.architect-email}") private String architectEmail;

    @Async
    public void sendConfirmation(Appointment a) {
        String when = a.getDate().format(DateTimeFormatter.ofPattern("EEEE, d MMMM yyyy")) + " at "
                + a.getStartTime().format(DateTimeFormatter.ofPattern("h:mm a"));

        send(a.getEmail(), "Your consultation is confirmed",
                "Hi " + a.getCustomerName() + ",\n\nYour booking is confirmed.\n\n"
                + "Service: " + a.getServiceName() + "\nWhen: " + when + " (1 hour)\n"
                + "Amount paid: Rs. " + a.getAmount() + "\nPayment ID: " + a.getRazorpayPaymentId() + "\n\n"
                + "We look forward to meeting you.");

        send(architectEmail, "New booking: " + a.getCustomerName() + " - " + when,
                "A new consultation has been booked and paid.\n\n"
                + "Customer: " + a.getCustomerName() + "\nPhone: " + a.getPhone() + "\nEmail: " + a.getEmail() + "\n"
                + "Service: " + a.getServiceName() + "\nWhen: " + when + "\n"
                + "Amount paid: Rs. " + a.getAmount() + "\nPayment ID: " + a.getRazorpayPaymentId());
    }

    /** Sends through Brevo's HTTPS API (Render's free plan blocks SMTP). Never breaks a booking. */
    private void send(String to, String subject, String text) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("BREVO_API_KEY is not set, email to {} skipped", to);
            return;
        }
        try {
            Map<String, Object> body = Map.of(
                    "sender", Map.of("name", fromName, "email", from),
                    "to", List.of(Map.of("email", to)),
                    "subject", subject,
                    "textContent", text);
            HttpRequest req = HttpRequest.newBuilder(URI.create("https://api.brevo.com/v3/smtp/email"))
                    .header("api-key", apiKey)
                    .header("Content-Type", "application/json")
                    .header("accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)))
                    .build();
            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() >= 300) log.error("Brevo error {}: {}", res.statusCode(), res.body());
        } catch (Exception e) {
            log.error("Email to {} failed: {}", to, e.getMessage());
        }
    }
}
