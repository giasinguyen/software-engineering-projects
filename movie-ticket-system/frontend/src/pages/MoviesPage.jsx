import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { movieService } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function MoviesPage() {
  const [movies, setMovies] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    movieService.getAll().then((res) => setMovies(res.data));
  }, []);

  const handleBook = (movie) => {
    if (!user) return navigate("/login");
    navigate("/book", { state: { movie } });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Now Showing</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {movies.map((movie) => (
          <div key={movie.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-yellow-400">{movie.title}</h2>
            <p className="text-gray-400 mt-2">{movie.description}</p>
            <div className="mt-3 flex gap-3 text-sm text-gray-500">
              <span>{movie.genre}</span>
              <span>{movie.duration} min</span>
              <span>{movie.totalSeats} seats</span>
            </div>
            <button
              onClick={() => handleBook(movie)}
              className="mt-4 w-full py-2 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400"
            >
              Book Ticket
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
