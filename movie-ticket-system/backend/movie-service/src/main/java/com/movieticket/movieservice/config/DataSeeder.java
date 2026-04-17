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
                    .description("The Avengers assemble once more to reverse Thanos' actions.")
                    .genre("Action")
                    .duration(181)
                    .totalSeats(100)
                    .build());

            movieRepository.save(Movie.builder()
                    .title("Inception")
                    .description("A thief who steals corporate secrets through dream-sharing technology.")
                    .genre("Sci-Fi")
                    .duration(148)
                    .totalSeats(80)
                    .build());

            movieRepository.save(Movie.builder()
                    .title("The Dark Knight")
                    .description("Batman raises the stakes in his war on crime.")
                    .genre("Action")
                    .duration(152)
                    .totalSeats(90)
                    .build());

            movieRepository.save(Movie.builder()
                    .title("Interstellar")
                    .description("A team of explorers travel through a wormhole in space.")
                    .genre("Sci-Fi")
                    .duration(169)
                    .totalSeats(85)
                    .build());
        }
    }
}
