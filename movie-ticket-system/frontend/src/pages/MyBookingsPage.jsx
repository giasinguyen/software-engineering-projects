import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { bookingService, paymentService } from "../services/api";
import { useAuth } from "../context/AuthContext";

function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

const STATUS = {
  PENDING: {
    badge: "text-amber-700 bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
  },
  CONFIRMED: {
    badge: "text-emerald-700 bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
  },
  FAILED: {
    badge: "text-red-700 bg-red-50 border-red-200",
    dot: "bg-red-500",
  },
};

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${status === "PENDING" ? "live-dot" : ""}`} />
      {status}
    </span>
  );
}

export default function MyBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    if (!user) return;
    Promise.allSettled([
      bookingService.getByUser(user.id),
      paymentService.getByUser(user.id),
    ]).then(([bRes, pRes]) => {
      if (bRes.status === "fulfilled") setBookings(bRes.value.data);
      if (pRes.status === "fulfilled") {
        const map = {};
        pRes.value.data.forEach((p) => { map[p.bookingId] = p; });
        setPayments(map);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 3000);
    return () => clearInterval(iv);
  }, [user]);

  const confirmed = bookings.filter((b) => b.status === "CONFIRMED").length;
  const pending = bookings.filter((b) => b.status === "PENDING").length;
  const failed = bookings.filter((b) => b.status === "FAILED").length;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-7">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 live-dot inline-block" />
              Auto-refresh
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900">My Bookings</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {loading ? "Loading..." : `${bookings.length} booking${bookings.length !== 1 ? "s" : ""} total`}
          </p>
        </div>
        <Link
          to="/payments"
          className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          Payment history →
        </Link>
      </div>

      {/* Stats */}
      {!loading && bookings.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-7">
          {[
            { label: "Confirmed", value: confirmed, color: "text-emerald-600" },
            { label: "Pending", value: pending, color: "text-amber-600" },
            { label: "Failed", value: failed, color: "text-red-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-neutral-200 rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Bookings list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-neutral-200 p-5 animate-pulse">
              <div className="flex justify-between mb-3">
                <div className="h-4 bg-neutral-100 rounded w-48" />
                <div className="h-5 bg-neutral-100 rounded-full w-20" />
              </div>
              <div className="h-3 bg-neutral-100 rounded w-32" />
            </div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-neutral-200">
          <div className="w-12 h-12 mx-auto bg-neutral-100 rounded-full flex items-center justify-center mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="1.75">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
            </svg>
          </div>
          <p className="text-sm font-medium text-neutral-700">No bookings yet</p>
          <p className="text-xs text-neutral-400 mt-1">Book a ticket to get started</p>
          <Link
            to="/movies"
            className="inline-block mt-4 px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
          >
            Browse movies
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const payment = payments[b.id];
            return (
              <div
                key={b.id}
                className="bg-white rounded-xl border border-neutral-200 p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-neutral-400">#{b.id}</span>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="text-[15px] font-semibold text-neutral-900 truncate">{b.movieTitle}</p>
                    <p className="text-sm text-neutral-500 mt-0.5">Seat {b.seatNumber}</p>
                  </div>

                  {/* Event flow badge */}
                  <div className="shrink-0 text-right">
                    {b.status === "PENDING" && !payment && (
                      <div className="inline-flex items-center gap-1.5 text-[10px] font-mono text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 live-dot inline-block" />
                        payment.queue
                      </div>
                    )}
                    {b.status === "CONFIRMED" && (
                      <div className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">
                        payment.completed
                      </div>
                    )}
                    {b.status === "FAILED" && (
                      <div className="inline-flex items-center gap-1.5 text-[10px] font-mono text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded">
                        booking.failed
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment detail */}
                {payment && (
                  <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between">
                    <div className="text-sm text-neutral-600">
                      {payment.status === "SUCCESS" ? (
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-neutral-400">{payment.transactionId}</span>
                          <span className="text-neutral-400">·</span>
                          <span className="text-xs text-neutral-600">{payment.method?.replace("_", " ")}</span>
                          <span className="text-neutral-400">·</span>
                          <span className="text-sm font-semibold text-emerald-700">
                            {formatCurrency(payment.amount)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8v4M12 16h.01" />
                          </svg>
                          <span className="text-xs text-red-600">{payment.failureReason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!payment && b.status === "PENDING" && (
                  <p className="mt-3 text-xs text-amber-600 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 live-dot inline-block" />
                    Waiting for Payment Consumer to process...
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MyBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState({});

  const fetchData = () => {
    if (!user) return;
    bookingService.getByUser(user.id).then((res) => setBookings(res.data));
    paymentService.getByUser(user.id).then((res) => {
      const map = {};
      res.data.forEach((p) => { map[p.bookingId] = p; });
      setPayments(map);
    });
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Bookings</h1>
        <Link to="/payments" className="text-sm text-yellow-400 hover:underline">
          View payment history →
        </Link>
      </div>
      {bookings.length === 0 ? (
        <p className="text-gray-400">No bookings yet.</p>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const payment = payments[b.id];
            return (
              <div key={b.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold">#{b.id} — {b.movieTitle}</p>
                    <p className="text-gray-400 text-sm">Seat {b.seatNumber}</p>
                  </div>
                  <span className={`font-bold ${STATUS_COLORS[b.status] || ""}`}>
                    {b.status}
                  </span>
                </div>
                {payment && (
                  <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between text-sm">
                    <div className="text-gray-400">
                      {payment.status === "SUCCESS" ? (
                        <span>
                          💳 {payment.method?.replace("_", " ")} ·{" "}
                          <span className="text-green-400">{formatCurrency(payment.amount)}</span>
                          {" · "}
                          <span className="font-mono text-xs text-gray-500">{payment.transactionId}</span>
                        </span>
                      ) : (
                        <span className="text-red-400">❌ {payment.failureReason}</span>
                      )}
                    </div>
                  </div>
                )}
                {!payment && b.status === "PENDING" && (
                  <p className="mt-2 text-xs text-yellow-500 animate-pulse">Processing payment...</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
