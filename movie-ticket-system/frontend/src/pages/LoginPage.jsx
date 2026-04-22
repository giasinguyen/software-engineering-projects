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
      navigate("/dashboard");
    } catch {
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-[420px] shrink-0 bg-[#0a0a0a] flex-col justify-between p-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M2 9h20M7 4v5M17 4v5M7 15v5M17 15v5" />
            </svg>
          </div>
          <span className="text-white font-semibold text-sm tracking-widest">MOVIETIX</span>
        </div>
        <div>
          <p className="text-2xl font-semibold text-white leading-snug mb-3">
            Event-Driven<br />Ticket Booking
          </p>
          <p className="text-sm text-neutral-500 leading-relaxed mb-8">
            Asynchronous booking pipeline powered by RabbitMQ.
            Every action triggers an event that flows through the message broker.
          </p>
          <div className="space-y-2">
            {["booking.created → payment.queue", "payment.completed → notification.queue", "booking.failed → DLQ"].map((s) => (
              <div key={s} className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                <span className="text-xs font-mono text-neutral-500">{s}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-neutral-700">MovieTix · Event-Driven Architecture</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-neutral-50 p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-neutral-900">Sign in</h1>
            <p className="text-sm text-neutral-500 mt-1">Enter your credentials to continue</p>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" className="shrink-0">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Username</label>
              <input
                type="text"
                placeholder="Enter your username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-4 py-2.5 text-sm border border-neutral-200 rounded-lg bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2.5 text-sm border border-neutral-200 rounded-lg bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-500 transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-50 transition-colors"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-sm text-neutral-500 text-center">
            No account?{" "}
            <Link to="/register" className="text-neutral-900 font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
