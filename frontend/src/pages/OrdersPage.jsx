import { useState, useEffect } from "react";
import { orderService } from "../services/api";
import { Link } from "react-router-dom";

const STATUS_LABELS = {
  PENDING: { label: "Chờ xử lý", color: "bg-yellow-100 text-yellow-700" },
  PAID: { label: "Đã thanh toán", color: "bg-green-100 text-green-700" },
  FAILED: { label: "Thất bại", color: "bg-red-100 text-red-700" },
  DELIVERED: { label: "Đã giao", color: "bg-blue-100 text-blue-700" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService.getAll()
      .then((res) => setOrders(res.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/foods" className="text-gray-500 hover:text-gray-700 text-sm">← Thực đơn</Link>
          <span className="font-bold text-gray-800">Đơn hàng của tôi</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Đang tải...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-3">📋</div>
            <p>Chưa có đơn hàng nào</p>
          </div>
        ) : (
          orders.map((order) => {
            const status = STATUS_LABELS[order.status] || STATUS_LABELS.PENDING;
            return (
              <div key={order.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-gray-800 text-sm">Đơn #{order.id}</span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                <div className="space-y-1">
                  {order.items?.slice(0, 3).map((item, i) => (
                    <p key={i} className="text-xs text-gray-500">
                      • {item.foodName} × {item.quantity}
                    </p>
                  ))}
                  {order.items?.length > 3 && (
                    <p className="text-xs text-gray-400">+{order.items.length - 3} món khác</p>
                  )}
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString("vi-VN") : ""}
                  </span>
                  <span className="font-bold text-orange-600 text-sm">
                    {order.total?.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
