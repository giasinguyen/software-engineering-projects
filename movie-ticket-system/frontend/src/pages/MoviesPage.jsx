import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { movieService, imdbService } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function MoviesPage() {
  const [movies, setMovies] = useState([]);
  const [imdbData, setImdbData] = useState({});
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    movieService.getAll().then(async (res) => {
      const moviesData = res.data;
      setMovies(moviesData);

      const imdbResults = {};
      await Promise.allSettled(
        moviesData
          .filter((m) => m.imdbId)
          .map(async (m) => {
            try {
              const { data } = await imdbService.getTitle(m.imdbId);
              imdbResults[m.imdbId] = data;
            } catch {
              // silently ignore IMDB fetch errors
            }
          })
      );
      setImdbData(imdbResults);
    });
  }, []);

  const handleBook = (movie) => {
    if (!user) return navigate("/login");
    navigate("/book", { state: { movie } });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Now Showing</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {movies.map((movie) => {
          const imdb = movie.imdbId ? imdbData[movie.imdbId] : null;
          const posterUrl =
            imdb?.primaryImage?.url || movie.posterUrl || null;
          const rating = imdb?.rating?.aggregateRating;
          const plot = imdb?.plot || movie.description;

          return (
            <div
              key={movie.id}
              className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 flex flex-col"
            >
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={movie.title}
                  className="w-full h-64 object-cover"
                />
              ) : (
                <div className="w-full h-64 bg-gray-700 flex items-center justify-center text-gray-500 text-sm">
                  No Poster
                </div>
              )}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-xl font-bold text-yellow-400 leading-tight">
                    {movie.title}
                  </h2>
                  {rating && (
                    <span className="flex items-center gap-1 text-yellow-300 font-semibold text-sm shrink-0">
                      ⭐ {rating.toFixed(1)}
                    </span>
                  )}
                </div>
                <p className="text-gray-400 mt-2 text-sm line-clamp-3">{plot}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                  <span className="bg-gray-700 px-2 py-1 rounded">{movie.genre}</span>
                  <span className="bg-gray-700 px-2 py-1 rounded">{movie.duration} min</span>
                  <span className="bg-gray-700 px-2 py-1 rounded">{movie.totalSeats} seats</span>
                  {movie.imdbId && (
                    <a
                      href={`https://www.imdb.com/title/${movie.imdbId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-yellow-600 text-black px-2 py-1 rounded font-bold hover:bg-yellow-500"
                    >
                      IMDb
                    </a>
                  )}
                </div>
                <button
                  onClick={() => handleBook(movie)}
                  className="mt-4 w-full py-2 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400"
                >
                  Book Ticket
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
