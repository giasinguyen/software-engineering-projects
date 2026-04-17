import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import MoviesPage from "./pages/MoviesPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import BookingPage from "./pages/BookingPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import PaymentsPage from "./pages/PaymentsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<MoviesPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/book" element={<BookingPage />} />
        <Route path="/bookings" element={<MyBookingsPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
      </Route>
    </Routes>
  );
}
 
