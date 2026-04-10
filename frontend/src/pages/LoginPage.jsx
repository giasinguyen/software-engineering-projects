import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await login(form.username, form.password);
      navigate(user.role === "ADMIN" ? "/admin" : "/foods");
    } catch {
      setError("Sai tên đăng nhập hoặc mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-400 via-amber-400 to-orange-500 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 text-8xl">🍜</div>
          <div className="absolute top-40 right-32 text-6xl">🍛</div>
          <div className="absolute bottom-32 left-40 text-7xl">🍱</div>
          <div className="absolute bottom-20 right-20 text-5xl">🥗</div>
        </div>
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl">🍜</div>
            <span className="text-white text-2xl font-bold">FoodOrder</span>
          </div>
        </div>
        <div className="relative">
          <h1 className="text-white text-4xl font-bold leading-tight mb-4">
            Đặt món ăn<br />nhanh chóng & tiện lợi
          </h1>
          <p className="text-white/80 text-lg max-w-md">
            Hệ thống đặt món nội bộ cho nhân viên. Đa dạng thực đơn, giao hàng tận nơi.
          </p>
        </div>
        <div className="relative flex gap-8 text-white/60 text-sm">
          <div><span className="text-white text-2xl font-bold block">50+</span>Món ăn</div>
          <div><span className="text-white text-2xl font-bold block">100+</span>Nhân viên</div>
          <div><span className="text-white text-2xl font-bold block">4.8★</span>Đánh giá</div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-xl">🍜</div>
              <span className="font-bold text-xl text-gray-900">FoodOrder</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Đăng nhập</h2>
          <p className="text-gray-500 mb-8">Chào mừng bạn quay trở lại</p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tên đăng nhập</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                placeholder="Nhập username"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                placeholder="••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-xl transition shadow-lg shadow-orange-500/25 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang xử lý...
                </span>
              ) : "Đăng nhập"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-8">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="text-orange-500 font-semibold hover:text-orange-600">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
