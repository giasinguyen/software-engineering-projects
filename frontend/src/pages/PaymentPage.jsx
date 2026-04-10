import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { paymentService } from "../services/api";

const FOOD_EMOJIS = ["🍜","🍛","🍱","🍗","🥗","🍔","🥩","🍝","🍲","🥘","🍚","🍣","🥟","🍕","🌮","🥡"];
const getFoodEmoji = (name = "") => FOOD_EMOJIS[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % FOOD_EMOJIS.length];

const METHODS = [
  { id: "COD", label: "Tiền mặt khi nhận hàng", desc: "Thanh toán trực tiếp khi nhận đơn", icon: "💵" },
  { id: "BANKING", label: "Chuyển khoản ngân hàng", desc: "Chuyển khoản qua app ngân hàng", icon: "🏦" },
];

export default function PaymentPage() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const order = state?.order;

  const [method, setMethod] = useState("COD");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const orderTotal = order?.totalAmount || 0;

  const handlePay = async () => {
    setLoading(true);
    try {
      await paymentService.pay({ orderId: id, amount: orderTotal, method });
      setResult({ success: true });
    } catch {
      setResult({ success: false });
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="flex items-center justify-center py-20 px-4">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-10 text-center">
          <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl ${
            result.success ? "bg-green-100" : "bg-red-100"
          }`}>
            {result.success ? "🎉" : "😞"}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {result.success ? "Thanh toán thành công!" : "Thanh toán thất bại"}
          </h2>
          {result.success && (
            <p className="text-gray-500 mb-8">
              Đơn hàng #{id?.slice(-8)} đã được xác nhận.
            </p>
          )}
          <div className="space-y-3">
            <button
              onClick={() => navigate("/foods")}
              className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl transition hover:from-orange-600 hover:to-amber-600"
            >
              Tiếp tục đặt món
            </button>
            {result.success && (
              <button
                onClick={() => navigate("/orders")}
                className="w-full h-12 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
              >
                Xem đơn hàng
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Thanh toán</h1>

      <div className="space-y-5">
        {order && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Chi tiết đơn hàng</h3>
            <div className="space-y-3">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getFoodEmoji(item.foodName)}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.foodName}</p>
                      <p className="text-xs text-gray-400">x{item.quantity}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {(item.unitPrice * item.quantity).toLocaleString("vi-VN")}đ
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between">
              <span className="font-bold text-gray-900">Tổng cộng</span>
              <span className="font-bold text-orange-600 text-lg">{orderTotal.toLocaleString("vi-VN")}đ</span>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Phương thức thanh toán</h3>
          <div className="space-y-3">
            {METHODS.map((m) => (
              <label
                key={m.id}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  method === m.id
                    ? "border-orange-400 bg-orange-50"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <input type="radio" name="method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} className="sr-only" />
                <span className="text-2xl">{m.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{m.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{m.desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                  method === m.id ? "border-orange-500" : "border-gray-300"
                }`}>
                  {method === m.id && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                </div>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full h-14 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-2xl transition shadow-lg shadow-orange-500/25 disabled:opacity-50 text-base"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Đang xử lý...
            </span>
          ) : `Thanh toán · ${orderTotal.toLocaleString("vi-VN")}đ`}
        </button>
      </div>
    </div>
  );
}
