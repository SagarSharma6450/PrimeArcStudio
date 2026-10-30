package com.studio.booking.service;

import com.razorpay.*;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class PaymentService {
    private final RazorpayClient client;
    private final String keyId;
    private final String keySecret;

    public PaymentService(@Value("${razorpay.key-id}") String keyId,
                          @Value("${razorpay.key-secret}") String keySecret) throws RazorpayException {
        this.keyId = keyId;
        this.keySecret = keySecret;
        this.client = new RazorpayClient(keyId, keySecret);
    }

    public String getKeyId() { return keyId; }

    /** Creates a Razorpay order. Amount is in paise (rupees x 100). */
    public String createOrder(int amountPaise, String receipt) {
        try {
            JSONObject req = new JSONObject();
            req.put("amount", amountPaise);
            req.put("currency", "INR");
            req.put("receipt", receipt);
            Order order = client.orders.create(req);
            return order.get("id");
        } catch (RazorpayException e) {
            throw new RuntimeException("Could not create payment order: " + e.getMessage(), e);
        }
    }

    /** Checks Razorpay's HMAC signature using our secret. Only a genuine payment passes. */
    public boolean verify(String orderId, String paymentId, String signature) {
        try {
            JSONObject o = new JSONObject();
            o.put("razorpay_order_id", orderId);
            o.put("razorpay_payment_id", paymentId);
            o.put("razorpay_signature", signature);
            return Utils.verifyPaymentSignature(o, keySecret);
        } catch (Exception e) {
            return false;
        }
    }
}
