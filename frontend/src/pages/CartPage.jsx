import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { orderService } from "../services/api";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const FOOD_EMOJIS = ["🍜","🍛","🍱","🍗","🥗","🍔","🥩","🍝","🍲","🥘","🍚","🍣","🥟","🍕","🌮","🥡"];
const getFoodEmoji = (name = "") => FOOD_EMOJIS[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % FOOD_EMOJIS.length];

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");

  const handleOrder = async () => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const payload = {
        userId: user?.id,
        items: items.map((i) => ({ foodId: i.id, quantity: i.quantity })),
        note,
      };
      const res = await orderService.create(payload);
      clearCart();
      navigate(`/payment/${res.data.id}`, { state: { order: res.data } });
    } catch {
      alert("Tạo đơn hàng thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Giỏ hàng</h1>
          <p className="text-gray-500 text-sm mt-1">{items.length} món trong giỏ</p>
        </div>
        <Link to="/foods" className="text-sm text-orange-500 hover:text-orange-600 font-medium">
          ← Tiếp tục chọn món
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
          <span className="text-6xl block mb-4">🛒</span>
          <p className="text-gray-500 text-lg mb-2">Giỏ hàng trống</p>
          <p className="text-gray-400 text-sm mb-6">Hãy thêm món ăn yêu thích vào giỏ</p>
          <Link to="/foods" className="inline-flex bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition">
            Xem thực đơn
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
            {items.map((item) => (
              <div key={item.id} className="p-5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center text-2xl shrink-0">
                  {getFoodEmoji(item.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                  <p className="text-orange-600 text-sm font-medium mt-0.5">
                    {Number(item.price).toLocaleString("vi-VN")}đ
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 flex items-center justify-center hover:bg-gray-50 transition text-sm"
                  >−</button>
                  <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 flex items-center justify-center hover:bg-gray-50 transition text-sm"
                  >+</button>
                </div>
                <span className="w-24 text-right font-semibold text-gray-900 text-sm">
                  {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                </span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <label className="block text-sm font-semibold text-gray-900 mb-2">Ghi chú đơn hàng</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: ít cay, không hành, giao trước 12h..."
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex justify-between text-sm text-gray-500 mb-3">
              <span>Tạm tính ({items.reduce((s, i) => s + i.quantity, 0)} món)</span>
              <span>{total.toLocaleString("vi-VN")}đ</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-100">
              <span>Tổng cộng</span>
              <span className="text-orange-600">{total.toLocaleString("vi-VN")}đ</span>
            </div>
            <button
              onClick={handleOrder}
              disabled={loading}
              className="w-full mt-5 h-14 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-2xl transition shadow-lg shadow-orange-500/25 disabled:opacity-50 text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang xử lý...
                </span>
              ) : `Đặt hàng · ${total.toLocaleString("vi-VN")}đ`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
