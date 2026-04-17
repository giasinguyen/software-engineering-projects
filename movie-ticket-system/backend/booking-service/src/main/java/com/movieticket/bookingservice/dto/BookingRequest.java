package com.movieticket.bookingservice.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BookingRequest {
    @NotNull
    private Long userId;
    @NotNull
    private Long movieId;
    @NotNull
    private String movieTitle;
    @Min(1)
    private int seatNumber;
}
