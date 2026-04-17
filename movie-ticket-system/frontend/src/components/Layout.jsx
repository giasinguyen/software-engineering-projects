import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-yellow-400">
            🎬 Movie Tickets
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-yellow-400">Movies</Link>
            {user ? (
              <>
                <Link to="/bookings" className="hover:text-yellow-400">My Bookings</Link>
                <span className="text-gray-400">Hi, {user.username}</span>
                <button onClick={handleLogout} className="text-red-400 hover:text-red-300">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-yellow-400">Login</Link>
                <Link to="/register" className="hover:text-yellow-400">Register</Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
