package com.movieticket.bookingservice.service;

import com.movieticket.bookingservice.dto.BookingRequest;
import com.movieticket.bookingservice.entity.Booking;
import com.movieticket.bookingservice.entity.Booking.BookingStatus;
import com.movieticket.bookingservice.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final BookingRepository bookingRepository;
    private final RabbitTemplate rabbitTemplate;

    @Value("${app.rabbitmq.exchange}")
    private String exchange;

    @Value("${app.rabbitmq.routing-key.booking-created}")
    private String bookingCreatedKey;

    public Booking createBooking(BookingRequest request) {
        Booking booking = Booking.builder()
                .userId(request.getUserId())
                .movieId(request.getMovieId())
                .movieTitle(request.getMovieTitle())
                .seatNumber(request.getSeatNumber())
                .build();

        booking = bookingRepository.save(booking);

        var event = Map.of(
                "event", "BOOKING_CREATED",
                "bookingId", booking.getId(),
                "userId", booking.getUserId(),
                "movieId", booking.getMovieId(),
                "movieTitle", booking.getMovieTitle(),
                "seatNumber", booking.getSeatNumber()
        );
        rabbitTemplate.convertAndSend(exchange, bookingCreatedKey, event);
        log.info("Published BOOKING_CREATED event for booking #{}", booking.getId());

        return booking;
    }

    public List<Booking> getBookingsByUser(Long userId) {
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public void updateBookingStatus(Long bookingId, BookingStatus status) {
        bookingRepository.findById(bookingId).ifPresent(booking -> {
            booking.setStatus(status);
            bookingRepository.save(booking);
            log.info("Booking #{} status updated to {}", bookingId, status);
        });
    }
}
