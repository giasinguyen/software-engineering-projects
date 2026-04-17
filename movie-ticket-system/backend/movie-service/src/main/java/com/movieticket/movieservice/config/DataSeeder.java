package com.movieticket.movieservice.config;

import com.movieticket.movieservice.entity.Movie;
import com.movieticket.movieservice.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final MovieRepository movieRepository;

    @Override
    public void run(String... args) {
        if (movieRepository.count() == 0) {
            movieRepository.save(Movie.builder()
                    .title("Avengers: Endgame")
                    .description("The Avengers assemble once more in order to reverse Thanos' actions and restore balance to the universe.")
                    .genre("Action")
                    .duration(181)
                    .imdbId("tt4154796")
                    .totalSeats(100)
                    .build());

            movieRepository.save(Movie.builder()
                    .title("Inception")
                    .description("A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.")
                    .genre("Sci-Fi")
                    .duration(148)
                    .imdbId("tt1375666")
                    .totalSeats(80)
                    .build());

            movieRepository.save(Movie.builder()
                    .title("The Dark Knight")
                    .description("When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.")
                    .genre("Action")
                    .duration(152)
                    .imdbId("tt0468569")
                    .totalSeats(90)
                    .build());

            movieRepository.save(Movie.builder()
                    .title("Interstellar")
                    .description("A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.")
                    .genre("Sci-Fi")
                    .duration(169)
                    .imdbId("tt0816692")
                    .totalSeats(85)
                    .build());
        }
    }
}
