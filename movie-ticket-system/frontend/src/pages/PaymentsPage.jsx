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
    <div className="bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-neutral-400">#{payment.id}</span>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${
                isSuccess
                  ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                  : "text-red-700 bg-red-50 border-red-200"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isSuccess ? "bg-emerald-500" : "bg-red-500"}`} />
              {payment.status}
            </span>
          </div>
          <p className="text-[15px] font-semibold text-neutral-900 truncate">{payment.movieTitle}</p>
          <p className="text-sm text-neutral-500 mt-0.5">
            Booking #{payment.bookingId} · Seat {payment.seatNumber}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-lg font-bold ${isSuccess ? "text-neutral-900" : "text-neutral-400"}`}>
            {isSuccess ? formatCurrency(payment.amount) : "—"}
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-neutral-100 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Method</p>
          <p className="text-neutral-700">{METHOD_LABELS[payment.method] || payment.method || "—"}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Date</p>
          <p className="text-neutral-700">{formatDate(payment.createdAt)}</p>
        </div>
        {payment.transactionId && (
          <div className="col-span-2">
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Transaction ID</p>
            <p className="font-mono text-sm text-emerald-700">{payment.transactionId}</p>
          </div>
        )}
        {payment.failureReason && (
          <div className="col-span-2">
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Failure Reason</p>
            <p className="text-sm text-red-600">{payment.failureReason}</p>
          </div>
        )}
      </div>

      {/* Event label */}
      <div className="mt-4 pt-3 border-t border-neutral-100">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-neutral-400">
          <span className={`w-1.5 h-1.5 rounded-full ${isSuccess ? "bg-emerald-400" : "bg-red-400"}`} />
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
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 live-dot inline-block" />
            Auto-refresh
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-neutral-900">Payment History</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {loading ? "Loading..." : `${payments.length} payment${payments.length !== 1 ? "s" : ""} recorded`}
        </p>
      </div>

      {/* Summary */}
      {!loading && payments.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-7">
          <div className="bg-white border border-neutral-200 rounded-xl p-4 text-center">
            <p className="text-xl font-bold text-neutral-900 truncate">{formatCurrency(total)}</p>
            <p className="text-xs text-neutral-500 mt-0.5">Total paid</p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{success}</p>
            <p className="text-xs text-neutral-500 mt-0.5">Successful</p>
          </div>
          <div className="bg-white border border-neutral-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{failed}</p>
            <p className="text-xs text-neutral-500 mt-0.5">Failed</p>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-neutral-200 p-6 animate-pulse">
              <div className="flex justify-between mb-4">
                <div className="h-4 bg-neutral-100 rounded w-1/2" />
                <div className="h-6 bg-neutral-100 rounded w-24" />
              </div>
              <div className="h-3 bg-neutral-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-neutral-200">
          <div className="w-12 h-12 mx-auto bg-neutral-100 rounded-full flex items-center justify-center mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="1.75">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M2 10h20M6 15h4" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-sm font-medium text-neutral-700">No payments yet</p>
          <p className="text-xs text-neutral-400 mt-1">Payments appear after booking</p>
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

export default function PaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    paymentService
      .getByUser(user.id)
      .then((res) => setPayments(res.data))
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      paymentService.getByUser(user.id).then((res) => setPayments(res.data));
    }, 3000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) return <p className="text-gray-400">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Payment History</h1>
      {payments.length === 0 ? (
        <p className="text-gray-400">No payment records yet.</p>
      ) : (
        <div className="space-y-4">
          {payments.map((p) => (
            <div key={p.id} className="bg-gray-800 rounded-lg p-5 border border-gray-700">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-gray-400 text-sm">#{p.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[p.status]}`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="font-bold text-white">{p.movieTitle}</p>
                  <p className="text-gray-400 text-sm mt-1">Booking #{p.bookingId} · Seat {p.seatNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-yellow-400 font-bold text-lg">{formatCurrency(p.amount)}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Method</span>
                  <p className="text-white mt-0.5">
                    {METHOD_ICON[p.method] || ""} {p.method?.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Date</span>
                  <p className="text-white mt-0.5">{formatDate(p.createdAt)}</p>
                </div>
                {p.transactionId && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Transaction ID</span>
                    <p className="text-green-400 font-mono mt-0.5">{p.transactionId}</p>
                  </div>
                )}
                {p.failureReason && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Reason</span>
                    <p className="text-red-400 mt-0.5">{p.failureReason}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
