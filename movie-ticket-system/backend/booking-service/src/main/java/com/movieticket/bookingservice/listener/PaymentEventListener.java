package com.movieticket.bookingservice.listener;

import com.movieticket.bookingservice.entity.Booking.BookingStatus;
import com.movieticket.bookingservice.service.BookingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentEventListener {

    private final BookingService bookingService;

    @RabbitListener(queues = "${app.rabbitmq.queue.booking-update}")
    public void handlePaymentEvent(Map<String, Object> event) {
        String eventType = (String) event.get("event");
        Long bookingId = ((Number) event.get("bookingId")).longValue();

        log.info("Received event: {} for booking #{}", eventType, bookingId);

        switch (eventType) {
            case "PAYMENT_COMPLETED" -> bookingService.updateBookingStatus(bookingId, BookingStatus.CONFIRMED);
            case "BOOKING_FAILED" -> bookingService.updateBookingStatus(bookingId, BookingStatus.FAILED);
            default -> log.warn("Unknown event type: {}", eventType);
        }
    }
}
