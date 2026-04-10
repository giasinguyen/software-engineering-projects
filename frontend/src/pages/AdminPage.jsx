import { useState, useEffect } from "react";
import { foodService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

const EMOJIS = ["🍜", "🍛", "🍱", "🍗", "🥗", "🍔", "🥩", "🍝", "🍲", "🥘"];

function FoodForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || { name: "", price: "", description: "", emoji: "🍜" }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, price: Number(form.price) });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          {initial ? "Sửa món ăn" : "Thêm món ăn mới"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Emoji</label>
            <div className="flex gap-2 flex-wrap">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setForm({ ...form, emoji: e })}
                  className={`text-xl p-1.5 rounded-lg border transition ${
                    form.emoji === e ? "border-orange-400 bg-orange-50" : "border-gray-200"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tên món</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Giá (VNĐ)</label>
            <input
              required
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mô tả</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 bg-orange-500 text-white py-2 rounded-lg text-sm hover:bg-orange-600"
            >
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, logout } = useAuth();
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadFoods = () => {
    foodService.getAll()
      .then((res) => setFoods(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadFoods(); }, []);

  const handleSave = async (data) => {
    try {
      if (editing?.id) {
        await foodService.update(editing.id, data);
      } else {
        await foodService.create(data);
      }
      setShowForm(false);
      setEditing(null);
      loadFoods();
    } catch {
      alert("Lỗi khi lưu món ăn");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Xác nhận xóa món ăn này?")) return;
    try {
      await foodService.delete(id);
      loadFoods();
    } catch {
      alert("Lỗi khi xóa");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍜</span>
            <span className="font-bold text-gray-800">Admin Panel</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded-full">
              ADMIN
            </span>
            <span className="text-sm text-gray-600">{user?.username}</span>
            <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">
              Đăng xuất
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-800">Quản lý thực đơn</h1>
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            + Thêm món
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Đang tải...</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Món ăn</th>
                  <th className="px-4 py-3 text-right">Giá</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {foods.map((food) => (
                  <tr key={food.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{food.emoji || "🍽️"}</span>
                        <div>
                          <p className="font-medium text-gray-800">{food.name}</p>
                          <p className="text-xs text-gray-400 truncate max-w-xs">{food.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-orange-600 font-semibold">
                      {food.price?.toLocaleString("vi-VN")}đ
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => { setEditing(food); setShowForm(true); }}
                        className="text-blue-500 hover:text-blue-700 mr-3 text-xs font-medium"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(food.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <FoodForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
