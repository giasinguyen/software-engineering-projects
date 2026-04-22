import { useEffect, useState } from "react";
import { paymentService } from "../services/api";
import { useAuth } from "../context/AuthContext";

function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN");
}

const METHOD_LABELS = {
  CREDIT_CARD: "Credit Card",
  DEBIT_CARD: "Debit Card",
  E_WALLET: "E-Wallet",
};

function PaymentCard({ payment }) {
  const isSuccess = payment.status === "SUCCESS";
  return (
    <div className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-6 hover:border-[#333] transition-all">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="text-xs font-mono text-[#555]">#{payment.id}</span>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                isSuccess
                  ? "text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/20"
                  : "text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/20"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isSuccess ? "bg-[#22c55e]" : "bg-[#ef4444]"}`} />
              {payment.status}
            </span>
          </div>
          <p className="text-base font-semibold text-white truncate font-display">{payment.movieTitle}</p>
          <p className="text-sm text-[#888] mt-0.5">
            Booking #{payment.bookingId} · Seat {payment.seatNumber}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-xl font-bold font-display ${isSuccess ? "text-white" : "text-[#555]"}`}>
            {isSuccess ? formatCurrency(payment.amount) : "—"}
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-[#1a1a1a] grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-[10px] font-bold text-[#555] uppercase tracking-wider mb-1">Method</p>
          <p className="text-[#a0a0a0]">{METHOD_LABELS[payment.method] || payment.method || "—"}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-[#555] uppercase tracking-wider mb-1">Date</p>
          <p className="text-[#a0a0a0]">{formatDate(payment.createdAt)}</p>
        </div>
        {payment.transactionId && (
          <div className="col-span-2">
            <p className="text-[10px] font-bold text-[#555] uppercase tracking-wider mb-1">Transaction ID</p>
            <p className="font-mono text-sm text-[#22c55e]">{payment.transactionId}</p>
          </div>
        )}
        {payment.failureReason && (
          <div className="col-span-2">
            <p className="text-[10px] font-bold text-[#555] uppercase tracking-wider mb-1">Failure Reason</p>
            <p className="text-sm text-[#ef4444]">{payment.failureReason}</p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[#1a1a1a]">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[#555]">
          <span className={`w-1.5 h-1.5 rounded-full ${isSuccess ? "bg-[#22c55e]" : "bg-[#ef4444]"}`} />
          {isSuccess ? "payment.completed → notification.queue" : "booking.failed → DLQ"}
        </span>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = () => {
      paymentService.getByUser(user.id).then((res) => {
        setPayments(res.data);
        setLoading(false);
      });
    };
    load();
    const iv = setInterval(load, 3000);
    return () => clearInterval(iv);
  }, [user]);

  const total = payments.reduce((sum, p) => sum + (p.status === "SUCCESS" ? p.amount : 0), 0);
  const success = payments.filter((p) => p.status === "SUCCESS").length;
  const failed = payments.filter((p) => p.status === "FAILED").length;

  return (
    <div className="pt-24 pb-16 px-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] live-dot inline-block" />
            Auto-refresh
          </span>
        </div>
        <h1 className="font-display text-3xl font-bold text-white tracking-tight">Payment History</h1>
        <p className="text-sm text-[#888] mt-2">
          {loading ? "Loading..." : `${payments.length} payment${payments.length !== 1 ? "s" : ""} recorded`}
        </p>
      </div>

      {/* Summary */}
      {!loading && payments.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="border border-[#1a1a1a] bg-[#0a0a0a] rounded-xl p-5 text-center">
            <p className="text-lg font-bold text-white truncate font-display">{formatCurrency(total)}</p>
            <p className="text-xs text-[#555] mt-1">Total paid</p>
          </div>
          <div className="border border-[#1a1a1a] bg-[#0a0a0a] rounded-xl p-5 text-center">
            <p className="text-2xl font-bold text-[#22c55e] font-display">{success}</p>
            <p className="text-xs text-[#555] mt-1">Successful</p>
          </div>
          <div className="border border-[#1a1a1a] bg-[#0a0a0a] rounded-xl p-5 text-center">
            <p className="text-2xl font-bold text-[#ef4444] font-display">{failed}</p>
            <p className="text-xs text-[#555] mt-1">Failed</p>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] p-6 animate-pulse">
              <div className="flex justify-between mb-4">
                <div className="h-4 bg-[#111] rounded w-1/2" />
                <div className="h-6 bg-[#111] rounded w-24" />
              </div>
              <div className="h-3 bg-[#111] rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-24 rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a]">
          <div className="w-14 h-14 mx-auto bg-[#111] rounded-full flex items-center justify-center mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.75">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M2 10h20M6 15h4" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-sm font-medium text-white">No payments yet</p>
          <p className="text-xs text-[#555] mt-1">Payments appear after booking</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((p) => (
            <PaymentCard key={p.id} payment={p} />
          ))}
        </div>
      )}
    </div>
  );
}
