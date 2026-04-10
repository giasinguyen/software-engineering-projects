import axios from "axios";

const USER_SERVICE = import.meta.env.VITE_USER_SERVICE || "http://localhost:8081";
const FOOD_SERVICE = import.meta.env.VITE_FOOD_SERVICE || "http://localhost:8082";
const ORDER_SERVICE = import.meta.env.VITE_ORDER_SERVICE || "http://localhost:8083";
const PAYMENT_SERVICE = import.meta.env.VITE_PAYMENT_SERVICE || "http://localhost:8084";

const withAuth = (instance) => {
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  return instance;
};

export const userApi = withAuth(axios.create({ baseURL: USER_SERVICE }));
export const foodApi = withAuth(axios.create({ baseURL: FOOD_SERVICE }));
export const orderApi = withAuth(axios.create({ baseURL: ORDER_SERVICE }));
export const paymentApi = withAuth(axios.create({ baseURL: PAYMENT_SERVICE }));

// User Service
export const authService = {
  register: (data) => userApi.post("/register", data),
  login: (data) => userApi.post("/login", data),
  getUsers: () => userApi.get("/users"),
};

// Food Service
export const foodService = {
  getAll: () => foodApi.get("/foods"),
  create: (data) => foodApi.post("/foods", data),
  update: (id, data) => foodApi.put(`/foods/${id}`, data),
  delete: (id) => foodApi.delete(`/foods/${id}`),
};

// Order Service
export const orderService = {
  create: (data) => orderApi.post("/orders", data),
  getAll: () => orderApi.get("/orders"),
};

// Payment Service
export const paymentService = {
  pay: (data) => paymentApi.post("/payments", data),
};
