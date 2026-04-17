import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { bookingService } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function BookingPage() {
  const { state } = useLocation();
  const movie = state?.movie;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [seatNumber, setSeatNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  if (!movie || !user) {
    navigate("/");
    return null;
  }

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
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-2">Book Ticket</h1>
      <p className="text-yellow-400 mb-6">{movie.title}</p>
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
