import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { paymentService } from "../services/api";

const METHODS = [
  { id: "COD", label: "Tiền mặt khi nhận hàng", icon: "💵" },
  { id: "BANKING", label: "Chuyển khoản ngân hàng", icon: "🏦" },
];

export default function PaymentPage() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const order = state?.order;

  const [method, setMethod] = useState("COD");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handlePay = async () => {
    setLoading(true);
    try {
      const res = await paymentService.pay({ orderId: id, method });
      setResult({ success: true, data: res.data });
    } catch {
      setResult({ success: false });
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-md w-full max-w-sm p-8 text-center">
          <div className="text-5xl mb-4">{result.success ? "🎉" : "😞"}</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {result.success ? "Đặt hàng thành công!" : "Thanh toán thất bại"}
          </h2>
          {result.success && (
            <p className="text-gray-500 text-sm mb-6">
              Đơn hàng #{id} của bạn đã được xác nhận. Chúng tôi sẽ chuẩn bị ngay!
            </p>
          )}
          <button
            onClick={() => navigate("/foods")}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl transition"
          >
            Đặt thêm món
          </button>
          {result.success && (
            <button
              onClick={() => navigate("/orders")}
              className="w-full mt-2 border border-gray-300 text-gray-700 font-medium py-2.5 rounded-xl hover:bg-gray-50 transition"
            >
              Xem đơn hàng
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <span className="font-bold text-gray-800">Thanh toán</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Order summary */}
        {order && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm">Đơn hàng #{id}</h3>
            <div className="space-y-2">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm text-gray-600">
                  <span>{item.foodName} × {item.quantity}</span>
                  <span>{(item.price * item.quantity).toLocaleString("vi-VN")}đ</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between font-bold text-gray-800">
              <span>Tổng</span>
              <span className="text-orange-600">{order.total?.toLocaleString("vi-VN")}đ</span>
            </div>
          </div>
        )}

        {/* Payment method */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">Phương thức thanh toán</h3>
          <div className="space-y-2">
            {METHODS.map((m) => (
              <label
                key={m.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                  method === m.id
                    ? "border-orange-400 bg-orange-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="method"
                  value={m.id}
                  checked={method === m.id}
                  onChange={() => setMethod(m.id)}
                  className="accent-orange-500"
                />
                <span className="text-xl">{m.icon}</span>
                <span className="text-sm font-medium text-gray-700">{m.label}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
        >
          {loading ? "Đang xử lý..." : "Xác nhận thanh toán →"}
        </button>
      </div>
    </div>
  );
}
