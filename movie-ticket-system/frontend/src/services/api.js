import axios from "axios";

const userApi = axios.create({ baseURL: import.meta.env.VITE_USER_SERVICE_URL });
const movieApi = axios.create({ baseURL: import.meta.env.VITE_MOVIE_SERVICE_URL });
const bookingApi = axios.create({ baseURL: import.meta.env.VITE_BOOKING_SERVICE_URL });

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
