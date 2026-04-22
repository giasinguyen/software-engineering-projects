import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const [form, setForm] = useState({ username: "", password: "", email: "", fullName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await authService.register(form);
      login(data);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const field = (name, label, type, placeholder, required = true) => (
    <div>
      <label className="block text-xs font-semibold text-[#888] mb-1.5">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        className="w-full px-4 py-3 text-sm border border-[#222] rounded-lg bg-[#0a0a0a] text-white placeholder-[#555] focus:outline-none focus:border-[#444] transition-colors"
        required={required}
      />
    </div>
  );

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
            Join MovieTix<br />& Start Booking
          </p>
          <p className="text-sm text-[#666] leading-relaxed mb-8">
            Create an account to browse the catalog, book seats, and track your bookings in real-time as they flow through the event pipeline.
          </p>
          <div className="space-y-3">
            {[
              { label: "Instant booking", desc: "Reserve seats in seconds" },
              { label: "Real-time status", desc: "Track payment processing live" },
              { label: "Full history", desc: "View all transactions" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-[#555]">{item.desc}</p>
                </div>
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
            <h1 className="font-display text-2xl font-bold text-white">Create account</h1>
            <p className="text-sm text-[#888] mt-1.5">Fill in your details to get started</p>
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
            {field("fullName", "Full Name", "text", "Your full name", false)}
            {field("username", "Username", "text", "Choose a username")}
            {field("email", "Email", "email", "your@email.com")}
            {field("password", "Password", "password", "Choose a password")}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-white text-black text-sm font-semibold rounded-lg hover:bg-[#e0e0e0] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-sm text-[#888] text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-white font-medium hover:underline cursor-pointer">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
