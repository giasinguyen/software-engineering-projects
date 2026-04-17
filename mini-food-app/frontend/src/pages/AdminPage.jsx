import { useState, useEffect } from "react";
import { foodService } from "../services/api";

const CATEGORIES = ["Cơm", "Phở", "Bún", "Đồ uống", "Tráng miệng", "Khác"];

const FOOD_EMOJIS = ["🍜","🍛","🍱","🍗","🥗","🍔","🥩","🍝","🍲","🥘","🍚","🍣","🥟","🍕","🌮","🥡"];
const getFoodEmoji = (name = "") => FOOD_EMOJIS[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % FOOD_EMOJIS.length];

function FoodForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial
      ? { name: initial.name || "", price: initial.price || "", description: initial.description || "", category: initial.category || "", available: initial.available !== false }
      : { name: "", price: "", description: "", category: "", available: true }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      name: form.name,
      description: form.description,
      price: Number(form.price),
      category: form.category,
      available: form.available,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {initial ? "Chỉnh sửa món ăn" : "Thêm món ăn mới"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên món *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
              placeholder="Ví dụ: Phở bò Kobe"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Giá (VNĐ) *</label>
              <input
                required
                type="number"
                min="1"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                placeholder="35000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Danh mục</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition bg-white"
              >
                <option value="">Chọn danh mục</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
              placeholder="Mô tả ngắn về món ăn..."
            />
          </div>
          <div className="flex items-center justify-between py-2">
            <label className="text-sm font-medium text-gray-700">Còn phục vụ</label>
            <button
              type="button"
              onClick={() => setForm({ ...form, available: !form.available })}
              className={`relative w-12 h-7 rounded-full transition-colors ${form.available ? "bg-green-500" : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${form.available ? "translate-x-5" : ""}`} />
            </button>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel} className="flex-1 h-11 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
              Hủy
            </button>
            <button type="submit" className="flex-1 h-11 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-amber-600 transition">
              {initial ? "Cập nhật" : "Thêm món"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const loadFoods = () => {
    setLoading(true);
    foodService.getAll()
      .then((res) => setFoods(Array.isArray(res.data) ? res.data : []))
      .catch(() => setFoods([]))
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
    try {
      await foodService.delete(id);
      setDeleting(null);
      loadFoods();
    } catch {
      alert("Lỗi khi xóa");
    }
  };

  const stats = {
    total: foods.length,
    available: foods.filter((f) => f.available !== false).length,
    unavailable: foods.filter((f) => f.available === false).length,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý thực đơn</h1>
          <p className="text-gray-500 text-sm mt-1">Thêm, sửa, xóa món ăn</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="h-11 px-5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-orange-500/20 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Thêm món
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-gray-500">Tổng món</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-gray-500">Đang phục vụ</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{stats.available}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm text-gray-500">Tạm ngưng</p>
          <p className="text-3xl font-bold text-gray-400 mt-1">{stats.unavailable}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : foods.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
          <span className="text-6xl block mb-4">🍽️</span>
          <p className="text-gray-500 text-lg">Chưa có món ăn nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Món ăn</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Danh mục</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Giá</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {foods.map((food) => (
                <tr key={food.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center text-lg shrink-0">
                        {getFoodEmoji(food.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{food.name}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[200px]">{food.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{food.category || "—"}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-semibold text-orange-600">{Number(food.price).toLocaleString("vi-VN")}đ</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                      food.available !== false ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${food.available !== false ? "bg-green-500" : "bg-gray-400"}`} />
                      {food.available !== false ? "Đang bán" : "Tạm ngưng"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => { setEditing(food); setShowForm(true); }}
                      className="text-blue-500 hover:text-blue-700 text-xs font-semibold mr-4"
                    >Sửa</button>
                    <button
                      onClick={() => setDeleting(food)}
                      className="text-red-500 hover:text-red-700 text-xs font-semibold"
                    >Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <FoodForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 mx-auto mb-4 flex items-center justify-center text-3xl">🗑️</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận xóa</h3>
            <p className="text-gray-500 text-sm mb-6">
              Bạn có chắc muốn xóa <strong>{deleting.name}</strong>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleting(null)} className="flex-1 h-11 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">
                Hủy
              </button>
              <button onClick={() => handleDelete(deleting.id)} className="flex-1 h-11 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
