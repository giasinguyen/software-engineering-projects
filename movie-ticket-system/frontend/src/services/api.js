import axios from "axios";

const userApi = axios.create({ baseURL: import.meta.env.VITE_USER_SERVICE_URL });
const movieApi = axios.create({ baseURL: import.meta.env.VITE_MOVIE_SERVICE_URL });
const bookingApi = axios.create({ baseURL: import.meta.env.VITE_BOOKING_SERVICE_URL });
const paymentApi = axios.create({ baseURL: import.meta.env.VITE_PAYMENT_SERVICE_URL });
const imdbApi = axios.create({ baseURL: "https://api.imdbapi.dev" });

export const authService = {
  register: (data) => userApi.post("/api/users/register", data),
  login: (data) => userApi.post("/api/users/login", data),
};

export const movieService = {
  getAll: () => movieApi.get("/api/movies"),
  create: (data) => movieApi.post("/api/movies", data),
};

export const bookingService = {
  create: (data) => bookingApi.post("/api/bookings", data),
  getByUser: (userId) => bookingApi.get(`/api/bookings/user/${userId}`),
  getAll: () => bookingApi.get("/api/bookings"),
};

export const paymentService = {
  getByUser: (userId) => paymentApi.get(`/api/payments/user/${userId}`),
  getByBooking: (bookingId) => paymentApi.get(`/api/payments/booking/${bookingId}`),
  getAll: () => paymentApi.get("/api/payments"),
};

export const imdbService = {
  getTitle: (imdbId) => imdbApi.get(`/titles/${imdbId}`),
  searchTitles: (query) => imdbApi.get("/search/titles", { params: { query, limit: 1 } }),
};
