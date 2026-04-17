package com.movieticket.movieservice.service;

import com.movieticket.movieservice.entity.Movie;
import com.movieticket.movieservice.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MovieService {

    private final MovieRepository movieRepository;

    public List<Movie> getAllMovies() {
        return movieRepository.findAll();
    }

    public Movie getMovieById(Long id) {
        return movieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Movie not found"));
    }

    public Movie createMovie(Movie movie) {
        return movieRepository.save(movie);
    }

    public Movie updateMovie(Long id, Movie updated) {
        Movie movie = getMovieById(id);
        movie.setTitle(updated.getTitle());
        movie.setDescription(updated.getDescription());
        movie.setGenre(updated.getGenre());
        movie.setDuration(updated.getDuration());
        movie.setPosterUrl(updated.getPosterUrl());
        movie.setImdbId(updated.getImdbId());
        movie.setTotalSeats(updated.getTotalSeats());
        return movieRepository.save(movie);
    }
}
