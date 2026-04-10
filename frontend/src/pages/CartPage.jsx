import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { orderService } from "../services/api";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

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
        username: user?.username,
        note,
        items: items.map((i) => ({
          foodId: i.id,
          foodName: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        total,
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/foods" className="text-gray-500 hover:text-gray-700 text-sm">
            ← Quay lại
          </Link>
          <span className="font-bold text-gray-800">Giỏ hàng của bạn</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🛒</div>
            <p className="text-gray-500">Giỏ hàng trống</p>
            <Link to="/foods" className="inline-block mt-4 text-orange-500 font-medium hover:underline">
              Xem thực đơn
            </Link>
          </div>
        ) : (
          <>
            {/* Item list */}
            <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
              {items.map((item) => (
                <div key={item.id} className="p-4 flex items-center gap-3">
                  <span className="text-2xl">{item.emoji || "🍽️"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{item.name}</p>
                    <p className="text-orange-600 text-xs font-semibold">
                      {item.price?.toLocaleString("vi-VN")}đ
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center hover:bg-gray-100"
                    >
                      −
                    </button>
                    <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center hover:bg-gray-100"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="ml-1 text-red-400 hover:text-red-600 text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                  <span className="text-sm font-semibold text-gray-800 w-20 text-right">
                    {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                  </span>
                </div>
              ))}
            </div>

            {/* Note */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: ít cay, không hành..."
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {/* Summary */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Tạm tính</span>
                <span>{total.toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="flex justify-between font-bold text-gray-800 text-base pt-2 border-t border-gray-100">
                <span>Tổng cộng</span>
                <span className="text-orange-600">{total.toLocaleString("vi-VN")}đ</span>
              </div>
              <button
                onClick={handleOrder}
                disabled={loading}
                className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
              >
                {loading ? "Đang đặt hàng..." : "Đặt hàng ngay →"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
