import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Icons = {
  dashboard: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  movies: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 9h20M7 4v5M12 4v5M17 4v5M7 15v5M12 15v5M17 15v5" strokeLinecap="round" />
    </svg>
  ),
  bookings: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  payments: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20M6 15h4" strokeLinecap="round" />
    </svg>
  ),
  events: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  user: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
    </svg>
  ),
  logout: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

function SideNavItem({ to, icon, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all ${
          isActive
            ? "bg-white text-neutral-900 font-medium shadow-sm"
            : "text-neutral-400 hover:text-white hover:bg-white/10"
        }`
      }
    >
      <span className="shrink-0">{icon}</span>
      {children}
    </NavLink>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-60 bg-[#0a0a0a] flex flex-col z-50">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/[0.07]">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center shrink-0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M2 9h20M7 4v5M17 4v5M7 15v5M17 15v5" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-none tracking-widest">MOVIETIX</p>
              <p className="text-neutral-600 text-[10px] mt-0.5 tracking-wider">EVENT-DRIVEN</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold text-neutral-700 uppercase tracking-widest px-3 mb-2">Main</p>
          <SideNavItem to="/dashboard" icon={Icons.dashboard}>Dashboard</SideNavItem>
          <SideNavItem to="/movies" icon={Icons.movies}>Movies</SideNavItem>
          {user && (
            <>
              <SideNavItem to="/bookings" icon={Icons.bookings}>My Bookings</SideNavItem>
              <SideNavItem to="/payments" icon={Icons.payments}>Payments</SideNavItem>
            </>
          )}
          <div className="pt-3 mt-2">
            <p className="text-[10px] font-semibold text-neutral-700 uppercase tracking-widest px-3 mb-2">System</p>
            <SideNavItem to="/events" icon={Icons.events}>Event Flow</SideNavItem>
          </div>
        </nav>

        {/* User section */}
        <div className="px-3 py-4 border-t border-white/[0.07]">
          {user ? (
            <div>
              <div className="flex items-center gap-3 px-3 py-2 mb-1">
                <div className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center shrink-0 text-neutral-400">
                  {Icons.user}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{user.username}</p>
                  <p className="text-neutral-500 text-xs truncate">{user.email || "Authenticated"}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                {Icons.logout}
                Sign out
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <Link
                to="/login"
                className="flex items-center justify-center w-full px-3 py-2 rounded-md text-sm text-white bg-white/10 hover:bg-white/15 transition-colors font-medium"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="flex items-center justify-center w-full px-3 py-2 rounded-md text-sm text-neutral-400 hover:text-white transition-colors"
              >
                Create account
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-60 flex-1 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
