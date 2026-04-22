import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { bookingService, imdbService } from "../services/api";
import { useAuth } from "../context/AuthContext";

function StepDot({ n, active, done }) {
  if (done) {
    return (
      <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
    );
  }
  return (
    <div
      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
        active ? "bg-white text-black" : "bg-[#1a1a1a] border border-[#333] text-[#555]"
      }`}
    >
      {n}
    </div>
  );
}

function StepIndicator({ current }) {
  const steps = ["Select Movie", "Choose Seat", "Confirm"];
  return (
    <div className="flex items-center mb-10">
      {steps.map((label, i) => {
        const n = i + 1;
        return (
          <div key={n} className="flex items-center">
            <div className="flex items-center gap-2.5">
              <StepDot n={n} active={n === current} done={n < current} />
              <span className={`text-sm ${n === current ? "font-semibold text-white" : "text-[#555]"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-12 h-px mx-4 transition-colors ${n < current ? "bg-white" : "bg-[#222]"}`} />
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

  // ── Result screen ──────────────────────────────────────────────────────────
  if (result) {
    const isError = !!result.error;
    return (
      <div className="pt-24 pb-16 px-6 max-w-lg mx-auto">
        <StepIndicator current={3} />
        <div className={`rounded-2xl border p-8 text-center ${
          isError
            ? "border-[#ef4444]/20 bg-[#ef4444]/5"
            : "border-[#22c55e]/20 bg-[#22c55e]/5"
        }`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
            isError ? "bg-[#ef4444]/10" : "bg-[#22c55e]/10"
          }`}>
            {isError ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
          </div>
          {isError ? (
            <>
              <h2 className="text-lg font-semibold text-[#ef4444] mb-1 font-display">Booking Failed</h2>
              <p className="text-sm text-[#ef4444]/80">{result.error}</p>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-[#22c55e] mb-1 font-display">Booking Submitted</h2>
              <p className="text-sm text-[#22c55e]/80 mb-6">
                Your booking is queued. Payment will be processed asynchronously via RabbitMQ.
              </p>
              <div className="bg-[#0a0a0a] rounded-xl p-5 text-left space-y-3 mb-6 border border-[#1a1a1a]">
                {[
                  ["Booking ID", `#${result.id}`, "font-mono font-bold"],
                  ["Movie", result.movieTitle, ""],
                  ["Seat", result.seatNumber, ""],
                  ["Status", result.status, "text-[#f59e0b] font-semibold"],
                ].map(([label, value, cls]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-[#666]">{label}</span>
                    <span className={`text-white ${cls}`}>{value}</span>
                  </div>
                ))}
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] live-dot inline-block" />
                booking.created → payment.queue → Payment Consumer
              </div>
            </>
          )}
        </div>
        <button
          onClick={() => navigate("/bookings")}
          className="mt-5 w-full py-3 bg-white text-black text-sm font-semibold rounded-lg hover:bg-[#e0e0e0] transition-colors cursor-pointer"
        >
          View My Bookings
        </button>
      </div>
    );
  }

  // ── Booking form ───────────────────────────────────────────────────────────
  return (
    <div className="pt-24 pb-16 px-6 max-w-lg mx-auto">
      <StepIndicator current={2} />

      {/* Movie card */}
      <div className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden mb-6 flex">
        {posterUrl && (
          <img src={posterUrl} alt={movie.title} className="w-28 h-40 object-cover shrink-0" />
        )}
        <div className="p-5 flex flex-col justify-center gap-1.5">
          <h2 className="text-base font-semibold text-white font-display">{movie.title}</h2>
          {rating && (
            <div className="flex items-center gap-1.5 text-[#f59e0b] text-xs">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="font-semibold text-white">{rating.toFixed(1)}</span>
              <span className="text-[#555]">/ 10</span>
            </div>
          )}
          <p className="text-xs text-[#888]">
            {movie.genre}{movie.genre && " · "}{movie.duration} min
          </p>
          <p className="text-xs text-[#555]">{movie.totalSeats} seats available</p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-7">
        <h3 className="text-sm font-semibold text-white mb-6">Choose Seat</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-[#555] uppercase tracking-widest mb-3">
              Seat Number
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSeatNumber((n) => Math.max(1, n - 1))}
                className="w-11 h-11 rounded-lg border border-[#333] text-white hover:bg-[#1a1a1a] flex items-center justify-center transition-colors text-lg font-medium cursor-pointer"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={movie.totalSeats}
                value={seatNumber}
                onChange={(e) => setSeatNumber(Number(e.target.value))}
                className="flex-1 text-center text-2xl font-bold py-2.5 border border-[#222] rounded-lg bg-[#111] text-white focus:outline-none focus:border-[#444]"
                required
              />
              <button
                type="button"
                onClick={() => setSeatNumber((n) => Math.min(movie.totalSeats, n + 1))}
                className="w-11 h-11 rounded-lg border border-[#333] text-white hover:bg-[#1a1a1a] flex items-center justify-center transition-colors text-lg font-medium cursor-pointer"
              >
                +
              </button>
            </div>
            <p className="text-xs text-[#555] mt-2 text-center">Range: 1 – {movie.totalSeats}</p>
          </div>

          {/* Event note */}
          <div className="p-4 bg-[#111] rounded-xl border border-[#1a1a1a]">
            <p className="text-[11px] font-semibold text-[#888] mb-2">Event flow on submit</p>
            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
              {["booking.created", "→", "movie.ticket.exchange", "→", "payment.queue", "→", "Payment Consumer"].map((token, i) =>
                token === "→" ? (
                  <span key={i} className="text-[#444]">{token}</span>
                ) : (
                  <span key={i} className="font-mono bg-[#1a1a1a] text-[#888] border border-[#222] px-2 py-0.5 rounded">
                    {token}
                  </span>
                )
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-white text-black text-sm font-semibold rounded-lg hover:bg-[#e0e0e0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {loading ? "Creating booking..." : "Confirm Booking"}
          </button>
        </form>
      </div>
    </div>
  );
}
