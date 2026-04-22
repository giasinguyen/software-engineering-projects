import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";
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
      {/* Auth pages — full screen, no navbar */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* App pages — top navbar layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/movies" element={<MoviesPage />} />
        <Route path="/book" element={<BookingPage />} />
        <Route path="/bookings" element={<MyBookingsPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/events" element={<EventFlowPage />} />
      </Route>
    </Routes>
  );
}
