import { useState, useEffect } from "react";
import { foodService } from "../services/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

function FoodCard({ food, onAdd }) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAdd(food);
    setAdded(true);
    setTimeout(() => setAdded(false), 1000);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
      <div className="h-36 bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-5xl">
        {food.emoji || "🍽️"}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 truncate">{food.name}</h3>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2 min-h-[2.5rem]">
          {food.description || "Món ăn ngon"}
        </p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-orange-600 font-bold text-sm">
            {food.price?.toLocaleString("vi-VN")}đ
          </span>
          <button
            onClick={handleAdd}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              added
                ? "bg-green-100 text-green-700"
                : "bg-orange-500 text-white hover:bg-orange-600"
            }`}
          >
            {added ? "✓ Đã thêm" : "+ Thêm"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FoodsPage() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { addItem, count } = useCart();
  const { user, logout } = useAuth();

  useEffect(() => {
    foodService.getAll()
      .then((res) => setFoods(res.data))
      .catch(() => setFoods([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = foods.filter((f) =>
    f.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍜</span>
            <span className="font-bold text-gray-800">FoodOrder</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">👤 {user?.username}</span>
            <Link
              to="/cart"
              className="relative bg-orange-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition"
            >
              🛒 Giỏ hàng
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-800 mb-3">Thực đơn hôm nay</h1>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Tìm món ăn..."
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Đang tải thực đơn...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Không tìm thấy món nào</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {filtered.map((food) => (
              <FoodCard key={food.id} food={food} onAdd={addItem} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
