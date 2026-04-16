import { useState, useEffect } from "react";
import { orderService } from "../services/api";
import { useAuth } from "../context/AuthContext";

const STATUS_CONFIG = {
  PENDING:   { label: "Chờ xác nhận", color: "bg-amber-50 text-amber-700 border-amber-200", icon: "⏳" },
  CONFIRMED: { label: "Đã xác nhận", color: "bg-blue-50 text-blue-700 border-blue-200", icon: "✅" },
  PREPARING: { label: "Đang chuẩn bị", color: "bg-purple-50 text-purple-700 border-purple-200", icon: "👨‍🍳" },
  DELIVERED: { label: "Đã giao", color: "bg-green-50 text-green-700 border-green-200", icon: "📦" },
  CANCELLED: { label: "Đã hủy", color: "bg-red-50 text-red-700 border-red-200", icon: "❌" },
};

const FOOD_EMOJIS = ["🍜","🍛","🍱","🍗","🥗","🍔","🥩","🍝","🍲","🥘","🍚","🍣","🥟","🍕","🌮","🥡"];
const getFoodEmoji = (name = "") => FOOD_EMOJIS[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % FOOD_EMOJIS.length];

const STATUS_FLOW = ["PENDING", "CONFIRMED", "PREPARING", "DELIVERED"];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const loadOrders = () => {
    setLoading(true);
    const queryUserId = isAdmin ? undefined : user?.id;
    orderService.getAll(queryUserId)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setOrders(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOrders(); }, [user]);

  const handleNextStatus = async (order) => {
    const idx = STATUS_FLOW.indexOf(order.status);
    if (idx < 0 || idx >= STATUS_FLOW.length - 1) return;
    const next = STATUS_FLOW[idx + 1];
    try {
      await orderService.updateStatus(order.id, next);
      loadOrders();
    } catch {
      alert("Lỗi khi cập nhật trạng thái");
    }
  };

  const handleCancel = async (orderId) => {
    try {
      await orderService.cancel(orderId);
      loadOrders();
    } catch {
      alert("Lỗi khi hủy đơn");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {isAdmin ? "Quản lý đơn hàng" : "Đơn hàng của tôi"}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {isAdmin ? "Xem và cập nhật trạng thái đơn hàng" : "Theo dõi trạng thái đơn hàng"}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
          <span className="text-6xl block mb-4">📋</span>
          <p className="text-gray-500 text-lg mb-2">Chưa có đơn hàng nào</p>
          <p className="text-gray-400 text-sm">Hãy đặt món ăn đầu tiên</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
            return (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{status.icon}</span>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">#{order.id?.slice(-8)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : ""}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {order.items?.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span>{getFoodEmoji(item.foodName)}</span>
                          <span className="text-gray-700">{item.foodName}</span>
                          <span className="text-gray-400">x{item.quantity}</span>
                        </div>
                        <span className="text-gray-600">
                          {(item.unitPrice * item.quantity).toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-sm text-gray-500">
                      {order.paymentMethod === "BANKING" ? "🏦 Chuyển khoản" : "💵 Tiền mặt"}
                    </span>
                    <span className="font-bold text-orange-600">
                      {order.totalAmount?.toLocaleString("vi-VN")}đ
                    </span>
                  </div>

                  {/* Admin actions */}
                  {isAdmin && order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
                    <div className="flex items-center gap-2 pt-3 mt-3 border-t border-gray-100">
                      {STATUS_FLOW.indexOf(order.status) < STATUS_FLOW.length - 1 && (
                        <button
                          onClick={() => handleNextStatus(order)}
                          className="flex-1 h-9 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold transition"
                        >
                          → {STATUS_CONFIG[STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1]]?.label}
                        </button>
                      )}
                      <button
                        onClick={() => handleCancel(order.id)}
                        className="h-9 px-4 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold transition"
                      >
                        Hủy đơn
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
