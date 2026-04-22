import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { bookingService, imdbService } from "../services/api";
import { useAuth } from "../context/AuthContext";

function StepDot({ n, active, done }) {
  if (done) {
    return (
      <div className="w-6 h-6 rounded-full bg-neutral-900 flex items-center justify-center">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
    );
  }
  return (
    <div
      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
        active ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-400"
      }`}
    >
      {n}
    </div>
  );
}

function StepIndicator({ current }) {
  const steps = ["Select Movie", "Choose Seat", "Confirm"];
  return (
    <div className="flex items-center mb-8">
      {steps.map((label, i) => {
        const n = i + 1;
        return (
          <div key={n} className="flex items-center">
            <div className="flex items-center gap-2">
              <StepDot n={n} active={n === current} done={n < current} />
              <span className={`text-sm ${n === current ? "font-semibold text-neutral-900" : "text-neutral-400"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-10 h-px mx-3 transition-colors ${n < current ? "bg-neutral-900" : "bg-neutral-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

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

  // ── Result screen ────────────────────────────────────────────────────────────
  if (result) {
    const isError = !!result.error;
    return (
      <div className="p-8 max-w-lg mx-auto">
        <StepIndicator current={3} />
        <div className={`rounded-xl border p-8 text-center ${isError ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${isError ? "bg-red-100" : "bg-emerald-100"}`}>
            {isError ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
          </div>
          {isError ? (
            <>
              <h2 className="text-base font-semibold text-red-900 mb-1">Booking Failed</h2>
              <p className="text-sm text-red-700">{result.error}</p>
            </>
          ) : (
            <>
              <h2 className="text-base font-semibold text-emerald-900 mb-1">Booking Submitted</h2>
              <p className="text-sm text-emerald-700 mb-5">
                Your booking is queued. Payment will be processed asynchronously via RabbitMQ.
              </p>
              <div className="bg-white/60 rounded-lg p-4 text-left space-y-2.5 mb-5">
                {[
                  ["Booking ID", `#${result.id}`, "font-mono font-bold"],
                  ["Movie", result.movieTitle, ""],
                  ["Seat", result.seatNumber, ""],
                  ["Status", result.status, "text-amber-700 font-semibold"],
                ].map(([label, value, cls]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-neutral-500">{label}</span>
                    <span className={`text-neutral-900 ${cls}`}>{value}</span>
                  </div>
                ))}
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 live-dot inline-block" />
                booking.created → payment.queue → Payment Consumer
              </div>
            </>
          )}
        </div>
        <button
          onClick={() => navigate("/bookings")}
          className="mt-4 w-full py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
        >
          View My Bookings
        </button>
      </div>
    );
  }

  // ── Booking form ─────────────────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-lg mx-auto">
      <StepIndicator current={2} />

      {/* Movie card */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden mb-5 flex">
        {posterUrl && (
          <img src={posterUrl} alt={movie.title} className="w-24 h-36 object-cover shrink-0" />
        )}
        <div className="p-4 flex flex-col justify-center gap-1">
          <h2 className="text-[15px] font-semibold text-neutral-900">{movie.title}</h2>
          {rating && (
            <div className="flex items-center gap-1 text-amber-500 text-xs">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="font-semibold text-neutral-700">{rating.toFixed(1)}</span>
              <span className="text-neutral-400">/ 10</span>
            </div>
          )}
          <p className="text-xs text-neutral-500">
            {movie.genre}{movie.genre && " · "}{movie.duration} min
          </p>
          <p className="text-xs text-neutral-400">{movie.totalSeats} seats available</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h3 className="text-sm font-semibold text-neutral-900 mb-5">Choose Seat</h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-widest mb-3">
              Seat Number
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSeatNumber((n) => Math.max(1, n - 1))}
                className="w-10 h-10 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 flex items-center justify-center transition-colors text-lg font-medium"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={movie.totalSeats}
                value={seatNumber}
                onChange={(e) => setSeatNumber(Number(e.target.value))}
                className="flex-1 text-center text-xl font-bold py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-900 focus:outline-none focus:border-neutral-400"
                required
              />
              <button
                type="button"
                onClick={() => setSeatNumber((n) => Math.min(movie.totalSeats, n + 1))}
                className="w-10 h-10 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 flex items-center justify-center transition-colors text-lg font-medium"
              >
                +
              </button>
            </div>
            <p className="text-xs text-neutral-400 mt-2 text-center">
              Range: 1 – {movie.totalSeats}
            </p>
          </div>

          {/* Event note */}
          <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-100">
            <p className="text-[11px] font-semibold text-neutral-600 mb-1.5">Event flow on submit</p>
            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
              {["booking.created", "→", "movie.ticket.exchange", "→", "payment.queue", "→", "Payment Consumer"].map((token, i) => (
                token === "→" ? (
                  <span key={i} className="text-neutral-400">{token}</span>
                ) : (
                  <span key={i} className="font-mono bg-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded">
                    {token}
                  </span>
                )
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Creating booking..." : "Confirm Booking"}
          </button>
        </form>
      </div>
    </div>
  );
}
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
