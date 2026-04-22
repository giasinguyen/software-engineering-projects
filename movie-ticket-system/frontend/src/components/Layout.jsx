import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/movies", label: "Movies" },
    { to: "/events", label: "Event Flow" },
  ];

  const authLinks = user
    ? [
        { to: "/bookings", label: "My Bookings" },
        { to: "/payments", label: "Payments" },
      ]
    : [];

  return (
    <div className="min-h-screen bg-black">
      {/* ── Floating Top Navbar ──────────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-[90] transition-all duration-300 ${
          scrolled ? "bg-black/90 backdrop-blur-lg border-b border-[#1a1a1a]" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group cursor-pointer">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M2 9h20M7 4v5M17 4v5M7 15v5M17 15v5" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-sm tracking-[0.2em] font-display leading-none">MOVIETIX</p>
              <p className="text-[#555] text-[9px] tracking-[0.15em] mt-0.5">EVENT-DRIVEN</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {[...navLinks, ...authLinks].map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                    isActive
                      ? "text-white bg-[#1a1a1a]"
                      : "text-[#888] hover:text-white hover:bg-[#111]"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-xs font-bold text-white uppercase">
                    {user.username?.[0] || "U"}
                  </div>
                  <span className="text-sm text-[#a0a0a0]">{user.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-1.5 rounded-lg text-sm text-[#888] border border-[#333] hover:text-white hover:border-[#555] transition-colors cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-sm text-[#a0a0a0] hover:text-white transition-colors cursor-pointer"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 rounded-lg text-sm font-medium bg-white text-black hover:bg-[#e0e0e0] transition-colors cursor-pointer"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center text-white cursor-pointer"
            aria-label="Menu"
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-[#0a0a0a] border-t border-[#1a1a1a] animate-slide-in-up">
            <div className="px-6 py-4 space-y-1">
              {[...navLinks, ...authLinks].map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/"}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-4 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
                      isActive ? "text-white bg-[#1a1a1a]" : "text-[#888] hover:text-white"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="pt-3 mt-3 border-t border-[#1a1a1a]">
                {user ? (
                  <button
                    onClick={() => { handleLogout(); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-[#888] hover:text-white transition-colors cursor-pointer"
                  >
                    Sign out ({user.username})
                  </button>
                ) : (
                  <div className="space-y-2">
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="block text-center px-4 py-2.5 rounded-lg text-sm text-[#a0a0a0] border border-[#333] hover:text-white transition-colors cursor-pointer"
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMenuOpen(false)}
                      className="block text-center px-4 py-2.5 rounded-lg text-sm font-medium bg-white text-black hover:bg-[#e0e0e0] transition-colors cursor-pointer"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
