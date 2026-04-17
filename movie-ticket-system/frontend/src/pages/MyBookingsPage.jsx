import { useEffect, useState } from "react";
import { bookingService } from "../services/api";
import { useAuth } from "../context/AuthContext";

const STATUS_COLORS = {
  PENDING: "text-yellow-400",
  CONFIRMED: "text-green-400",
  FAILED: "text-red-400",
};

export default function MyBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);

  const fetchBookings = () => {
    if (user) {
      bookingService.getByUser(user.id).then((res) => setBookings(res.data));
    }
  };

  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 3000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Bookings</h1>
      {bookings.length === 0 ? (
        <p className="text-gray-400">No bookings yet.</p>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex justify-between items-center">
              <div>
                <p className="font-bold">#{b.id} - {b.movieTitle}</p>
                <p className="text-gray-400 text-sm">Seat {b.seatNumber}</p>
              </div>
              <span className={`font-bold ${STATUS_COLORS[b.status] || ""}`}>
                {b.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
