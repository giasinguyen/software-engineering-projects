import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { bookingService, paymentService } from "../services/api";
import { useAuth } from "../context/AuthContext";

function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

const STATUS_CONFIG = {
  PENDING: { badge: "text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20", dot: "bg-[#f59e0b]" },
  CONFIRMED: { badge: "text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/20", dot: "bg-[#22c55e]" },
  FAILED: { badge: "text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/20", dot: "bg-[#ef4444]" },
};

function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
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
    <div className="pt-24 pb-16 px-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] live-dot inline-block" />
              Auto-refresh
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">My Bookings</h1>
          <p className="text-sm text-[#888] mt-2">
            {loading ? "Loading..." : `${bookings.length} booking${bookings.length !== 1 ? "s" : ""} total`}
          </p>
        </div>
        <Link to="/payments" className="text-sm text-[#888] hover:text-white transition-colors cursor-pointer">
          Payment history →
        </Link>
      </div>

      {/* Stats */}
      {!loading && bookings.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Confirmed", value: confirmed, color: "text-[#22c55e]" },
            { label: "Pending", value: pending, color: "text-[#f59e0b]" },
            { label: "Failed", value: failed, color: "text-[#ef4444]" },
          ].map((s) => (
            <div key={s.label} className="border border-[#1a1a1a] bg-[#0a0a0a] rounded-xl p-5 text-center">
              <p className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</p>
              <p className="text-xs text-[#555] mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Bookings list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-6 animate-pulse">
              <div className="flex justify-between mb-3">
                <div className="h-4 bg-[#111] rounded w-48" />
                <div className="h-5 bg-[#111] rounded-full w-20" />
              </div>
              <div className="h-3 bg-[#111] rounded w-32" />
            </div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-24 rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a]">
          <div className="w-14 h-14 mx-auto bg-[#111] rounded-full flex items-center justify-center mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.75">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
            </svg>
          </div>
          <p className="text-sm font-medium text-white">No bookings yet</p>
          <p className="text-xs text-[#555] mt-1">Book a ticket to get started</p>
          <Link
            to="/movies"
            className="inline-block mt-5 px-6 py-2.5 bg-white text-black text-sm font-semibold rounded-lg hover:bg-[#e0e0e0] transition-colors cursor-pointer"
          >
            Browse movies
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const payment = payments[b.id];
            return (
              <div key={b.id} className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] p-6 hover:border-[#333] transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <span className="text-xs font-mono text-[#555]">#{b.id}</span>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="text-base font-semibold text-white truncate font-display">{b.movieTitle}</p>
                    <p className="text-sm text-[#888] mt-0.5">Seat {b.seatNumber}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {b.status === "PENDING" && !payment && (
                      <div className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-2.5 py-1 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] live-dot inline-block" />
                        payment.queue
                      </div>
                    )}
                    {b.status === "CONFIRMED" && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 px-2.5 py-1 rounded">
                        payment.completed
                      </span>
                    )}
                    {b.status === "FAILED" && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 px-2.5 py-1 rounded">
                        booking.failed
                      </span>
                    )}
                  </div>
                </div>

                {payment && (
                  <div className="mt-4 pt-4 border-t border-[#1a1a1a] flex items-center justify-between">
                    <div className="text-sm text-[#888]">
                      {payment.status === "SUCCESS" ? (
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xs font-mono text-[#555]">{payment.transactionId}</span>
                          <span className="text-[#333]">·</span>
                          <span className="text-xs text-[#888]">{payment.method?.replace("_", " ")}</span>
                          <span className="text-[#333]">·</span>
                          <span className="text-sm font-semibold text-[#22c55e]">{formatCurrency(payment.amount)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8v4M12 16h.01" />
                          </svg>
                          <span className="text-xs text-[#ef4444]">{payment.failureReason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!payment && b.status === "PENDING" && (
                  <p className="mt-3 text-xs text-[#f59e0b] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] live-dot inline-block" />
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
