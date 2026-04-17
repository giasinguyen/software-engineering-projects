import { useEffect, useState } from "react";
import { paymentService } from "../services/api";
import { useAuth } from "../context/AuthContext";

const STATUS_BADGE = {
  SUCCESS: "bg-green-900 text-green-300 border border-green-700",
  FAILED: "bg-red-900 text-red-300 border border-red-700",
};

const METHOD_ICON = {
  CREDIT_CARD: "💳",
  DEBIT_CARD: "🏦",
  E_WALLET: "📱",
};

function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleString("vi-VN");
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
