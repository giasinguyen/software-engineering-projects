import { useState, useEffect } from "react";
import { foodService } from "../services/api";
import { useCart } from "../context/CartContext";

const FOOD_EMOJIS = ["🍜","🍛","🍱","🍗","🥗","🍔","🥩","🍝","🍲","🥘","🍚","🍣","🥟","🍕","🌮","🥡"];
const getFoodEmoji = (name = "") => FOOD_EMOJIS[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % FOOD_EMOJIS.length];

const GRADIENTS = [
  "from-orange-100 to-amber-50",
  "from-rose-100 to-pink-50",
  "from-sky-100 to-cyan-50",
  "from-emerald-100 to-green-50",
  "from-violet-100 to-purple-50",
  "from-amber-100 to-yellow-50",
];
const getGradient = (name = "") => GRADIENTS[name.length % GRADIENTS.length];

function FoodCard({ food, onAdd }) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAdd(food);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
      <div className={`h-36 bg-gradient-to-br ${getGradient(food.name)} flex items-center justify-center`}>
        <span className="text-5xl group-hover:scale-110 transition-transform duration-300">{getFoodEmoji(food.name)}</span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{food.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{food.category || "Món ăn"}</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2 line-clamp-2 min-h-[2.5rem]">
          {food.description || "Món ăn ngon tại FoodOrder"}
        </p>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <span className="text-orange-600 font-bold">{Number(food.price).toLocaleString("vi-VN")}đ</span>
          <button
            onClick={handleAdd}
            disabled={food.available === false}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
              food.available === false
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : added
                ? "bg-green-500 text-white scale-95"
                : "bg-orange-500 text-white hover:bg-orange-600 active:scale-95"
            }`}
          >
            {food.available === false ? "Hết hàng" : added ? "✓ Đã thêm" : "+ Thêm"}
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
  const [category, setCategory] = useState("all");
  const { addItem } = useCart();

  useEffect(() => {
    foodService.getAll()
      .then((res) => setFoods(Array.isArray(res.data) ? res.data : []))
      .catch(() => setFoods([]))
      .finally(() => setLoading(false));
  }, []);

  const categories = ["all", ...new Set(foods.map((f) => f.category).filter(Boolean))];

  const filtered = foods.filter((f) => {
    const matchSearch = f.name?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "all" || f.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Thực đơn hôm nay</h1>
        <p className="text-gray-500 text-sm">Chọn món yêu thích và thêm vào giỏ hàng</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm món ăn..."
            className="w-full h-12 pl-12 pr-4 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
          />
        </div>
        {categories.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  category === cat
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-orange-300 hover:text-orange-600"
                }`}
              >
                {cat === "all" ? "Tất cả" : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-5xl block mb-4">🍽️</span>
          <p className="text-gray-500 text-lg">Không tìm thấy món nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((food) => (
            <FoodCard key={food.id} food={food} onAdd={addItem} />
          ))}
        </div>
      )}
    </div>
  );
}
