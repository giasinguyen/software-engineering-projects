import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await authService.login(form);
      login(data);
      navigate("/");
    } catch {
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-black">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-[440px] shrink-0 bg-[#0a0a0a] flex-col justify-between p-10 border-r border-[#111]">
        <Link to="/" className="flex items-center gap-3 cursor-pointer">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M2 9h20M7 4v5M17 4v5M7 15v5M17 15v5" />
            </svg>
          </div>
          <span className="text-white font-bold text-sm tracking-[0.2em] font-display">MOVIETIX</span>
        </Link>
        <div>
          <p className="font-display text-3xl font-bold text-white leading-tight mb-4">
            Event-Driven<br />Ticket Booking
          </p>
          <p className="text-sm text-[#666] leading-relaxed mb-8">
            Asynchronous booking pipeline powered by RabbitMQ.
            Every action triggers an event that flows through the message broker.
          </p>
          <div className="space-y-2.5">
            {["booking.created → payment.queue", "payment.completed → notification.queue", "booking.failed → DLQ"].map((s) => (
              <div key={s} className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#333]" />
                <span className="text-xs font-mono text-[#555]">{s}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-[#333]">MovieTix · Event-Driven Architecture</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10">
            <Link to="/" className="flex items-center gap-3 mb-6 cursor-pointer">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M2 9h20M7 4v5M17 4v5M7 15v5M17 15v5" />
                </svg>
              </div>
              <span className="text-white font-bold text-sm tracking-[0.2em] font-display">MOVIETIX</span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold text-white">Sign in</h1>
            <p className="text-sm text-[#888] mt-1.5">Enter your credentials to continue</p>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2.5 p-3.5 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" className="shrink-0">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              <p className="text-sm text-[#ef4444]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#888] mb-1.5">Username</label>
              <input
                type="text"
                placeholder="Enter your username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-4 py-3 text-sm border border-[#222] rounded-lg bg-[#0a0a0a] text-white placeholder-[#555] focus:outline-none focus:border-[#444] transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#888] mb-1.5">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 text-sm border border-[#222] rounded-lg bg-[#0a0a0a] text-white placeholder-[#555] focus:outline-none focus:border-[#444] transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-white text-black text-sm font-semibold rounded-lg hover:bg-[#e0e0e0] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-sm text-[#888] text-center">
            No account?{" "}
            <Link to="/register" className="text-white font-medium hover:underline cursor-pointer">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
