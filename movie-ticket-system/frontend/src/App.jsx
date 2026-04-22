import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import MoviesPage from "./pages/MoviesPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import BookingPage from "./pages/BookingPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import PaymentsPage from "./pages/PaymentsPage";
import EventFlowPage from "./pages/EventFlowPage";

export default function App() {
  return (
    <Routes>
      {/* Auth pages — full screen, no sidebar */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* App pages — sidebar layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/movies" element={<MoviesPage />} />
        <Route path="/book" element={<BookingPage />} />
        <Route path="/bookings" element={<MyBookingsPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/events" element={<EventFlowPage />} />
      </Route>
    </Routes>
  );
}
