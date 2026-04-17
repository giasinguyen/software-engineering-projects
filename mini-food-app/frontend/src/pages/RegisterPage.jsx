import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", fullName: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError("M\u1EADt kh\u1EA9u kh\u00F4ng kh\u1EDBp");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await register(form.username, form.email, form.fullName, form.password);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "\u0110\u0103ng k\u00FD th\u1EA5t b\u1EA1i");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl">&#127836;</div>
          <span className="text-white text-2xl font-bold">FoodOrder</span>
        </div>
        <div>
          <h1 className="text-white text-4xl font-bold leading-tight mb-4">
            Tham gia<br />c&#7897;ng &#273;&#7891;ng &#7849;m th&#7921;c
          </h1>
          <p className="text-white/80 text-lg">T&#7841;o t&#224;i kho&#7843;n &#273;&#7875; b&#7855;t &#273;&#7847;u &#273;&#7863;t m&#243;n &#259;n y&#234;u th&#237;ch.</p>
        </div>
        <div />
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-xl">&#127836;</div>
              <span className="font-bold text-xl text-gray-900">FoodOrder</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">T&#7841;o t&#224;i kho&#7843;n</h2>
          <p className="text-gray-500 mb-6">&#272;i&#7873;n th&#244;ng tin &#273;&#7875; &#273;&#259;ng k&#253;</p>

          {error && (
            <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">T&#234;n &#273;&#259;ng nh&#7853;p</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                placeholder="username"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">H&#7885; v&#224; t&#234;n</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                placeholder="Nguy&#7877;n V&#259;n A"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                placeholder="email@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">M&#7853;t kh&#7849;u</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                placeholder="T&#7889;i thi&#7875;u 6 k&#253; t&#7921;"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">X&#225;c nh&#7853;n m&#7853;t kh&#7849;u</label>
              <input
                type="password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                placeholder="Nh&#7853;p l&#7841;i m&#7853;t kh&#7849;u"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-xl transition shadow-lg shadow-orange-500/25 disabled:opacity-50"
            >
              {loading ? "&#272;ang x&#7917; l&#253;..." : "&#272;&#259;ng k&#253;"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            &#272;&#227; c&#243; t&#224;i kho&#7843;n?{" "}
            <Link to="/login" className="text-orange-500 font-semibold hover:text-orange-600">&#272;&#259;ng nh&#7853;p</Link>
          </p>
        </div>
      </div>
    </div>
  );
}