import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { bookingService, paymentService } from "../services/api";
import { useAuth } from "../context/AuthContext";

const STATUS_COLORS = {
  PENDING: "text-yellow-400",
  CONFIRMED: "text-green-400",
  FAILED: "text-red-400",
};

function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
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
