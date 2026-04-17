import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { bookingService, imdbService } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function BookingPage() {
  const { state } = useLocation();
  const movie = state?.movie;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [seatNumber, setSeatNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [imdb, setImdb] = useState(null);

  useEffect(() => {
    if (movie?.imdbId) {
      imdbService.getTitle(movie.imdbId).then(({ data }) => setImdb(data)).catch(() => {});
    }
  }, [movie]);

  if (!movie || !user) {
    navigate("/");
    return null;
  }

  const posterUrl = imdb?.primaryImage?.url || movie.posterUrl || null;
  const rating = imdb?.rating?.aggregateRating;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await bookingService.create({
        userId: user.id,
        movieId: movie.id,
        movieTitle: movie.title,
        seatNumber,
      });
      setResult(data);
    } catch (err) {
      setResult({ error: err.response?.data?.message || "Booking failed" });
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="max-w-md mx-auto text-center">
        {result.error ? (
          <div className="text-red-400 text-xl">{result.error}</div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-green-400 mb-4">Booking Created!</h2>
            <p>Booking #{result.id}</p>
            <p>Movie: {result.movieTitle}</p>
            <p>Seat: {result.seatNumber}</p>
            <p className="text-yellow-400 mt-2">Status: {result.status} (waiting for payment...)</p>
          </div>
        )}
        <button
          onClick={() => navigate("/bookings")}
          className="mt-6 px-6 py-2 bg-yellow-500 text-black font-bold rounded"
        >
          View My Bookings
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Book Ticket</h1>
      <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 mb-6 flex gap-4">
        {posterUrl && (
          <img
            src={posterUrl}
            alt={movie.title}
            className="w-32 h-48 object-cover shrink-0"
          />
        )}
        <div className="p-4 flex flex-col justify-center">
          <h2 className="text-xl font-bold text-yellow-400">{movie.title}</h2>
          {rating && (
            <p className="text-yellow-300 text-sm mt-1">⭐ {rating.toFixed(1)} / 10</p>
          )}
          <p className="text-gray-400 text-sm mt-1">{movie.genre} • {movie.duration} min</p>
          {imdb?.plot && (
            <p className="text-gray-500 text-xs mt-2 line-clamp-3">{imdb.plot}</p>
          )}
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-400 mb-1">Seat Number</label>
          <input
            type="number"
            min={1}
            max={movie.totalSeats}
            value={seatNumber}
            onChange={(e) => setSeatNumber(Number(e.target.value))}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded"
            required
          />
          <p className="text-sm text-gray-500 mt-1">Available: 1 - {movie.totalSeats}</p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400 disabled:opacity-50"
        >
          {loading ? "Booking..." : "Confirm Booking"}
        </button>
      </form>
    </div>
  );
}
