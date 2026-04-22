import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { movieService, imdbService } from "../services/api";
import { useAuth } from "../context/AuthContext";

function StarRating({ value }) {
  return (
    <div className="flex items-center gap-1">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="#f59e0b" className="shrink-0">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      <span className="text-xs font-semibold text-neutral-700">{value.toFixed(1)}</span>
    </div>
  );
}

export default function MoviesPage() {
  const [movies, setMovies] = useState([]);
  const [imdbData, setImdbData] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    movieService.getAll().then(async (res) => {
      const data = res.data;
      setMovies(data);
      setLoading(false);
      const results = {};
      await Promise.allSettled(
        data
          .filter((m) => m.imdbId)
          .map(async (m) => {
            try {
              const { data: d } = await imdbService.getTitle(m.imdbId);
              results[m.imdbId] = d;
            } catch {}
          })
      );
      setImdbData(results);
    });
  }, []);

  const handleBook = (movie) => {
    if (!user) return navigate("/login");
    navigate("/book", { state: { movie } });
  };

  const filtered = movies.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      (m.genre || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-7">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Now Showing</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {loading ? "Loading..." : `${movies.length} film${movies.length !== 1 ? "s" : ""} available`}
          </p>
        </div>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search title or genre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 text-sm border border-neutral-200 rounded-lg bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-400 w-60"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-neutral-200 overflow-hidden animate-pulse">
              <div className="h-64 bg-neutral-100" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-neutral-100 rounded w-3/4" />
                <div className="h-3 bg-neutral-100 rounded" />
                <div className="h-3 bg-neutral-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-neutral-400 text-sm">No films match your search</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((movie) => {
            const imdb = movie.imdbId ? imdbData[movie.imdbId] : null;
            const posterUrl = imdb?.primaryImage?.url || movie.posterUrl || null;
            const rating = imdb?.rating?.aggregateRating;
            const plot = imdb?.plot || movie.description;

            return (
              <div
                key={movie.id}
                className="bg-white rounded-xl border border-neutral-200 overflow-hidden flex flex-col group hover:shadow-sm transition-shadow"
              >
                {/* Poster */}
                <div className="relative h-64 bg-neutral-100 overflow-hidden">
                  {posterUrl ? (
                    <img
                      src={posterUrl}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-300 gap-2">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="M2 9h20M7 4v5M17 4v5M7 15v5M17 15v5" />
                      </svg>
                      <span className="text-xs">No poster</span>
                    </div>
                  )}
                  {rating && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/65 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-md">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="#f59e0b">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      {rating.toFixed(1)}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h2 className="text-[15px] font-semibold text-neutral-900 leading-snug">{movie.title}</h2>
                    {movie.imdbId && (
                      <a
                        href={`https://www.imdb.com/title/${movie.imdbId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-[10px] font-bold bg-amber-400 text-black px-1.5 py-0.5 rounded hover:bg-amber-300 transition-colors"
                      >
                        IMDb
                      </a>
                    )}
                  </div>

                  {plot && (
                    <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed mb-3">{plot}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5 mb-4 mt-auto">
                    {movie.genre && (
                      <span className="text-xs text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                        {movie.genre}
                      </span>
                    )}
                    <span className="text-xs text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                      {movie.duration} min
                    </span>
                    <span className="text-xs text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                      {movie.totalSeats} seats
                    </span>
                  </div>

                  <button
                    onClick={() => handleBook(movie)}
                    className="w-full py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    Book Ticket
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
