import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { movieService, imdbService } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function MoviesPage() {
  const [movies, setMovies] = useState([]);
  const [imdbData, setImdbData] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    movieService.getAll().then(async (res) => {
      const data = Array.isArray(res.data) ? res.data : [];
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
    }).catch(err => {
      console.error("Failed to fetch movies:", err);
      setMovies([]);
      setLoading(false);
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
    <div className="pt-24 pb-16 px-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <p className="text-[11px] font-bold text-[#555] uppercase tracking-[0.2em] mb-2">Now Showing</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight">
            Movie Catalog
          </h1>
          <p className="text-sm text-[#888] mt-2">
            {loading ? "Loading..." : `${movies.length} film${movies.length !== 1 ? "s" : ""} available`}
          </p>
        </div>
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555]"
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search title or genre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 text-sm border border-[#222] rounded-lg bg-[#0a0a0a] text-white placeholder-[#555] focus:outline-none focus:border-[#444] w-64 transition-colors"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden animate-pulse">
              <div className="h-72 bg-[#111]" />
              <div className="p-6 space-y-3">
                <div className="h-4 bg-[#111] rounded w-3/4" />
                <div className="h-3 bg-[#111] rounded" />
                <div className="h-3 bg-[#111] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-[#555] text-sm">No films match your search</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((movie) => {
            const imdb = movie.imdbId ? imdbData[movie.imdbId] : null;
            const posterUrl = imdb?.primaryImage?.url || movie.posterUrl || null;
            const rating = imdb?.rating?.aggregateRating;
            const plot = imdb?.plot || movie.description;

            return (
              <div
                key={movie.id}
                className="group rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden hover:border-[#333] transition-all duration-300 flex flex-col"
              >
                {/* Poster */}
                <div className="relative h-72 bg-[#111] overflow-hidden">
                  {posterUrl ? (
                    <img
                      src={posterUrl}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#333] gap-2">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="M2 9h20M7 4v5M17 4v5M7 15v5M17 15v5" />
                      </svg>
                      <span className="text-xs">No poster</span>
                    </div>
                  )}
                  {rating && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-lg">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="#f59e0b">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      {rating.toFixed(1)}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h2 className="text-base font-semibold text-white leading-snug font-display">{movie.title}</h2>
                    {movie.imdbId && (
                      <a
                        href={`https://www.imdb.com/title/${movie.imdbId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-[10px] font-bold bg-[#f59e0b] text-black px-2 py-0.5 rounded hover:bg-[#fbbf24] transition-colors cursor-pointer"
                      >
                        IMDb
                      </a>
                    )}
                  </div>

                  {plot && (
                    <p className="text-xs text-[#888] line-clamp-2 leading-relaxed mb-4">{plot}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5 mb-5 mt-auto">
                    {movie.genre && (
                      <span className="text-[11px] text-[#888] bg-[#1a1a1a] border border-[#222] px-2.5 py-1 rounded">{movie.genre}</span>
                    )}
                    <span className="text-[11px] text-[#888] bg-[#1a1a1a] border border-[#222] px-2.5 py-1 rounded">{movie.duration} min</span>
                    <span className="text-[11px] text-[#888] bg-[#1a1a1a] border border-[#222] px-2.5 py-1 rounded">{movie.totalSeats} seats</span>
                  </div>

                  <button
                    onClick={() => handleBook(movie)}
                    className="w-full py-3 bg-white text-black text-sm font-semibold rounded-lg hover:bg-[#e0e0e0] transition-colors cursor-pointer"
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
